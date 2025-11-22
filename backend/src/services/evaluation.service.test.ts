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

    it('should evaluate all agents by default', async () => {
      const result = await service.evaluateDesign(mockData);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.categories).toHaveProperty('accessibility');
      expect(result.categories).toHaveProperty('designSystem');
      expect(result.categories).toHaveProperty('usability');
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.metadata).toHaveProperty('evaluatedAt');
      expect(result.metadata).toHaveProperty('duration');
      expect(result.metadata.rootNodeId).toBe('1:1');
    });

    it('should evaluate only specified types', async () => {
      const result = await service.evaluateDesign(mockData, ['accessibility']);

      expect(result.categories).toHaveProperty('accessibility');
      expect(result.categories).not.toHaveProperty('designSystem');
      expect(result.categories).not.toHaveProperty('usability');
    });

    it('should evaluate multiple specified types', async () => {
      const result = await service.evaluateDesign(mockData, ['accessibility', 'usability']);

      expect(result.categories).toHaveProperty('accessibility');
      expect(result.categories).toHaveProperty('usability');
      expect(result.categories).not.toHaveProperty('designSystem');
    });

    it('should throw error when no valid evaluation types provided', async () => {
      await expect(service.evaluateDesign(mockData, ['invalid'])).rejects.toThrow(
        'No valid evaluation types provided'
      );
    });

    it('should calculate overall score as average', async () => {
      const result = await service.evaluateDesign(mockData);

      const scores = Object.values(result.categories).map((c) => c.score);
      const expectedAvg = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

      expect(result.overallScore).toBe(expectedAvg);
    });

    it('should sort suggestions by severity', async () => {
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

    it('should include category in suggestions', async () => {
      const result = await service.evaluateDesign(mockData);

      result.suggestions.forEach((suggestion) => {
        expect(suggestion).toHaveProperty('category');
        expect(typeof suggestion.category).toBe('string');
      });
    });

    it('should calculate usage and cost', async () => {
      const result = await service.evaluateDesign(mockData);

      expect(result.metadata.usage).toHaveProperty('totalInputTokens');
      expect(result.metadata.usage).toHaveProperty('totalOutputTokens');
      expect(result.metadata.usage).toHaveProperty('estimatedCost');
      expect(result.metadata.usage?.totalInputTokens).toBeGreaterThan(0);
      expect(result.metadata.usage?.totalOutputTokens).toBeGreaterThan(0);
      expect(result.metadata.usage?.estimatedCost).toBeGreaterThan(0);
    });

    it('should use custom rootNodeId when provided', async () => {
      const customRootId = 'custom-root-123';
      const result = await service.evaluateDesign(mockData, undefined, customRootId);

      expect(result.metadata.rootNodeId).toBe(customRootId);
    });

    it('should track evaluation duration', async () => {
      const result = await service.evaluateDesign(mockData);

      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.metadata.duration).toBe('number');
    });

    it('should handle complex node structure', async () => {
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

    it('should filter out invalid evaluation types', async () => {
      const result = await service.evaluateDesign(mockData, [
        'accessibility',
        'invalid',
        'usability',
      ]);

      expect(result.categories).toHaveProperty('accessibility');
      expect(result.categories).toHaveProperty('usability');
      expect(result.categories).not.toHaveProperty('invalid');
    });

    it('should handle empty evaluation types array', async () => {
      await expect(service.evaluateDesign(mockData, [])).rejects.toThrow(
        'No valid evaluation types provided'
      );
    });
  });

  describe('Agent initialization', () => {
    it('should have all required agents', () => {
      const agents = (service as any).agents;

      expect(agents).toHaveProperty('accessibility');
      expect(agents).toHaveProperty('designSystem');
      expect(agents).toHaveProperty('usability');
    });
  });
});
