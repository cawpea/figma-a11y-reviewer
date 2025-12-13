"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEvaluationAgent = void 0;
const anthropic_1 = require("../../config/anthropic");
const debug_1 = require("../../utils/debug");
const prompt_utils_1 = require("../../utils/prompt.utils");
class BaseEvaluationAgent {
    // スクリーンショットを保持（サブクラスで設定可能）
    screenshot = null;
    // ユーザーコンテキストを保持（UsabilityAgentで使用）
    userContext = null;
    // ユーザー提供のAPI Keyを保持
    apiKey = null;
    /**
     * API Keyを設定
     * EvaluationServiceから呼び出される
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }
    /**
     * スクリーンショットを設定
     * EvaluationServiceから呼び出される
     */
    setScreenshot(screenshot) {
        this.screenshot = screenshot;
    }
    /**
     * ユーザーコンテキストを設定
     * EvaluationServiceから呼び出される
     */
    setUserContext(userContext) {
        this.userContext = userContext;
    }
    /**
     * Claude APIを呼び出す（Vision API対応）
     */
    async callClaude(prompt) {
        try {
            // API Keyが設定されていない場合はエラー
            if (!this.apiKey) {
                throw new Error('API Key is required but not set');
            }
            // ユーザー提供のAPI Keyから動的にクライアントを生成
            const client = (0, anthropic_1.createAnthropicClient)(this.apiKey);
            // ContentBlock配列を構築
            const contentBlocks = [];
            // スクリーンショットがある場合は先頭に追加
            if (this.screenshot) {
                const base64Data = this.screenshot.imageData.replace(/^data:image\/png;base64,/, '');
                contentBlocks.push({
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: 'image/png',
                        data: base64Data,
                    },
                });
                console.log(`📷 Screenshot included for ${this.category} evaluation`);
                console.log(`   Size: ${(this.screenshot.byteSize / 1024).toFixed(2)} KB`);
            }
            // テキストプロンプトを追加
            contentBlocks.push({
                type: 'text',
                text: prompt,
            });
            // プロンプトをログ出力
            console.log(`${'='.repeat(80)}`);
            console.log(`🤖 Calling Claude API for: ${this.category}`);
            console.log(`${'='.repeat(80)}`);
            console.log(`SYSTEM PROMPT: ${this.systemPrompt.length} chars`);
            console.log(`USER PROMPT: ${prompt.length} chars`);
            console.log(`CONTENT BLOCKS: ${contentBlocks.length} (${this.screenshot ? 'image + text' : 'text only'})`);
            console.log('='.repeat(80) + '\n');
            const response = await client.messages.create({
                model: anthropic_1.MODEL_CONFIG.default,
                max_tokens: anthropic_1.MODEL_CONFIG.maxTokens,
                temperature: anthropic_1.MODEL_CONFIG.temperature,
                system: this.systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: contentBlocks,
                    },
                ],
            });
            // ファイルに保存
            (0, debug_1.savePromptAndResponse)(this.systemPrompt, prompt, this.category, response);
            // レスポンスもログ出力
            console.log(`✅ Claude API response received for: ${this.category}`);
            console.log(`   Input tokens: ${response.usage.input_tokens}`);
            console.log(`   Output tokens: ${response.usage.output_tokens}`);
            console.log(`   Stop reason: ${response.stop_reason}\n`);
            return response;
        }
        catch (error) {
            console.error(`❌ Error calling Claude API for ${this.category}:`, error);
            throw error;
        }
        finally {
            this.screenshot = null; // 呼び出し後にスクリーンショットをクリア
            this.userContext = null; // 呼び出し後にユーザーコンテキストをクリア
            this.apiKey = null; // 呼び出し後にAPI Keyをクリア
        }
    }
    /**
     * Claudeのレスポンスをパース
     */
    parseResponse(response, rootNodeData) {
        const textContent = response.content.find((block) => block.type === 'text');
        if (!textContent) {
            throw new Error('No text content in response');
        }
        try {
            const result = (0, prompt_utils_1.extractJsonFromResponse)(textContent.text);
            if (!Array.isArray(result.issues)) {
                throw new Error('Invalid response format');
            }
            // nodeIdの形式を検証 & 階層パスを追加
            if (result.issues) {
                result.issues.forEach((issue) => {
                    if (issue.nodeId) {
                        // nodeIdの形式を検証
                        // 通常のノード: "1809:1836"
                        // インスタンスノード: "I1806:932;589:1207"
                        // ネストされたインスタンス: "I1806:984;1809:902;105:1169"
                        if (!this.validateNodeIdFormat(issue.nodeId)) {
                            console.warn(`⚠️  Invalid nodeId format in ${this.category}: "${issue.nodeId}". ` +
                                `Expected formats: "xxxx:xxxx" or "Ixxxx:xxxx;xxxx:xxxx". Removing nodeId.`);
                            delete issue.nodeId;
                        }
                        else {
                            // 有効なnodeIdの場合、階層パスを抽出して追加
                            const hierarchy = (0, prompt_utils_1.extractNodeHierarchyPath)(rootNodeData, issue.nodeId);
                            if (hierarchy) {
                                issue.nodeHierarchy = hierarchy;
                            }
                            else {
                                console.warn(`⚠️  Could not find hierarchy path for nodeId: ${issue.nodeId}`);
                            }
                        }
                    }
                });
            }
            return result;
        }
        catch (error) {
            console.error('Failed to parse response:', textContent.text);
            throw new Error(`Failed to parse ${this.category} evaluation result: ${error}`);
        }
    }
    /**
     * nodeIdの形式を検証（ReDoS脆弱性を回避するため文字列解析を使用）
     */
    validateNodeIdFormat(nodeId) {
        // 基本的な長さチェック（異常に長い入力を早期に拒否）
        if (nodeId.length > 1000) {
            return false;
        }
        // 先頭のIを除去
        const normalized = nodeId.startsWith('I') ? nodeId.slice(1) : nodeId;
        // セミコロンで分割
        const segments = normalized.split(';');
        // 各セグメントが "数字:数字" の形式か確認
        return segments.every((segment) => {
            const parts = segment.split(':');
            if (parts.length !== 2)
                return false;
            // 各パーツが数字のみで構成されているか確認（短い正規表現は安全）
            return /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1]);
        });
    }
    async evaluate(data) {
        const prompt = this.buildPrompt(data);
        const response = await this.callClaude(prompt);
        return {
            result: this.parseResponse(response, data),
            usage: response.usage,
        };
    }
}
exports.BaseEvaluationAgent = BaseEvaluationAgent;
