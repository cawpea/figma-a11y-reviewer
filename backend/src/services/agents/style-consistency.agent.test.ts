import { describe, expect, it } from '@jest/globals';
import { FigmaNodeData, FigmaStylesData } from '@shared/types';

import { StyleConsistencyAgent } from './style-consistency.agent';

describe('StyleConsistencyAgent', () => {
  let agent: StyleConsistencyAgent;

  beforeEach(() => {
    agent = new StyleConsistencyAgent();
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

    it('スタイル情報なしで動作する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 },
            opacity: 1,
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      expect(Array.isArray(result.result.issues)).toBe(true);
    });

    it('スタイル情報ありで評価する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Label',
            type: 'TEXT',
            characters: 'Hello',
            fontSize: 16,
            textStyleId: 'S:1234',
            textStyleName: 'Body/Regular',
            fontName: {
              family: 'Inter',
              style: 'Regular',
            },
          },
        ],
      };

      const mockStylesData: FigmaStylesData = {
        variables: [
          {
            id: 'V:1',
            name: 'color/primary',
            resolvedType: 'COLOR',
          },
        ],
        textStyles: [
          {
            id: 'S:1234',
            name: 'Body/Regular',
          },
        ],
        colorStyles: [
          {
            id: 'C:1',
            name: 'Fill/Primary',
          },
        ],
        effectStyles: [],
        meta: {
          variablesCount: 1,
          textStylesCount: 1,
          colorStylesCount: 1,
          effectStylesCount: 0,
          truncated: false,
        },
      };

      agent.setStylesData(mockStylesData);
      const result = await agent.evaluate(mockData);

      expect(Array.isArray(result.result.issues)).toBe(true);
    });
  });

  describe('setStylesData', () => {
    it('スタイルデータを設定できる', () => {
      const mockStylesData: FigmaStylesData = {
        variables: [],
        textStyles: [
          {
            id: 'S:1',
            name: 'Heading/H1',
          },
        ],
        colorStyles: [],
        effectStyles: [],
        meta: {
          variablesCount: 0,
          textStylesCount: 1,
          colorStylesCount: 0,
          effectStylesCount: 0,
          truncated: false,
        },
      };

      agent.setStylesData(mockStylesData);

      expect((agent as any).stylesData).toEqual(mockStylesData);
    });

    it('undefinedでスタイルデータをクリアできる', () => {
      const mockStylesData: FigmaStylesData = {
        variables: [],
        textStyles: [],
        colorStyles: [],
        effectStyles: [],
        meta: {
          variablesCount: 0,
          textStylesCount: 0,
          colorStylesCount: 0,
          effectStylesCount: 0,
          truncated: false,
        },
      };

      agent.setStylesData(mockStylesData);
      expect((agent as any).stylesData).toBeDefined();

      agent.setStylesData(undefined);
      expect((agent as any).stylesData).toBeUndefined();
    });
  });

  describe('category', () => {
    it('styleConsistencyカテゴリを持つ', () => {
      expect((agent as any).category).toBe('styleConsistency');
    });
  });

  describe('systemPrompt', () => {
    it('Variables評価基準を含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('Variables');
      expect(systemPrompt).toContain('カラー変数');
      expect(systemPrompt).toContain('スペーシング変数');
      expect(systemPrompt).toContain('デザイントークン');
    });

    it('スタイル一貫性評価基準を含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('Color Style Consistency');
      expect(systemPrompt).toContain('Text Style Application');
      expect(systemPrompt).toContain('Effect Style Unification');
      expect(systemPrompt).toContain('Auto Layout & Spacing');
    });

    it('命名規則評価基準を含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('Naming Convention Consistency');
      expect(systemPrompt).toContain('命名規則');
      expect(systemPrompt).toContain('レイヤー名');
    });

    it('コンポーネント評価基準を含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('Components and Instances');
      expect(systemPrompt).toContain('コンポーネント');
      expect(systemPrompt).toContain('インスタンス');
    });

    it('重大度評価基準を含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('Severity Assessment');
      expect(systemPrompt).toContain('High');
      expect(systemPrompt).toContain('Medium');
      expect(systemPrompt).toContain('Low');
    });
  });

  describe('buildPrompt', () => {
    it('スタイル情報なしでプロンプトを生成する', () => {
      const mockData: FigmaNodeData = {
        id: '1:1',
        name: 'Button',
        type: 'FRAME',
      };

      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).toContain('Button (ID: 1:1)');
      expect(prompt).toContain('スタイル定義と適用状況');
      expect(prompt).toContain('⚠️ スタイル情報が取得されていません');
    });

    it('スタイル情報ありでプロンプトを生成する', () => {
      const mockData: FigmaNodeData = {
        id: 'text1',
        name: 'Label',
        type: 'TEXT',
        characters: 'Hello',
        textStyleId: 'S:1',
        textStyleName: 'Body/Regular',
      };

      const mockStylesData: FigmaStylesData = {
        variables: [],
        textStyles: [
          {
            id: 'S:1',
            name: 'Body/Regular',
          },
        ],
        colorStyles: [],
        effectStyles: [],
        meta: {
          variablesCount: 0,
          textStylesCount: 1,
          colorStylesCount: 0,
          effectStylesCount: 0,
          truncated: false,
        },
      };

      agent.setStylesData(mockStylesData);
      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).toContain('Label (ID: text1)');
      expect(prompt).toContain('スタイル定義と適用状況');
      expect(prompt).toContain('TextStyles: 1件');
      expect(prompt).toContain('Body/Regular');
      expect(prompt).not.toContain('⚠️ スタイル情報が取得されていません');
    });

    it('評価時の注意事項を含む', () => {
      const mockData: FigmaNodeData = {
        id: '1:1',
        name: 'Button',
        type: 'FRAME',
      };

      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).toContain('評価時の重要な注意事項');
      expect(prompt).toContain('Variables、TextStyle、ColorStyleが適切に使用されているか');
      expect(prompt).toContain('ハードコードされた値がある場合は');
      expect(prompt).toContain('未使用のスタイル定義がある場合は');
    });

    it('ハードコードされた色を検出するプロンプトを生成する', () => {
      const mockData: FigmaNodeData = {
        id: 'rect1',
        name: 'Rectangle',
        type: 'RECTANGLE',
        fills: [
          {
            type: 'SOLID',
            color: { r: 1, g: 0, b: 0 },
            opacity: 1,
          },
        ],
      };

      const mockStylesData: FigmaStylesData = {
        variables: [],
        textStyles: [],
        colorStyles: [
          {
            id: 'C:1',
            name: 'Fill/Primary',
          },
        ],
        effectStyles: [],
        meta: {
          variablesCount: 0,
          textStylesCount: 0,
          colorStylesCount: 1,
          effectStylesCount: 0,
          truncated: false,
        },
      };

      agent.setStylesData(mockStylesData);
      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).toContain('ハードコードされた色');
      expect(prompt).toContain('#FF0000');
    });
  });
});
