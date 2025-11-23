import { describe, expect, it } from '@jest/globals';
import { FigmaNodeData } from '@shared/types';

import { EvaluationService } from './evaluation.service';

describe('EvaluationService', () => {
  let service: EvaluationService;

  beforeEach(() => {
    service = new EvaluationService();
  });

  describe('evaluateDesign', () => {
    const mockData: FigmaNodeData = {
      id: '1:1',
      name: 'Test Frame',
      type: 'FRAME',
      absoluteBoundingBox: {
        x: 0,
        y: 0,
        width: 375,
        height: 667,
      },
    };

    it('デフォルトですべてのエージェントを評価する', async () => {
      const result = await service.evaluateDesign(mockData);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.categories).toHaveProperty('accessibility');
      expect(result.categories).toHaveProperty('styleConsistency');
      expect(result.categories).toHaveProperty('usability');
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.metadata).toHaveProperty('evaluatedAt');
      expect(result.metadata).toHaveProperty('duration');
      expect(result.metadata.rootNodeId).toBe('1:1');
    });

    it('指定されたタイプのみを評価する', async () => {
      const result = await service.evaluateDesign(mockData, undefined, ['accessibility']);

      expect(result.categories).toHaveProperty('accessibility');
      expect(result.categories).not.toHaveProperty('styleConsistency');
      expect(result.categories).not.toHaveProperty('usability');
    });

    it('複数の指定されたタイプを評価する', async () => {
      const result = await service.evaluateDesign(mockData, undefined, [
        'accessibility',
        'usability',
      ]);

      expect(result.categories).toHaveProperty('accessibility');
      expect(result.categories).toHaveProperty('usability');
      expect(result.categories).not.toHaveProperty('styleConsistency');
    });

    it('有効な評価タイプが提供されていないときにエラーをスローする', async () => {
      await expect(service.evaluateDesign(mockData, undefined, ['invalid'])).rejects.toThrow(
        'No valid evaluation types provided'
      );
    });

    it('総合スコアを平均として計算する', async () => {
      const result = await service.evaluateDesign(mockData);

      const scores = Object.values(result.categories).map((c) => c.score);
      const expectedAvg = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

      expect(result.overallScore).toBe(expectedAvg);
    });

    it('提案を重要度でソートする', async () => {
      const result = await service.evaluateDesign(mockData);

      if (result.suggestions.length > 1) {
        const severityOrder = { high: 0, medium: 1, low: 2 };

        for (let i = 0; i < result.suggestions.length - 1; i++) {
          const current = severityOrder[result.suggestions[i].severity];
          const next = severityOrder[result.suggestions[i + 1].severity];
          expect(current).toBeLessThanOrEqual(next);
        }
      }
    });

    it('提案にカテゴリを含む', async () => {
      const result = await service.evaluateDesign(mockData);

      result.suggestions.forEach((suggestion) => {
        expect(suggestion).toHaveProperty('category');
        expect(typeof suggestion.category).toBe('string');
      });
    });

    it('使用量とコストを計算する', async () => {
      const result = await service.evaluateDesign(mockData);

      expect(result.metadata.usage).toHaveProperty('totalInputTokens');
      expect(result.metadata.usage).toHaveProperty('totalOutputTokens');
      expect(result.metadata.usage).toHaveProperty('estimatedCost');
      expect(result.metadata.usage?.totalInputTokens).toBeGreaterThan(0);
      expect(result.metadata.usage?.totalOutputTokens).toBeGreaterThan(0);
      expect(result.metadata.usage?.estimatedCost).toBeGreaterThan(0);
    });

    it('指定された場合にカスタムrootNodeIdを使用する', async () => {
      const customRootId = 'custom-root-123';
      const result = await service.evaluateDesign(mockData, undefined, undefined, customRootId);

      expect(result.metadata.rootNodeId).toBe(customRootId);
    });

    it('評価期間を追跡する', async () => {
      const result = await service.evaluateDesign(mockData);

      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.metadata.duration).toBe('number');
    });

    it('複雑なノード構造を処理する', async () => {
      const complexData: FigmaNodeData = {
        id: 'root',
        name: 'App',
        type: 'FRAME',
        children: [
          {
            id: 'header',
            name: 'Header',
            type: 'FRAME',
            layoutMode: 'HORIZONTAL',
            children: [
              {
                id: 'logo',
                name: 'Logo',
                type: 'TEXT',
                characters: 'MyApp',
              },
            ],
          },
          {
            id: 'content',
            name: 'Content',
            type: 'FRAME',
            layoutMode: 'VERTICAL',
          },
        ],
      };

      const result = await service.evaluateDesign(complexData);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('無効な評価タイプをフィルタリングする', async () => {
      const result = await service.evaluateDesign(mockData, undefined, [
        'accessibility',
        'invalid',
        'usability',
      ]);

      expect(result.categories).toHaveProperty('accessibility');
      expect(result.categories).toHaveProperty('usability');
      expect(result.categories).not.toHaveProperty('invalid');
    });

    it('空の評価タイプ配列を処理する', async () => {
      await expect(service.evaluateDesign(mockData, undefined, [])).rejects.toThrow(
        'No valid evaluation types provided'
      );
    });
  });

  describe('エージェント初期化', () => {
    it('すべての必要なエージェントを持つ', () => {
      const agents = (service as any).agents;

      expect(agents).toHaveProperty('accessibility');
      expect(agents).toHaveProperty('styleConsistency');
      expect(agents).toHaveProperty('usability');
    });
  });
});
