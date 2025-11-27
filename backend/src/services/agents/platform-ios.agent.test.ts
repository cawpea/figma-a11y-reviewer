import { describe, expect, it } from '@jest/globals';
import { FigmaNodeData } from '@shared/types';

import { PlatformIosAgent } from './platform-ios.agent';

describe('PlatformIosAgent', () => {
  let agent: PlatformIosAgent;

  beforeEach(() => {
    agent = new PlatformIosAgent();
  });

  describe('evaluate', () => {
    it('評価にフォーマットされたFigmaデータを含む', async () => {
      const mockData: FigmaNodeData = {
        id: '1:1',
        name: 'iOS Button',
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

    it('iOSナビゲーションバーを評価する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Navigation Bar',
        type: 'FRAME',
        absoluteBoundingBox: {
          x: 0,
          y: 0,
          width: 375,
          height: 44, // iOS標準の44pt
        },
        children: [
          {
            id: 'title',
            name: 'Title',
            type: 'TEXT',
            characters: 'Screen Title',
            fontSize: 17,
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      expect(Array.isArray(result.result.issues)).toBe(true);
    });

    it('タッチターゲットサイズ不足のボタンを処理する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'smallButton',
            name: 'Small Button',
            type: 'FRAME',
            absoluteBoundingBox: {
              x: 0,
              y: 0,
              width: 30, // 44pt未満
              height: 30,
            },
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      expect(Array.isArray(result.result.issues)).toBe(true);
    });
  });

  describe('category', () => {
    it('platformComplianceカテゴリを持つ', () => {
      expect((agent as any).category).toBe('platformCompliance');
    });
  });

  describe('systemPrompt', () => {
    it('Human Interface Guidelinesを参照する', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('Human Interface Guidelines');
      expect(systemPrompt).toContain('HIG');
      expect(systemPrompt).toContain('iOS');
    });

    it('最新ガイドラインの参照を強調する', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('最新');
      expect(systemPrompt).toContain('2024-2025');
    });

    it('iOS固有の評価基準を含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('44x44pt'); // タッチターゲット
      expect(systemPrompt).toContain('San Francisco'); // フォント
      expect(systemPrompt).toContain('ナビゲーションバー');
      expect(systemPrompt).toContain('タブバー');
      expect(systemPrompt).toContain('セーフエリア');
      expect(systemPrompt).toContain('Dynamic Type');
    });

    it('iOSタイポグラフィスケールを含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('Large Title');
      expect(systemPrompt).toContain('34pt');
      expect(systemPrompt).toContain('Title 1');
      expect(systemPrompt).toContain('Headline');
      expect(systemPrompt).toContain('Body');
    });

    it('iOS標準コンポーネントの寸法を含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('ナビゲーションバー：高さ44pt');
      expect(systemPrompt).toContain('タブバー：高さ49pt');
    });
  });
});
