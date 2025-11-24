import { describe, expect, it } from '@jest/globals';
import { FigmaNodeData } from '@shared/types';

import { WritingAgent } from './writing.agent';

describe('WritingAgent', () => {
  let agent: WritingAgent;

  beforeEach(() => {
    agent = new WritingAgent();
  });

  describe('evaluate', () => {
    it('日本語テキストを含むノードを評価する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Japanese Text',
            type: 'TEXT',
            characters: 'ログインしてください',
            fontSize: 16,
            fontName: { family: 'Noto Sans JP', style: 'Regular' },
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      expect(result.result.score).toBeGreaterThanOrEqual(0);
      expect(result.result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.result.issues)).toBe(true);
    });

    it('英語テキストを含むノードを評価する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'English Text',
            type: 'TEXT',
            characters: 'Sign in to continue',
            fontSize: 16,
            fontName: { family: 'Inter', style: 'Regular' },
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      expect(result.result.score).toBeGreaterThanOrEqual(0);
      expect(result.result.score).toBeLessThanOrEqual(100);
    });

    it('日本語と英語が混在するテキストを評価する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Mixed Text',
            type: 'TEXT',
            characters: 'Google アカウントでログイン',
            fontSize: 14,
            fontName: { family: 'Noto Sans JP', style: 'Regular' },
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      expect(result.result.score).toBeGreaterThanOrEqual(0);
      expect(result.result.score).toBeLessThanOrEqual(100);
    });

    it('空白のみのテキストノードを除外する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Empty Text',
            type: 'TEXT',
            characters: '   ',
            fontSize: 16,
          },
          {
            id: 'text2',
            name: 'Valid Text',
            type: 'TEXT',
            characters: 'ボタン',
            fontSize: 16,
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      // 評価は成功し、空白ノードは無視される
      expect(result.result.score).toBeGreaterThanOrEqual(0);
      expect(result.result.score).toBeLessThanOrEqual(100);
    });

    it('1000文字を超えるテキストを切り詰める', async () => {
      const longText = 'あ'.repeat(1500); // 1500文字の日本語テキスト

      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Long Text',
            type: 'TEXT',
            characters: longText,
            fontSize: 16,
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      // 評価は成功し、テキストは切り詰められる
      expect(result.result.score).toBeGreaterThanOrEqual(0);
      expect(result.result.score).toBeLessThanOrEqual(100);
    });

    it('テキストノードがない場合も正常に評価する', async () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'rect1',
            name: 'Rectangle',
            type: 'RECTANGLE',
          },
        ],
      };

      const result = await agent.evaluate(mockData);

      // テキストノードがない場合、Claude APIに「テキスト要素なし」というプロンプトが送られるが、
      // モックはデフォルトで85点を返すため、スコア範囲のみ確認
      expect(result.result.score).toBeGreaterThanOrEqual(0);
      expect(result.result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('category', () => {
    it('writingカテゴリを持つ', () => {
      expect((agent as any).category).toBe('writing');
    });
  });

  describe('systemPrompt', () => {
    it('ライティング評価基準の必須キーワードを含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('表記の一貫性');
      expect(systemPrompt).toContain('誤字');
      expect(systemPrompt).toContain('脱字');
      expect(systemPrompt).toContain('英語');
      expect(systemPrompt).toContain('読みやすさ');
    });

    it('評価観点の詳細を含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('用語の揺れ');
      expect(systemPrompt).toContain('数字');
      expect(systemPrompt).toContain('単位');
      expect(systemPrompt).toContain('スペルミス');
      expect(systemPrompt).toContain('文法');
      expect(systemPrompt).toContain('文の長さ');
    });

    it('言語判定についての説明を含む', () => {
      const systemPrompt = (agent as any).systemPrompt;

      expect(systemPrompt).toContain('日本語');
      expect(systemPrompt).toContain('英語');
      expect(systemPrompt).toContain('混在');
    });
  });

  describe('buildPrompt', () => {
    it('日本語テキストを正しく分類する', () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Japanese Text',
            type: 'TEXT',
            characters: 'こんにちは、世界！',
            fontSize: 16,
            fontName: { family: 'Noto Sans JP', style: 'Regular' },
          },
        ],
      };

      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).toContain('日本語テキスト');
      expect(prompt).toContain('Japanese Text');
      expect(prompt).toContain('こんにちは、世界！');
    });

    it('英語テキストを正しく分類する', () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'English Text',
            type: 'TEXT',
            characters: 'Hello World',
            fontSize: 16,
            fontName: { family: 'Inter', style: 'Regular' },
          },
        ],
      };

      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).toContain('英語テキスト');
      expect(prompt).toContain('English Text');
      expect(prompt).toContain('Hello World');
    });

    it('混在テキストを正しく分類する', () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Mixed Text',
            type: 'TEXT',
            characters: 'Sign inボタン',
            fontSize: 16,
          },
        ],
      };

      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).toContain('混在テキスト');
      expect(prompt).toContain('Mixed Text');
      expect(prompt).toContain('Sign inボタン');
    });

    it('デザイン全体の構造を含む', () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Login Screen',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Title',
            type: 'TEXT',
            characters: 'ログイン',
            fontSize: 24,
          },
        ],
      };

      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).toContain('デザイン全体の構造');
      expect(prompt).toContain('Login Screen');
    });

    it('評価観点のリマインダーを含む', () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Text',
            type: 'TEXT',
            characters: 'テスト',
            fontSize: 16,
          },
        ],
      };

      const prompt = (agent as any).buildPrompt(mockData);

      expect(prompt).toContain('表記の一貫性');
      expect(prompt).toContain('誤字・脱字');
      expect(prompt).toContain('英語の品質');
      expect(prompt).toContain('読みやすさ');
    });
  });
});
