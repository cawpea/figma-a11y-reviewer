import { describe, expect, it } from '@jest/globals';
import { FigmaNodeData } from '@shared/types';

import { AccessibilityAgent } from './accessibility.agent';

describe('AccessibilityAgent', () => {
  let agent: AccessibilityAgent;

  beforeEach(() => {
    agent = new AccessibilityAgent();
  });

  describe('evaluate', () => {
    it('評価にフォーマットされたFigmaデータを含む', async () => {
      const mockData: FigmaNodeData = {
        id: '1:1',
        name: 'Button',
        type: 'FRAME',
        absoluteBoundingBox: {
          x: 0,
          y: 0,
          width: 120,
          height: 44,
        },
      };

      const result = await agent.evaluate(mockData);

      expect(Array.isArray(result.result.issues)).toBe(true);
    });

    it('低コントラストのテキストノードを処理する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 }, // 白背景
            opacity: 1,
          },
        ],
        children: [
          {
            id: 'lowContrast',
            name: 'Low Contrast Text',
            type: 'TEXT',
            fills: [
              {
                type: 'SOLID',
                color: { r: 0.8, g: 0.8, b: 0.8 }, // グレー文字（低コントラスト）
                opacity: 1,
              },
            ],
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      expect(Array.isArray(result.result.issues)).toBe(true);
    });
  });

  describe('category', () => {
    it('accessibilityカテゴリを持つ', () => {
      expect((agent as any).category).toBe('accessibility');
    });
  });

  describe('systemPrompt', () => {
    it('WCAGガイドラインを含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('WCAG');
      expect(systemPrompt).toContain('4.5:1');
      expect(systemPrompt).toContain('3:1');
      expect(systemPrompt).toContain('44x44px');
    });

    it('アクセシビリティ評価基準を含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('カラーコントラスト比');
      expect(systemPrompt).toContain('タッチターゲットサイズ');
      expect(systemPrompt).toContain('テキストの可読性');
      expect(systemPrompt).toContain('構造の論理性');
    });
  });
});
