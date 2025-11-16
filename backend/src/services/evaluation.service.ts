import { FigmaNodeData, EvaluationResult, CategoryResult, Suggestion } from '../types';
import { AccessibilityAgent } from './agents/accessibility.agent';
import { DesignSystemAgent } from './agents/design-system.agent';

export class EvaluationService {
  private agents = {
    accessibility: new AccessibilityAgent(),
    designSystem: new DesignSystemAgent(),
  };

  /**
   * デザインを評価
   */
  async evaluateDesign(
    data: FigmaNodeData,
    evaluationTypes?: string[]
  ): Promise<EvaluationResult> {
    const startTime = Date.now();

    // 評価タイプが指定されていない場合は全て実行
    const typesToRun = evaluationTypes || Object.keys(this.agents);

    console.log(`Starting evaluation for types: ${typesToRun.join(', ')}`);

    // 並列実行
    const evaluationPromises = typesToRun.map(async (type) => {
      const agent = this.agents[type as keyof typeof this.agents];
      if (!agent) {
        console.warn(`Unknown evaluation type: ${type}`);
        return null;
      }

      try {
        console.log(`Evaluating ${type}...`);
        const result = await agent.evaluate(data);
        console.log(`${type} evaluation completed. Score: ${result.score}`);
        return { type, result };
      } catch (error) {
        console.error(`Error in ${type} evaluation:`, error);
        return {
          type,
          result: {
            score: 0,
            issues: [{
              severity: 'high' as const,
              message: `評価中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
              autoFixable: false,
            }],
          },
        };
      }
    });

    const evaluations = (await Promise.all(evaluationPromises))
      .filter((e): e is { type: string; result: CategoryResult } => e !== null);

    // 結果を集約
    const categories: { [key: string]: CategoryResult } = {};
    const allSuggestions: Suggestion[] = [];

    evaluations.forEach(({ type, result }) => {
      categories[type] = result;
      
      // issuesをsuggestionsに変換
      result.issues.forEach(issue => {
        allSuggestions.push({
          category: type,
          ...issue,
        });
      });
    });

    // 総合スコアを計算（各カテゴリの加重平均）
    const scores = Object.values(categories).map(c => c.score);
    const overallScore = scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

    // 重要度順にソート
    const sortedSuggestions = allSuggestions.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const duration = Date.now() - startTime;
    console.log(`Evaluation completed in ${duration}ms. Overall score: ${overallScore}`);

    return {
      overallScore,
      categories,
      suggestions: sortedSuggestions,
      metadata: {
        evaluatedAt: new Date(),
        duration,
      },
    };
  }
}