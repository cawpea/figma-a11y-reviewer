import { anthropic, MODEL_CONFIG } from '../../config/anthropic';
import { FigmaNodeData, CategoryResult } from '../../types';
import { savePromptAndResponse } from '../../utils/debug';
import { extractJsonFromResponse, extractNodeHierarchyPath } from '../../utils/prompt.utils';
import Anthropic from '@anthropic-ai/sdk';

export abstract class BaseEvaluationAgent {
  protected abstract systemPrompt: string;
  protected abstract category: string;

  /**
   * Claude APIを呼び出す
   */
  protected async callClaude(prompt: string): Promise<Anthropic.Message> {
    try {
      // プロンプトをログ出力
      console.log(`${'='.repeat(80)}`);
      console.log(`🤖 Calling Claude API for: ${this.category}`);
      console.log(`${'='.repeat(80)}`);
      console.log(`SYSTEM PROMPT: ${this.systemPrompt.length}`);
      console.log(`USER PROMPT (first 1000 chars): ${prompt.length}`);
      console.log('='.repeat(80) + '\n');

      const response = await anthropic.messages.create({
        model: MODEL_CONFIG.default,
        max_tokens: MODEL_CONFIG.maxTokens,
        temperature: MODEL_CONFIG.temperature,
        system: this.systemPrompt,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      // ファイルに保存
      savePromptAndResponse(this.systemPrompt, prompt, this.category, response);

      // レスポンスもログ出力
      console.log(`✅ Claude API response received for: ${this.category}`);
      console.log(`   Input tokens: ${response.usage.input_tokens}`);
      console.log(`   Output tokens: ${response.usage.output_tokens}`);
      console.log(`   Stop reason: ${response.stop_reason}\n`);

      return response;
    } catch (error) {
      console.error(`❌ Error calling Claude API for ${this.category}:`, error);
      throw error;
    }
  }

  /**
   * Claudeのレスポンスをパース
   */
  protected parseResponse(response: Anthropic.Message, rootNodeData: FigmaNodeData): CategoryResult {
    const textContent = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (!textContent) {
      throw new Error('No text content in response');
    }

    try {
      const result = extractJsonFromResponse(textContent.text);

      if (typeof result.score !== 'number' || !Array.isArray(result.issues)) {
        throw new Error('Invalid response format');
      }

      // nodeIdの形式を検証 & 階層パスを追加
      if (result.issues) {
        result.issues.forEach((issue: any) => {
          if (issue.nodeId) {
            // nodeIdの形式を検証
            // 通常のノード: "1809:1836"
            // インスタンスノード: "I1806:932;589:1207"
            // ネストされたインスタンス: "I1806:984;1809:902;105:1169"
            if (!issue.nodeId.match(/^[I]?\d+:\d+(;\d+:\d+)*$/)) {
              console.warn(
                `⚠️  Invalid nodeId format in ${this.category}: "${issue.nodeId}". ` +
                `Expected formats: "xxxx:xxxx" or "Ixxxx:xxxx;xxxx:xxxx". Removing nodeId.`
              );
              delete issue.nodeId;
            } else {
              // 有効なnodeIdの場合、階層パスを抽出して追加
              const hierarchy = extractNodeHierarchyPath(rootNodeData, issue.nodeId);
              if (hierarchy) {
                issue.nodeHierarchy = hierarchy;
                console.log(`✅ Added hierarchy for nodeId ${issue.nodeId}:`, hierarchy);
              } else {
                console.warn(`⚠️  Could not find hierarchy path for nodeId: ${issue.nodeId}`);
              }
            }
          }
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to parse response:', textContent.text);
      throw new Error(`Failed to parse ${this.category} evaluation result: ${error}`);
    }
  }

  async evaluate(data: FigmaNodeData): Promise<CategoryResult> {
    const prompt = this.buildPrompt(data);
    const response = await this.callClaude(prompt);
    return this.parseResponse(response, data);
  }

  protected abstract buildPrompt(data: FigmaNodeData): string;
}