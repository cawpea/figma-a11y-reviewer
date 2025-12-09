import { describe, expect, it } from '@jest/globals';
import { FigmaNodeData, ScreenshotData } from '@shared/types';

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

    it('スクリーンショット分析セクションを含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('スクリーンショット分析');
      expect(systemPrompt).toContain('視覚的なカラーコントラスト');
      expect(systemPrompt).toContain('タッチターゲットの識別');
    });
  });

  describe('buildPrompt with screenshot', () => {
    const mockData: FigmaNodeData = {
      id: '1:1',
      name: 'Test Container',
      type: 'FRAME',
      absoluteBoundingBox: {
        x: 0,
        y: 0,
        width: 375,
        height: 667,
      },
      fills: [
        {
          type: 'SOLID',
          color: { r: 1, g: 1, b: 1 },
          opacity: 1,
        },
      ],
      children: [
        {
          id: '1:2',
          name: 'Test Text',
          type: 'TEXT',
          characters: 'Hello World',
          fontSize: 16,
          fontName: {
            family: 'Inter',
            style: 'Regular',
          },
          fills: [
            {
              type: 'SOLID',
              color: { r: 0, g: 0, b: 0 },
              opacity: 1,
            },
          ],
        },
      ],
    };

    it('スクリーンショット提供時にプロンプトに視覚的検証セクションが含まれる', () => {
      const agent = new AccessibilityAgent();
      const mockScreenshot: ScreenshotData = {
        imageData: 'data:image/png;base64,mockdata',
        nodeName: 'Test Node',
        nodeId: '1:1',
        byteSize: 1024,
      };
      agent.setScreenshot(mockScreenshot);

      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).toContain('視覚的検証');
      expect(prompt).toContain('画像が提供されています');
      expect(prompt).toContain(
        '計算されたコントラスト比が基準を満たしていても、視覚的に問題がある場合は指摘'
      );
    });

    it('スクリーンショットなしの場合は既存動作を維持', () => {
      const agent = new AccessibilityAgent();
      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).not.toContain('視覚的検証');
      expect(prompt).not.toContain('画像が提供されています');
      expect(prompt).toContain('Figmaノードデータとカラーコントラスト比マップから');
    });

    it('両モードでカラーコントラスト比マップを参照する', () => {
      const agent = new AccessibilityAgent();

      // スクリーンショットなし
      const promptWithoutScreenshot = (agent as any).buildPrompt(mockData);

      // スクリーンショットあり
      const mockScreenshot: ScreenshotData = {
        imageData: 'data:image/png;base64,mockdata',
        nodeName: 'Test Node',
        nodeId: '1:1',
        byteSize: 1024,
      };
      agent.setScreenshot(mockScreenshot);
      const promptWithScreenshot = (agent as any).buildPrompt(mockData);

      expect(promptWithoutScreenshot).toContain('カラーコントラスト比マップ');
      expect(promptWithScreenshot).toContain('カラーコントラスト比マップ');
      expect(promptWithoutScreenshot).toContain(
        'コントラスト比はすでに計算済みなので、マップの値を使用'
      );
      expect(promptWithScreenshot).toContain(
        'コントラスト比はすでに計算済みなので、マップの値を使用'
      );
    });

    it('スクリーンショットありの場合、画像確認の指示が含まれる', () => {
      const agent = new AccessibilityAgent();
      const mockScreenshot: ScreenshotData = {
        imageData: 'data:image/png;base64,mockdata',
        nodeName: 'Test Node',
        nodeId: '1:1',
        byteSize: 1024,
      };
      agent.setScreenshot(mockScreenshot);

      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).toContain('**画像を確認して**、視覚的なアクセシビリティ問題を特定');
      expect(prompt).toContain('背景画像、グラデーション、重なり等');
    });

    it('スクリーンショットなしの場合、画像確認の指示が含まれない', () => {
      const agent = new AccessibilityAgent();
      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).not.toContain('**画像を確認して**');
      expect(prompt).not.toContain('背景画像、グラデーション、重なり等');
    });
  });
});
