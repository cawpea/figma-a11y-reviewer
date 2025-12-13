"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationService = void 0;
const accessibility_a_agent_1 = require("./agents/accessibility-a.agent");
const accessibility_aa_agent_1 = require("./agents/accessibility-aa.agent");
const accessibility_aaa_agent_1 = require("./agents/accessibility-aaa.agent");
// Claude Sonnet 4 の料金（2025年1月時点）
// 参考: https://www.anthropic.com/pricing
const PRICING = {
    inputPerMillion: 3.0, // $3.00 per million input tokens
    outputPerMillion: 15.0, // $15.00 per million output tokens
    cachedPerMillion: 0.3, // $0.30 per million cached tokens (10% of input)
};
class EvaluationService {
    agents = {
        'accessibility-a': new accessibility_a_agent_1.AccessibilityAAgent(),
        'accessibility-aa': new accessibility_aa_agent_1.AccessibilityAAAgent(),
        'accessibility-aaa': new accessibility_aaa_agent_1.AccessibilityAAAAgent(),
    };
    /**
     * デザインを評価
     */
    async evaluateDesign(data, apiKey, stylesData, evaluationTypes, rootNodeId, screenshot) {
        const startTime = Date.now();
        // API Keyの検証
        if (!apiKey) {
            throw new Error('API Key is required');
        }
        // 評価タイプが指定されていない場合は全て実行
        const typesToRun = evaluationTypes
            ? evaluationTypes.filter((type) => type in this.agents)
            : Object.keys(this.agents);
        if (evaluationTypes && typesToRun.length === 0) {
            throw new Error('No valid evaluation types provided');
        }
        console.log(`Starting evaluation for types: ${typesToRun.join(', ')}`);
        if (screenshot) {
            console.log(`📷 Screenshot provided: ${(screenshot.byteSize / 1024).toFixed(2)} KB`);
        }
        // 並列実行
        const evaluationPromises = typesToRun.map(async (type) => {
            const agent = this.agents[type];
            if (!agent) {
                console.warn(`Unknown evaluation type: ${type}`);
                return null;
            }
            // API Keyをエージェントに注入
            agent.setApiKey(apiKey);
            // スクリーンショットをエージェントに注入
            if (screenshot) {
                agent.setScreenshot(screenshot);
            }
            try {
                console.log(`🧪 Evaluating ${type}...`);
                const { result, usage } = await agent.evaluate(data);
                console.log(`🧪 ${type} evaluation completed`);
                return { type, result, usage };
            }
            catch (error) {
                console.error(`Error in ${type} evaluation:`, error);
                return {
                    type,
                    result: {
                        issues: [
                            {
                                severity: 'high',
                                message: `🧪 評価中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
                                autoFixable: false,
                            },
                        ],
                    },
                    usage: {
                        input_tokens: 0,
                        output_tokens: 0,
                        cache_creation_input_tokens: 0,
                        cache_read_input_tokens: 0,
                    },
                };
            }
        });
        const evaluations = (await Promise.all(evaluationPromises)).filter((e) => e !== null);
        // 結果を集約
        const categories = {};
        const allSuggestions = [];
        // トークン使用量を集計
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCachedTokens = 0;
        evaluations.forEach(({ type, result, usage }) => {
            categories[type] = result;
            // issuesをsuggestionsに変換
            result.issues.forEach((issue) => {
                allSuggestions.push({
                    category: type,
                    ...issue,
                });
            });
            // トークン使用量を集計
            totalInputTokens += usage.input_tokens;
            totalOutputTokens += usage.output_tokens;
            totalCachedTokens += usage.cache_read_input_tokens || 0;
        });
        // 重要度順にソート
        const sortedSuggestions = allSuggestions.sort((a, b) => {
            const severityOrder = { high: 0, medium: 1, low: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
        const duration = Date.now() - startTime;
        // コストを計算
        const estimatedCost = (totalInputTokens / 1_000_000) * PRICING.inputPerMillion +
            (totalOutputTokens / 1_000_000) * PRICING.outputPerMillion +
            (totalCachedTokens / 1_000_000) * PRICING.cachedPerMillion;
        console.log(`Evaluation completed in ${duration}ms`);
        console.log(`Token usage: ${totalInputTokens} input, ${totalOutputTokens} output, ${totalCachedTokens} cached`);
        console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`);
        return {
            categories,
            suggestions: sortedSuggestions,
            metadata: {
                evaluatedAt: new Date(),
                duration,
                rootNodeId: rootNodeId || data.id,
                usage: {
                    totalInputTokens,
                    totalOutputTokens,
                    totalCachedTokens,
                    estimatedCost,
                },
            },
        };
    }
}
exports.EvaluationService = EvaluationService;
