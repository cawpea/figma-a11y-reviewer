import { describe, expect, it } from '@jest/globals';
import { FigmaNodeData } from '@shared/types';

import { PlatformAndroidAgent } from './platform-android.agent';

describe('PlatformAndroidAgent', () => {
  let agent: PlatformAndroidAgent;

  beforeEach(() => {
    agent = new PlatformAndroidAgent();
  });

  describe('evaluate', () => {
    it('評価にフォーマットされたFigmaデータを含む', async () => {
      const mockData: FigmaNodeData = {
        id: '1:1',
        name: 'Android Button',
        type: 'FRAME',
        absoluteBoundingBox: {
          x: 0,
          y: 0,
          width: 120,
          height: 48,
        },
      };

      const result = await agent.evaluate(mockData);

      expect(result.result.score).toBeGreaterThanOrEqual(0);
      expect(result.result.score).toBeLessThanOrEqual(100);
    });

    it('Android FAB（Floating Action Button）を評価する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'FAB Container',
        type: 'FRAME',
        children: [
          {
            id: 'fab',
            name: 'FAB',
            type: 'FRAME',
            absoluteBoundingBox: {
              x: 0,
              y: 0,
              width: 56, // Material Design標準の56dp
              height: 56,
            },
            cornerRadius: 16,
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      expect(result.result.score).toBeGreaterThanOrEqual(0);
      expect(result.result.score).toBeLessThanOrEqual(100);
    });

    it('タッチターゲットサイズ不足のアイコンボタンを処理する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'smallIconButton',
            name: 'Small Icon Button',
            type: 'FRAME',
            absoluteBoundingBox: {
              x: 0,
              y: 0,
              width: 36, // 48dp未満
              height: 36,
            },
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      expect(result.result.score).toBeGreaterThanOrEqual(0);
      expect(result.result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('category', () => {
    it('platformComplianceカテゴリを持つ', () => {
      expect((agent as any).category).toBe('platformCompliance');
    });
  });

  describe('systemPrompt', () => {
    it('Material Designを参照する', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('Material Design');
      expect(systemPrompt).toContain('Material 3');
      expect(systemPrompt).toContain('Material You');
      expect(systemPrompt).toContain('Android');
    });

    it('最新ガイドラインの参照を強調する', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('最新');
      expect(systemPrompt).toContain('2024-2025');
    });

    it('Android固有の評価基準を含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('48x48dp'); // タッチターゲット
      expect(systemPrompt).toContain('Roboto'); // フォント
      expect(systemPrompt).toContain('Bottom Navigation');
      expect(systemPrompt).toContain('FAB');
      expect(systemPrompt).toContain('Elevation');
      expect(systemPrompt).toContain('リップル効果');
    });

    it('Material Designタイポグラフィスケールを含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('Display Large');
      expect(systemPrompt).toContain('57sp');
      expect(systemPrompt).toContain('Headline');
      expect(systemPrompt).toContain('Title');
      expect(systemPrompt).toContain('Body');
      expect(systemPrompt).toContain('Label');
    });

    it('Material Design Elevationレベルを含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('Level 0');
      expect(systemPrompt).toContain('Level 1');
      expect(systemPrompt).toContain('Level 2');
      expect(systemPrompt).toContain('Level 3');
      expect(systemPrompt).toContain('Level 4');
      expect(systemPrompt).toContain('Level 5');
    });

    it('Material Designカラーロールを含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('Primary');
      expect(systemPrompt).toContain('Secondary');
      expect(systemPrompt).toContain('Tertiary');
      expect(systemPrompt).toContain('Surface');
      expect(systemPrompt).toContain('On Primary');
    });

    it('Material Design 3コンポーネントサイズを含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('FAB：56x56dp');
      expect(systemPrompt).toContain('Bottom Navigation (56dp');
      expect(systemPrompt).toContain('ボタン：高さ40dp');
    });
  });
});
