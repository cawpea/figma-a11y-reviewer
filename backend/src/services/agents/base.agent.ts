import { anthropic, MODEL_CONFIG } from '../../config/anthropic';
import { FigmaNodeData, CategoryResult } from '../../types';
import { formatFigmaDataForEvaluation, extractJsonFromResponse } from '../../utils/prompt.utils';
import Anthropic from '@anthropic-ai/sdk';

export abstract class BaseEvaluationAgent {
  protected abstract systemPrompt: string;
  protected abstract category: string;

  /**
   * Claude APIを呼び出す
   */
  protected async callClaude(prompt: string): Promise<Anthropic.Message> {
    try {
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

      return response;
    } catch (error) {
      console.error(`Error calling Claude API for ${this.category}:`, error);
      throw error;
    }
  }

  /**
   * Claudeのレスポンスをパース
   */
  protected parseResponse(response: Anthropic.Message): CategoryResult {
    const textContent = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (!textContent) {
      throw new Error('No text content in response');
    }

    try {
      const result = extractJsonFromResponse(textContent.text);
      
      // 基本的なバリデーション
      if (typeof result.score !== 'number' || !Array.isArray(result.issues)) {
        throw new Error('Invalid response format');
      }

      return result;
    } catch (error) {
      console.error('Failed to parse response:', textContent.text);
      throw new Error(`Failed to parse ${this.category} evaluation result: ${error}`);
    }
  }

  /**
   * 評価を実行
   */
  async evaluate(data: FigmaNodeData): Promise<CategoryResult> {
    const prompt = this.buildPrompt(data);
    const response = await this.callClaude(prompt);
    return this.parseResponse(response);
  }

  /**
   * プロンプトを構築（サブクラスで実装）
   */
  protected abstract buildPrompt(data: FigmaNodeData): string;
}