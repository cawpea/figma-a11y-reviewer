import Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from '@jest/globals';
import { FigmaNodeData } from '@shared/types';

import { BaseEvaluationAgent } from './base.agent';

// テスト用の具象クラス
class TestEvaluationAgent extends BaseEvaluationAgent {
  protected systemPrompt = 'Test system prompt';
  protected category = 'test';

  buildPrompt(data: FigmaNodeData): string {
    return `Evaluate this node: ${data.name}`;
  }

  // テスト用にparseResponseを公開
  public testParseResponse(response: Anthropic.Message, rootNodeData: FigmaNodeData) {
    return this.parseResponse(response, rootNodeData);
  }
}

// テスト用のモックレスポンス生成ヘルパー
function createMockResponse(textContent: string): Partial<Anthropic.Message> {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: textContent,
      } as Anthropic.TextBlock,
    ],
    model: 'claude-sonnet-4-20250514',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 100,
      output_tokens: 50,
    } as Anthropic.Usage,
  };
}

describe('BaseEvaluationAgent', () => {
  describe('validateNodeIdFormat', () => {
    let agent: TestEvaluationAgent;

    beforeEach(() => {
      agent = new TestEvaluationAgent();
    });

    it('should accept valid regular node IDs', () => {
      const mockData: FigmaNodeData = {
        id: '1809:1836',
        name: 'Test Node',
        type: 'FRAME',
      };

      const mockResponse = createMockResponse(
        JSON.stringify({
          score: 80,
          issues: [
            {
              severity: 'low',
              message: 'Test issue',
              nodeId: '1809:1836',
              autoFixable: false,
              suggestion: 'Test suggestion',
            },
          ],
        })
      );

      const result = agent.testParseResponse(mockResponse as Anthropic.Message, mockData);

      expect(result.score).toBe(80);
      expect(result.issues[0].nodeId).toBe('1809:1836');
      expect(result.issues[0].nodeHierarchy).toEqual(['1809:1836']);
    });

    it('should accept valid instance node IDs', () => {
      const mockData: FigmaNodeData = {
        id: 'I1806:932;589:1207',
        name: 'Button Instance',
        type: 'INSTANCE',
      };

      const mockResponse = createMockResponse(
        JSON.stringify({
          score: 85,
          issues: [
            {
              severity: 'medium',
              message: 'Instance issue',
              nodeId: 'I1806:932;589:1207',
              autoFixable: true,
              suggestion: 'Fix this',
            },
          ],
        })
      );

      const result = agent.testParseResponse(mockResponse as Anthropic.Message, mockData);

      expect(result.issues[0].nodeId).toBe('I1806:932;589:1207');
      expect(result.issues[0].nodeHierarchy).toEqual(['I1806:932;589:1207']);
    });

    it('should accept nested instance node IDs', () => {
      const mockData: FigmaNodeData = {
        id: 'I1806:984;1809:902;105:1169',
        name: 'Nested Instance',
        type: 'INSTANCE',
      };

      const mockResponse = createMockResponse(
        JSON.stringify({
          score: 90,
          issues: [
            {
              severity: 'high',
              message: 'Nested issue',
              nodeId: 'I1806:984;1809:902;105:1169',
              autoFixable: false,
              suggestion: 'Review this',
            },
          ],
        })
      );

      const result = agent.testParseResponse(mockResponse as Anthropic.Message, mockData);

      expect(result.issues[0].nodeId).toBe('I1806:984;1809:902;105:1169');
    });

    it('should reject invalid node ID formats', () => {
      const mockData: FigmaNodeData = {
        id: '1809:1836',
        name: 'Test Node',
        type: 'FRAME',
      };

      const invalidNodeIds = [
        'Button',
        'Header Component',
        '1809',
        ':1836',
        '1809:',
        'abc:def',
        '1809:1836:9999',
      ];

      invalidNodeIds.forEach((invalidId) => {
        const mockResponse = createMockResponse(
          JSON.stringify({
            score: 80,
            issues: [
              {
                severity: 'low',
                message: 'Test issue',
                nodeId: invalidId,
                autoFixable: false,
                suggestion: 'Test suggestion',
              },
            ],
          })
        );

        const result = agent.testParseResponse(mockResponse as Anthropic.Message, mockData);

        // 無効なnodeIdは削除されるべき
        expect(result.issues[0].nodeId).toBeUndefined();
      });
    });

    it('should reject extremely long node IDs', () => {
      const mockData: FigmaNodeData = {
        id: '1809:1836',
        name: 'Test Node',
        type: 'FRAME',
      };

      const longNodeId = 'I' + '1234:5678;'.repeat(200);

      const mockResponse = createMockResponse(
        JSON.stringify({
          score: 80,
          issues: [
            {
              severity: 'low',
              message: 'Test issue',
              nodeId: longNodeId,
              autoFixable: false,
              suggestion: 'Test suggestion',
            },
          ],
        })
      );

      const result = agent.testParseResponse(mockResponse as Anthropic.Message, mockData);

      // 長すぎるnodeIdは削除されるべき
      expect(result.issues[0].nodeId).toBeUndefined();
    });
  });

  describe('parseResponse', () => {
    let agent: TestEvaluationAgent;

    beforeEach(() => {
      agent = new TestEvaluationAgent();
    });

    it('should parse valid response', () => {
      const mockData: FigmaNodeData = {
        id: '1:1',
        name: 'Test',
        type: 'FRAME',
      };

      const mockResponse = createMockResponse(
        '```json\n{"score": 85, "issues": [], "positives": ["Good design"]}\n```'
      );

      const result = agent.testParseResponse(mockResponse as Anthropic.Message, mockData);

      expect(result.score).toBe(85);
      expect(result.issues).toEqual([]);
      expect(result.positives).toEqual(['Good design']);
    });

    it('should throw error when no text content', () => {
      const mockData: FigmaNodeData = {
        id: '1:1',
        name: 'Test',
        type: 'FRAME',
      };

      const mockResponse: Partial<Anthropic.Message> = {
        content: [],
      };

      expect(() => agent.testParseResponse(mockResponse as Anthropic.Message, mockData)).toThrow(
        'No text content in response'
      );
    });

    it('should throw error when invalid format', () => {
      const mockData: FigmaNodeData = {
        id: '1:1',
        name: 'Test',
        type: 'FRAME',
      };

      const mockResponse = createMockResponse('{"invalid": "format"}');

      expect(() => agent.testParseResponse(mockResponse as Anthropic.Message, mockData)).toThrow(
        'Invalid response format'
      );
    });
  });

  describe('evaluate', () => {
    let agent: TestEvaluationAgent;

    beforeEach(() => {
      agent = new TestEvaluationAgent();
    });

    it('should return evaluation result with usage', async () => {
      const mockData: FigmaNodeData = {
        id: '1:1',
        name: 'Test Node',
        type: 'FRAME',
      };

      const result = await agent.evaluate(mockData);

      expect(result.result.score).toBe(85);
      expect(result.result.issues).toEqual([]);
      expect(result.result.positives).toEqual(['Good design']);
      expect(result.usage.input_tokens).toBe(100);
      expect(result.usage.output_tokens).toBe(50);
    });
  });

  describe('buildPrompt', () => {
    let agent: TestEvaluationAgent;

    beforeEach(() => {
      agent = new TestEvaluationAgent();
    });

    it('should build prompt with node name', () => {
      const mockData: FigmaNodeData = {
        id: '1:1',
        name: 'Button Component',
        type: 'FRAME',
      };

      const prompt = agent.buildPrompt(mockData);

      expect(prompt).toBe('Evaluate this node: Button Component');
    });
  });
});
