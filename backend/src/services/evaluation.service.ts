import Anthropic from '@anthropic-ai/sdk';
import {
  CategoryResult,
  EvaluationResult,
  FigmaNodeData,
  FigmaStylesData,
  Suggestion,
} from '@shared/types';

import { AccessibilityAgent } from './agents/accessibility.agent';
import { StyleConsistencyAgent } from './agents/style-consistency.agent';
import { UsabilityAgent } from './agents/usability.agent';

// Claude Sonnet 4 の料金（2025年1月時点）
// 参考: https://www.anthropic.com/pricing
const PRICING = {
  inputPerMillion: 3.0, // $3.00 per million input tokens
  outputPerMillion: 15.0, // $15.00 per million output tokens
  cachedPerMillion: 0.3, // $0.30 per million cached tokens (10% of input)
};

export class EvaluationService {
  private agents = {
    accessibility: new AccessibilityAgent(),
    styleConsistency: new StyleConsistencyAgent(),
    usability: new UsabilityAgent(),
  };

  /**
   * デザインを評価
   */
  async evaluateDesign(
    data: FigmaNodeData,
    stylesData?: FigmaStylesData,
    evaluationTypes?: string[],
    rootNodeId?: string
  ): Promise<EvaluationResult> {
    const startTime = Date.now();

    // 評価タイプが指定されていない場合は全て実行
    const typesToRun = evaluationTypes
      ? evaluationTypes.filter((type) => type in this.agents)
      : Object.keys(this.agents);

    if (evaluationTypes && typesToRun.length === 0) {
      throw new Error('No valid evaluation types provided');
    }

    console.log(`Starting evaluation for types: ${typesToRun.join(', ')}`);

    // 並列実行
    const evaluationPromises = typesToRun.map(async (type) => {
      const agent = this.agents[type as keyof typeof this.agents];
      if (!agent) {
        console.warn(`Unknown evaluation type: ${type}`);
        return null;
      }

      // StyleConsistencyAgentにスタイル情報を渡す
      if (type === 'styleConsistency' && agent instanceof StyleConsistencyAgent) {
        agent.setStylesData(stylesData);
      }

      try {
        console.log(`🧪 Evaluating ${type}...`);
        const { result, usage } = await agent.evaluate(data);
        console.log(`🧪 ${type} evaluation completed. Score: ${result.score}`);
        return { type, result, usage };
      } catch (error) {
        console.error(`Error in ${type} evaluation:`, error);
        return {
          type,
          result: {
            score: 0,
            issues: [
              {
                severity: 'high' as const,
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
          } as Anthropic.Usage,
        };
      }
    });

    const evaluations = (await Promise.all(evaluationPromises)).filter(
      (e): e is { type: string; result: CategoryResult; usage: Anthropic.Usage } => e !== null
    );

    // 結果を集約
    const categories: { [key: string]: CategoryResult } = {};
    const allSuggestions: Suggestion[] = [];

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

    // 総合スコアを計算（各カテゴリの加重平均）
    const scores = Object.values(categories).map((c) => c.score);
    const overallScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;

    // 重要度順にソート
    const sortedSuggestions = allSuggestions.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const duration = Date.now() - startTime;

    // コストを計算
    const estimatedCost =
      (totalInputTokens / 1_000_000) * PRICING.inputPerMillion +
      (totalOutputTokens / 1_000_000) * PRICING.outputPerMillion +
      (totalCachedTokens / 1_000_000) * PRICING.cachedPerMillion;

    console.log(`Evaluation completed in ${duration}ms. Overall score: ${overallScore}`);
    console.log(
      `Token usage: ${totalInputTokens} input, ${totalOutputTokens} output, ${totalCachedTokens} cached`
    );
    console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`);

    return {
      overallScore,
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
