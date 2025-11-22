import { describe, expect, it } from '@jest/globals';
import { FigmaNodeData } from '@shared/types';

import {
  buildColorContrastMap,
  extractJsonFromResponse,
  extractNodeHierarchyPath,
  formatFigmaDataForEvaluation,
  getJsonSchemaTemplate,
  getNodeIdInstructions,
} from './prompt.utils';

describe('prompt.utils', () => {
  describe('extractJsonFromResponse', () => {
    it('should extract JSON from code block', () => {
      const text = '```json\n{"score": 85, "issues": [], "positives": []}\n```';
      const result = extractJsonFromResponse(text);

      expect(result).toEqual({
        score: 85,
        issues: [],
        positives: [],
      });
    });

    it('should extract JSON without code block', () => {
      const text = 'Here is the result: {"score": 90, "issues": [], "positives": ["Good"]}';
      const result = extractJsonFromResponse(text);

      expect(result).toEqual({
        score: 90,
        issues: [],
        positives: ['Good'],
      });
    });

    it('should throw error when no JSON found', () => {
      const text = 'No JSON here';

      expect(() => extractJsonFromResponse(text)).toThrow('No valid JSON found in response');
    });

    it('should handle nested JSON objects', () => {
      const text =
        '```json\n{"score": 75, "issues": [{"severity": "high", "message": "Test"}], "positives": []}\n```';
      const result = extractJsonFromResponse(text);

      expect(result.score).toBe(75);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe('high');
    });
  });

  describe('extractNodeHierarchyPath', () => {
    const mockData: FigmaNodeData = {
      id: 'root',
      name: 'Root',
      type: 'FRAME',
      children: [
        {
          id: 'child1',
          name: 'Child 1',
          type: 'FRAME',
          children: [
            {
              id: 'grandchild1',
              name: 'Grandchild 1',
              type: 'TEXT',
            },
          ],
        },
        {
          id: 'child2',
          name: 'Child 2',
          type: 'FRAME',
        },
      ],
    };

    it('should find root node path', () => {
      const path = extractNodeHierarchyPath(mockData, 'root');

      expect(path).toEqual(['root']);
    });

    it('should find direct child path', () => {
      const path = extractNodeHierarchyPath(mockData, 'child1');

      expect(path).toEqual(['root', 'child1']);
    });

    it('should find nested child path', () => {
      const path = extractNodeHierarchyPath(mockData, 'grandchild1');

      expect(path).toEqual(['root', 'child1', 'grandchild1']);
    });

    it('should return null when node not found', () => {
      const path = extractNodeHierarchyPath(mockData, 'nonexistent');

      expect(path).toBeNull();
    });

    it('should handle circular references', () => {
      const circularData: FigmaNodeData = {
        id: 'node1',
        name: 'Node 1',
        type: 'FRAME',
        children: [],
      };
      // 循環参照を作成
      circularData.children = [circularData];

      const path = extractNodeHierarchyPath(circularData, 'nonexistent');

      expect(path).toBeNull();
    });
  });

  describe('formatFigmaDataForEvaluation', () => {
    it('should format simple node', () => {
      const node: FigmaNodeData = {
        id: '1:1',
        name: 'Button',
        type: 'FRAME',
        absoluteBoundingBox: {
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        },
      };

      const result = formatFigmaDataForEvaluation(node);

      expect(result).toContain('【FRAME】 Button (ID: 1:1)');
      expect(result).toContain('サイズ: 100×40px');
    });

    it('should format node with Auto Layout', () => {
      const node: FigmaNodeData = {
        id: '1:2',
        name: 'Container',
        type: 'FRAME',
        layoutMode: 'HORIZONTAL',
        paddingTop: 16,
        paddingRight: 16,
        paddingBottom: 16,
        paddingLeft: 16,
        itemSpacing: 8,
        primaryAxisAlignItems: 'CENTER',
        counterAxisAlignItems: 'CENTER',
      };

      const result = formatFigmaDataForEvaluation(node);

      expect(result).toContain('Auto Layout: HORIZONTAL');
      expect(result).toContain('padding: 16/16/16/16px');
      expect(result).toContain('itemSpacing: 8px');
    });

    it('should format text node', () => {
      const node: FigmaNodeData = {
        id: '1:3',
        name: 'Label',
        type: 'TEXT',
        characters: 'Click me',
        fontSize: 16,
        fontName: {
          family: 'Inter',
          style: 'Regular',
        },
        textAlignHorizontal: 'CENTER',
        textAlignVertical: 'CENTER',
      };

      const result = formatFigmaDataForEvaluation(node);

      expect(result).toContain('【TEXT】 Label (ID: 1:3)');
      expect(result).toContain('テキスト: "Click me"');
      expect(result).toContain('フォント: Inter Regular');
      expect(result).toContain('フォントサイズ: 16px');
    });

    it('should handle nested children', () => {
      const node: FigmaNodeData = {
        id: 'parent',
        name: 'Parent',
        type: 'FRAME',
        children: [
          {
            id: 'child1',
            name: 'Child 1',
            type: 'FRAME',
          },
          {
            id: 'child2',
            name: 'Child 2',
            type: 'TEXT',
          },
        ],
      };

      const result = formatFigmaDataForEvaluation(node);

      expect(result).toContain('【FRAME】 Parent (ID: parent)');
      expect(result).toContain('子要素数: 2');
      expect(result).toContain('【FRAME】 Child 1 (ID: child1)');
      expect(result).toContain('【TEXT】 Child 2 (ID: child2)');
    });

    it('should detect circular references', () => {
      const node: FigmaNodeData = {
        id: 'circular',
        name: 'Circular',
        type: 'FRAME',
        children: [],
      };
      // 循環参照を作成
      node.children = [node];

      const result = formatFigmaDataForEvaluation(node);

      expect(result).toContain('[循環参照を検出: Circular (ID: circular)]');
    });

    it('should respect max depth limit', () => {
      // 深いネスト構造を作成
      const createNestedNode = (depth: number): FigmaNodeData => {
        const node: FigmaNodeData = {
          id: `node-${depth}`,
          name: `Node ${depth}`,
          type: 'FRAME',
        };

        if (depth < 15) {
          node.children = [createNestedNode(depth + 1)];
        }

        return node;
      };

      const deepNode = createNestedNode(0);
      const result = formatFigmaDataForEvaluation(deepNode);

      expect(result).toContain('[最大深度 10 に達しました]');
    });
  });

  describe('getJsonSchemaTemplate', () => {
    it('should return JSON schema template', () => {
      const template = getJsonSchemaTemplate();

      expect(template).toContain('必ず以下のJSON形式で結果を返してください');
      expect(template).toContain('"score": 0-100の数値');
      expect(template).toContain('"issues":');
      expect(template).toContain('"severity": "high" | "medium" | "low"');
      expect(template).toContain('"nodeId"');
      expect(template).toContain('"autoFixable"');
      expect(template).toContain('"positives"');
    });
  });

  describe('getNodeIdInstructions', () => {
    it('should return node ID instructions', () => {
      const instructions = getNodeIdInstructions();

      expect(instructions).toContain('**重要なnodeIdの指定方法:**');
      expect(instructions).toContain('実際のFigma ID');
      expect(instructions).toContain('1809:1838');
      expect(instructions).toContain('I1806:932;589:1207');
      expect(instructions).toContain('I1806:984;1809:902;105:1169');
    });
  });

  describe('buildColorContrastMap', () => {
    it('should return message when no text elements found', () => {
      const node: FigmaNodeData = {
        id: 'frame',
        name: 'Frame',
        type: 'FRAME',
      };

      const result = buildColorContrastMap(node);

      expect(result).toContain('テキスト要素が見つかりませんでした');
    });

    it('should generate contrast map for text nodes with colors', () => {
      const node: FigmaNodeData = {
        id: 'root',
        name: 'Root',
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
            id: 'text1',
            name: 'Label',
            type: 'TEXT',
            fills: [
              {
                type: 'SOLID',
                color: { r: 0, g: 0, b: 0 }, // 黒文字
                opacity: 1,
              },
            ],
          },
        ],
      };

      const result = buildColorContrastMap(node);

      expect(result).toContain('## カラーコントラスト比マップ');
      expect(result).toContain('Label (ID: text1)');
      expect(result).toContain('文字色: #000000');
      expect(result).toContain('背景色: #FFFFFF');
      expect(result).toContain('コントラスト比:');
    });

    it('should limit results to maxItems', () => {
      // 多数のテキストノードを作成
      const children: FigmaNodeData[] = [];
      for (let i = 0; i < 150; i++) {
        children.push({
          id: `text${i}`,
          name: `Text ${i}`,
          type: 'TEXT',
          fills: [
            {
              type: 'SOLID',
              color: { r: 0, g: 0, b: 0 },
              opacity: 1,
            },
          ],
        });
      }

      const node: FigmaNodeData = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 },
            opacity: 1,
          },
        ],
        children,
      };

      const result = buildColorContrastMap(node, 50);

      expect(result).toContain('最初の50件のみを表示');
      expect(result).toContain('省略されています');
    });
  });
});
