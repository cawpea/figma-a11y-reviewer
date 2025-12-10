import { describe, expect, it } from '@jest/globals';
import { FigmaNodeData, FigmaStylesData } from '@shared/types';

import {
  buildColorContrastMap,
  buildStylesApplicationMap,
  detectLanguage,
  escapeForPrompt,
  extractJsonFromResponse,
  extractNodeHierarchyPath,
  extractTextNodes,
  formatFigmaDataForEvaluation,
  getJsonSchemaTemplate,
  getNodeIdInstructions,
} from './prompt.utils';

describe('prompt.utils', () => {
  describe('escapeForPrompt', () => {
    it('ダブルクォートをエスケープする', () => {
      const input = 'テキストに"引用符"が含まれる';
      const result = escapeForPrompt(input);
      expect(result).toBe('テキストに\\"引用符\\"が含まれる');
    });

    it('バックスラッシュをエスケープする', () => {
      const input = 'パス\\名前';
      const result = escapeForPrompt(input);
      expect(result).toBe('パス\\\\名前');
    });

    it('改行をエスケープする', () => {
      const input = '1行目\n2行目';
      const result = escapeForPrompt(input);
      expect(result).toBe('1行目\\n2行目');
    });

    it('キャリッジリターンをエスケープする', () => {
      const input = '行1\r行2';
      const result = escapeForPrompt(input);
      expect(result).toBe('行1\\r行2');
    });

    it('タブをエスケープする', () => {
      const input = 'カラム1\tカラム2';
      const result = escapeForPrompt(input);
      expect(result).toBe('カラム1\\tカラム2');
    });

    it('バッククォートをエスケープする', () => {
      const input = 'コード`例`はこちら';
      const result = escapeForPrompt(input);
      expect(result).toBe('コード\\`例\\`はこちら');
    });

    it('複数の特殊文字を同時にエスケープする', () => {
      const input = '悪意のある入力:\n"プロンプト破壊`試行\\テスト"';
      const result = escapeForPrompt(input);
      expect(result).toBe('悪意のある入力:\\n\\"プロンプト破壊\\`試行\\\\テスト\\"');
    });

    it('通常のテキストはそのまま返す', () => {
      const input = '通常のテキストです';
      const result = escapeForPrompt(input);
      expect(result).toBe('通常のテキストです');
    });

    it('空文字列を処理する', () => {
      const input = '';
      const result = escapeForPrompt(input);
      expect(result).toBe('');
    });
  });

  describe('extractJsonFromResponse', () => {
    it('コードブロックからJSONを抽出する', () => {
      const text = '```json\n{ "issues": [], "positives": []}\n```';
      const result = extractJsonFromResponse(text);

      expect(result).toEqual({
        issues: [],
        positives: [],
      });
    });

    it('コードブロックなしでJSONを抽出する', () => {
      const text = 'Here is the result: { "issues": [], "positives": ["Good"]}';
      const result = extractJsonFromResponse(text);

      expect(result).toEqual({
        issues: [],
        positives: ['Good'],
      });
    });

    it('JSONが見つからないときにエラーをスローする', () => {
      const text = 'No JSON here';

      expect(() => extractJsonFromResponse(text)).toThrow('No valid JSON found in response');
    });

    it('ネストされたJSONオブジェクトを処理する', () => {
      const text =
        '```json\n{ "issues": [{"severity": "high", "message": "Test"}], "positives": []}\n```';
      const result = extractJsonFromResponse(text);

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

    it('ルートノードパスを見つける', () => {
      const path = extractNodeHierarchyPath(mockData, 'root');

      expect(path).toEqual(['root']);
    });

    it('直接の子パスを見つける', () => {
      const path = extractNodeHierarchyPath(mockData, 'child1');

      expect(path).toEqual(['root', 'child1']);
    });

    it('ネストされた子パスを見つける', () => {
      const path = extractNodeHierarchyPath(mockData, 'grandchild1');

      expect(path).toEqual(['root', 'child1', 'grandchild1']);
    });

    it('ノードが見つからないときnullを返す', () => {
      const path = extractNodeHierarchyPath(mockData, 'nonexistent');

      expect(path).toBeNull();
    });

    it('循環参照を処理する', () => {
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
    it('シンプルなノードをフォーマットする', () => {
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

    it('Auto Layoutを持つノードをフォーマットする', () => {
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

    it('テキストノードをフォーマットする', () => {
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

    it('ネストされた子要素を処理する', () => {
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

    it('循環参照を検出する', () => {
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

    it('最大深度制限を尊重する', () => {
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
    it('JSONスキーマテンプレートを返す', () => {
      const template = getJsonSchemaTemplate();

      expect(template).toContain('必ず以下のJSON形式で結果を返してください');
      expect(template).toContain('"issues":');
      expect(template).toContain('"severity": "high" | "medium" | "low"');
      expect(template).toContain('"nodeId"');
      expect(template).toContain('"autoFixable"');
      expect(template).toContain('"positives"');
    });
  });

  describe('getNodeIdInstructions', () => {
    it('ノードIDの指示を返す', () => {
      const instructions = getNodeIdInstructions();

      expect(instructions).toContain('**重要なnodeIdの指定方法:**');
      expect(instructions).toContain('実際のFigma ID');
      expect(instructions).toContain('1809:1838');
      expect(instructions).toContain('I1806:932;589:1207');
      expect(instructions).toContain('I1806:984;1809:902;105:1169');
    });
  });

  describe('buildColorContrastMap', () => {
    it('テキスト要素が見つからないときにメッセージを返す', () => {
      const node: FigmaNodeData = {
        id: 'frame',
        name: 'Frame',
        type: 'FRAME',
      };

      const result = buildColorContrastMap(node);

      expect(result).toContain('テキスト要素が見つかりませんでした');
    });

    it('色を持つテキストノードのコントラストマップを生成する', () => {
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

    it('結果をmaxItemsに制限する', () => {
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

    it('装飾的な小さい兄弟要素を除外して親要素の背景色を使用する', () => {
      // 親要素（ライトグレー背景）
      const node: FigmaNodeData = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            color: { r: 0.969, g: 0.969, b: 0.969 }, // #F7F7F7（ライトグレー背景）
            opacity: 1,
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 800, height: 100 },
        children: [
          {
            id: 'h2title',
            name: 'h2title',
            type: 'INSTANCE',
            children: [
              // 幅3pxの細い青い線（装飾要素）
              {
                id: 'blue-line',
                name: 'Rectangle',
                type: 'RECTANGLE',
                fills: [
                  {
                    type: 'SOLID',
                    color: { r: 0.024, g: 0.435, b: 0.784 }, // #096FC8（青色）
                    opacity: 1,
                  },
                ],
                absoluteBoundingBox: { x: 0, y: 0, width: 3, height: 48 },
              },
              // テキストノード
              {
                id: 'text1',
                name: 'Heading',
                type: 'TEXT',
                fills: [
                  {
                    type: 'SOLID',
                    color: { r: 0.224, g: 0.239, b: 0.251 }, // #393D40（ダークグレー）
                    opacity: 1,
                  },
                ],
                absoluteBoundingBox: { x: 10, y: 0, width: 730, height: 42 },
              },
            ],
          },
        ],
      };

      const result = buildColorContrastMap(node);

      // 装飾的な青い線（#096FC8）ではなく、親要素の背景色（#F7F7F7）が使用されることを確認
      expect(result).toContain('Heading (ID: text1)');
      expect(result).toContain('文字色: #393D40');
      expect(result).toContain('背景色: #F7F7F7');
      expect(result).not.toContain('背景色: #096FC8');

      // コントラスト比が10以上（正しい値）であることを確認
      // #393D40 vs #F7F7F7 のコントラスト比は約10.23:1
      const contrastMatch = result.match(/コントラスト比: (\d+\.\d+):1/);
      expect(contrastMatch).not.toBeNull();
      if (contrastMatch) {
        const contrast = parseFloat(contrastMatch[1]);
        expect(contrast).toBeGreaterThan(10);
      }
    });

    it('十分に大きい兄弟要素は背景色として使用される', () => {
      const node: FigmaNodeData = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 }, // #FFFFFF（白背景）
            opacity: 1,
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 800, height: 100 },
        children: [
          {
            id: 'parent',
            name: 'Parent',
            type: 'FRAME',
            fills: [], // 背景色なし（明示的に空）
            children: [
              // 十分に大きい背景要素
              {
                id: 'bg',
                name: 'Background',
                type: 'RECTANGLE',
                fills: [
                  {
                    type: 'SOLID',
                    color: { r: 0.969, g: 0.969, b: 0.969 }, // #F7F7F7（グレー）
                    opacity: 1,
                  },
                ],
                absoluteBoundingBox: { x: 0, y: 0, width: 740, height: 50 },
              },
              // テキストノード
              {
                id: 'text1',
                name: 'Text',
                type: 'TEXT',
                fills: [
                  {
                    type: 'SOLID',
                    color: { r: 0, g: 0, b: 0 }, // #000000
                    opacity: 1,
                  },
                ],
                absoluteBoundingBox: { x: 10, y: 10, width: 720, height: 30 },
              },
            ],
          },
        ],
      };

      const result = buildColorContrastMap(node);

      // 十分に大きい兄弟要素（#F7F7F7）が背景色として使用されることを確認
      expect(result).toContain('Text (ID: text1)');
      expect(result).toContain('文字色: #000000');
      expect(result).toContain('背景色: #F7F7F7');
    });
  });

  describe('buildStylesApplicationMap', () => {
    it('スタイル情報がないときに警告メッセージを返す', () => {
      const node: FigmaNodeData = {
        id: 'frame',
        name: 'Frame',
        type: 'FRAME',
      };

      const result = buildStylesApplicationMap(node, undefined);

      expect(result).toContain('⚠️ スタイル情報が取得されていません');
    });

    it('空のスタイルデータでマップを生成する', () => {
      const node: FigmaNodeData = {
        id: 'frame',
        name: 'Frame',
        type: 'FRAME',
      };

      const stylesData: FigmaStylesData = {
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

      const result = buildStylesApplicationMap(node, stylesData);

      expect(result).toContain('## スタイル定義と適用状況');
      expect(result).toContain('Variables（デザイントークン）: 0件');
      expect(result).toContain('TextStyles: 0件');
      expect(result).toContain('ColorStyles: 0件');
      expect(result).toContain('EffectStyles（シャドウ/ブラー）: 0件');
      expect(result).toContain('_Variablesは定義されていません_');
    });

    it('Variablesの定義と使用状況を表示する', () => {
      const node: FigmaNodeData = {
        id: 'rect',
        name: 'Rectangle',
        type: 'RECTANGLE',
        boundVariables: {
          fills: {
            type: 'VARIABLE_ALIAS',
            id: 'V:1',
          },
        },
      };

      const stylesData: FigmaStylesData = {
        variables: [
          {
            id: 'V:1',
            name: 'color/primary',
            resolvedType: 'COLOR',
          },
          {
            id: 'V:2',
            name: 'spacing/medium',
            resolvedType: 'FLOAT',
          },
        ],
        textStyles: [],
        colorStyles: [],
        effectStyles: [],
        meta: {
          variablesCount: 2,
          textStylesCount: 0,
          colorStylesCount: 0,
          effectStylesCount: 0,
          truncated: false,
        },
      };

      const result = buildStylesApplicationMap(node, stylesData);

      expect(result).toContain('Variables（デザイントークン）: 2件');
      expect(result).toContain('**color/primary** (COLOR) - ID: V:1');
      expect(result).toContain('**spacing/medium** (FLOAT) - ID: V:2');
      expect(result).toContain('✅ **使用されているVariables (1件):**');
      expect(result).toContain('**color/primary** → Rectangle (ID: rect) [fills]');
    });

    it('TextStyleの適用状況を表示する', () => {
      const node: FigmaNodeData = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Styled Text',
            type: 'TEXT',
            characters: 'Hello',
            textStyleId: 'S:1',
            textStyleName: 'Body/Regular',
            fontSize: 16,
            fontName: {
              family: 'Inter',
              style: 'Regular',
            },
          },
          {
            id: 'text2',
            name: 'Unstyled Text',
            type: 'TEXT',
            characters: 'World',
            fontSize: 14,
            fontName: {
              family: 'Arial',
              style: 'Bold',
            },
          },
        ],
      };

      const stylesData: FigmaStylesData = {
        variables: [],
        textStyles: [
          {
            id: 'S:1',
            name: 'Body/Regular',
            description: 'Body text style',
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

      const result = buildStylesApplicationMap(node, stylesData);

      expect(result).toContain('TextStyles: 1件');
      expect(result).toContain('**Body/Regular** - Body text style - ID: S:1');
      expect(result).toContain('✅ **使用されているTextStyles (1件):**');
      expect(result).toContain('**Body/Regular** → Styled Text (ID: text1)');
      expect(result).toContain('❌ **TextStyleが未適用のテキスト (1件):**');
      expect(result).toContain('Unstyled Text (ID: text2) - フォント: Arial 14px');
    });

    it('ColorStyleとハードコードされた色を検出する', () => {
      const node: FigmaNodeData = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        children: [
          {
            id: 'rect1',
            name: 'Styled Rectangle',
            type: 'RECTANGLE',
            fillStyleId: 'C:1',
            fillStyleName: 'Fill/Primary',
          },
          {
            id: 'rect2',
            name: 'Hardcoded Rectangle',
            type: 'RECTANGLE',
            fills: [
              {
                type: 'SOLID',
                color: { r: 1, g: 0, b: 0 },
                opacity: 1,
              },
            ],
          },
        ],
      };

      const stylesData: FigmaStylesData = {
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

      const result = buildStylesApplicationMap(node, stylesData);

      expect(result).toContain('ColorStyles: 1件');
      expect(result).toContain('**Fill/Primary** - ID: C:1');
      expect(result).toContain('✅ **使用されているColorStyles (1件):**');
      expect(result).toContain('**Fill/Primary** → Styled Rectangle (ID: rect1) [fill]');
      expect(result).toContain('❌ **ハードコードされた色 (1件):**');
      expect(result).toContain('Hardcoded Rectangle (ID: rect2) - fill: #FF0000');
    });

    it('EffectStyleの使用状況を表示する', () => {
      const node: FigmaNodeData = {
        id: 'card',
        name: 'Card',
        type: 'FRAME',
        effectStyleId: 'E:1',
        effectStyleName: 'Shadow/Medium',
      };

      const stylesData: FigmaStylesData = {
        variables: [],
        textStyles: [],
        colorStyles: [],
        effectStyles: [
          {
            id: 'E:1',
            name: 'Shadow/Medium',
          },
        ],
        meta: {
          variablesCount: 0,
          textStylesCount: 0,
          colorStylesCount: 0,
          effectStylesCount: 1,
          truncated: false,
        },
      };

      const result = buildStylesApplicationMap(node, stylesData);

      expect(result).toContain('EffectStyles（シャドウ/ブラー）: 1件');
      expect(result).toContain('**Shadow/Medium** - ID: E:1');
      expect(result).toContain('✅ **使用されているEffectStyles (1件):**');
      expect(result).toContain('**Shadow/Medium** → Card (ID: card)');
    });

    it('切り捨てフラグが立っているときに警告を表示する', () => {
      const node: FigmaNodeData = {
        id: 'frame',
        name: 'Frame',
        type: 'FRAME',
      };

      const stylesData: FigmaStylesData = {
        variables: [],
        textStyles: [],
        colorStyles: [],
        effectStyles: [],
        meta: {
          variablesCount: 150,
          textStylesCount: 120,
          colorStylesCount: 110,
          effectStylesCount: 50,
          truncated: true,
        },
      };

      const result = buildStylesApplicationMap(node, stylesData);

      expect(result).toContain('**注意**: スタイル情報が100件を超えたため');
      expect(result).toContain('各カテゴリ最初の100件のみ表示');
    });

    it('ストロークスタイルを検出する', () => {
      const node: FigmaNodeData = {
        id: 'rect',
        name: 'Rectangle',
        type: 'RECTANGLE',
        strokeStyleId: 'C:2',
        strokeStyleName: 'Stroke/Border',
      };

      const stylesData: FigmaStylesData = {
        variables: [],
        textStyles: [],
        colorStyles: [
          {
            id: 'C:2',
            name: 'Stroke/Border',
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

      const result = buildStylesApplicationMap(node, stylesData);

      expect(result).toContain('**Stroke/Border** → Rectangle (ID: rect) [stroke]');
    });

    it('配列のVariable aliasを処理する', () => {
      const node: FigmaNodeData = {
        id: 'frame',
        name: 'Frame',
        type: 'FRAME',
        boundVariables: {
          fills: [
            {
              type: 'VARIABLE_ALIAS',
              id: 'V:1',
            },
            {
              type: 'VARIABLE_ALIAS',
              id: 'V:2',
            },
          ],
        },
      };

      const stylesData: FigmaStylesData = {
        variables: [
          {
            id: 'V:1',
            name: 'color/primary',
            resolvedType: 'COLOR',
          },
          {
            id: 'V:2',
            name: 'color/secondary',
            resolvedType: 'COLOR',
          },
        ],
        textStyles: [],
        colorStyles: [],
        effectStyles: [],
        meta: {
          variablesCount: 2,
          textStylesCount: 0,
          colorStylesCount: 0,
          effectStylesCount: 0,
          truncated: false,
        },
      };

      const result = buildStylesApplicationMap(node, stylesData);

      expect(result).toContain('**color/primary** → Frame (ID: frame) [fills]');
      expect(result).toContain('**color/secondary** → Frame (ID: frame) [fills]');
    });
  });

  describe('detectLanguage', () => {
    it('ひらがなを日本語として判定する', () => {
      expect(detectLanguage('ひらがな')).toBe('japanese');
      expect(detectLanguage('これはテストです')).toBe('japanese');
    });

    it('カタカナを日本語として判定する', () => {
      expect(detectLanguage('カタカナ')).toBe('japanese');
      expect(detectLanguage('テスト')).toBe('japanese');
    });

    it('漢字を日本語として判定する', () => {
      expect(detectLanguage('漢字')).toBe('japanese');
      expect(detectLanguage('日本語文章')).toBe('japanese');
    });

    it('ASCII文字のみを英語として判定する', () => {
      expect(detectLanguage('Hello World')).toBe('english');
      expect(detectLanguage('This is a test')).toBe('english');
    });

    it('日本語と英語の混在を混在として判定する', () => {
      expect(detectLanguage('こんにちはHello')).toBe('mixed');
      expect(detectLanguage('Sign inボタン')).toBe('mixed');
      expect(detectLanguage('日本語とEnglish')).toBe('mixed');
    });

    it('数字のみの場合は日本語として判定する', () => {
      expect(detectLanguage('12345')).toBe('japanese');
      expect(detectLanguage('0')).toBe('japanese');
    });

    it('記号のみの場合は日本語として判定する', () => {
      expect(detectLanguage('!@#$%')).toBe('japanese');
      expect(detectLanguage('★☆')).toBe('japanese');
    });

    it('空文字列は日本語として判定する', () => {
      expect(detectLanguage('')).toBe('japanese');
    });
  });

  describe('extractTextNodes', () => {
    it('TEXTノードからテキストを抽出する', () => {
      const mockData: FigmaNodeData = {
        id: 'text1',
        name: 'Test Text',
        type: 'TEXT',
        characters: 'こんにちは',
        fontSize: 16,
        fontName: { family: 'Noto Sans JP', style: 'Regular' },
      };

      const results = extractTextNodes(mockData);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        nodeId: 'text1',
        nodeName: 'Test Text',
        text: 'こんにちは',
        language: 'japanese',
        fontSize: 16,
        fontFamily: 'Noto Sans JP',
      });
    });

    it('複数のTEXTノードを抽出する', () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Japanese Text',
            type: 'TEXT',
            characters: 'ログイン',
            fontSize: 16,
            fontName: { family: 'Noto Sans JP', style: 'Regular' },
          },
          {
            id: 'text2',
            name: 'English Text',
            type: 'TEXT',
            characters: 'Sign in',
            fontSize: 14,
            fontName: { family: 'Arial', style: 'Regular' },
          },
        ],
      };

      const results = extractTextNodes(mockData);

      expect(results).toHaveLength(2);
      expect(results[0].language).toBe('japanese');
      expect(results[1].language).toBe('english');
    });

    it('空白のみのテキストノードを除外する', () => {
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
            fontName: { family: 'Arial', style: 'Regular' },
          },
          {
            id: 'text2',
            name: 'Valid Text',
            type: 'TEXT',
            characters: 'Hello',
            fontSize: 16,
            fontName: { family: 'Arial', style: 'Regular' },
          },
        ],
      };

      const results = extractTextNodes(mockData);

      expect(results).toHaveLength(1);
      expect(results[0].nodeId).toBe('text2');
      expect(results[0].text).toBe('Hello');
    });

    it('空文字列のテキストノードを除外する', () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Empty Text',
            type: 'TEXT',
            characters: '',
            fontSize: 16,
            fontName: { family: 'Arial', style: 'Regular' },
          },
          {
            id: 'text2',
            name: 'Valid Text',
            type: 'TEXT',
            characters: 'Test',
            fontSize: 16,
            fontName: { family: 'Arial', style: 'Regular' },
          },
        ],
      };

      const results = extractTextNodes(mockData);

      expect(results).toHaveLength(1);
      expect(results[0].nodeId).toBe('text2');
    });

    it('1000文字を超えるテキストを切り詰める', () => {
      const longText = 'a'.repeat(1500);
      const mockData: FigmaNodeData = {
        id: 'text1',
        name: 'Long Text',
        type: 'TEXT',
        characters: longText,
        fontSize: 16,
        fontName: { family: 'Arial', style: 'Regular' },
      };

      const results = extractTextNodes(mockData);

      expect(results).toHaveLength(1);
      expect(results[0].text).toHaveLength(1000);
      expect(results[0].text).toBe('a'.repeat(1000));
    });

    it('1000文字以下のテキストはそのまま保持する', () => {
      const normalText = 'a'.repeat(500);
      const mockData: FigmaNodeData = {
        id: 'text1',
        name: 'Normal Text',
        type: 'TEXT',
        characters: normalText,
        fontSize: 16,
        fontName: { family: 'Arial', style: 'Regular' },
      };

      const results = extractTextNodes(mockData);

      expect(results).toHaveLength(1);
      expect(results[0].text).toHaveLength(500);
      expect(results[0].text).toBe(normalText);
    });

    it('ネストされた構造から全てのテキストノードを抽出する', () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        children: [
          {
            id: 'frame1',
            name: 'Frame 1',
            type: 'FRAME',
            children: [
              {
                id: 'text1',
                name: 'Text 1',
                type: 'TEXT',
                characters: 'Level 2',
                fontSize: 16,
                fontName: { family: 'Arial', style: 'Regular' },
              },
            ],
          },
          {
            id: 'frame2',
            name: 'Frame 2',
            type: 'FRAME',
            children: [
              {
                id: 'frame3',
                name: 'Frame 3',
                type: 'FRAME',
                children: [
                  {
                    id: 'text2',
                    name: 'Text 2',
                    type: 'TEXT',
                    characters: 'Level 3',
                    fontSize: 14,
                    fontName: { family: 'Arial', style: 'Regular' },
                  },
                ],
              },
            ],
          },
        ],
      };

      const results = extractTextNodes(mockData);

      expect(results).toHaveLength(2);
      expect(results[0].text).toBe('Level 2');
      expect(results[1].text).toBe('Level 3');
    });

    it('TEXTノード以外のノードは無視する', () => {
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
          {
            id: 'text1',
            name: 'Text',
            type: 'TEXT',
            characters: 'Only text',
            fontSize: 16,
            fontName: { family: 'Arial', style: 'Regular' },
          },
          {
            id: 'vector1',
            name: 'Vector',
            type: 'VECTOR',
          },
        ],
      };

      const results = extractTextNodes(mockData);

      expect(results).toHaveLength(1);
      expect(results[0].nodeId).toBe('text1');
    });

    it('循環参照を検出して無限ループを防ぐ', () => {
      const child: FigmaNodeData = {
        id: 'child',
        name: 'Child',
        type: 'TEXT',
        characters: 'Test',
        fontSize: 16,
        fontName: { family: 'Arial', style: 'Regular' },
      };

      const parent: FigmaNodeData = {
        id: 'parent',
        name: 'Parent',
        type: 'FRAME',
        children: [child],
      };

      // 循環参照を作成
      child.children = [parent];

      const results = extractTextNodes(parent);

      // 循環参照があっても処理が完了し、テキストが1つだけ抽出される
      expect(results).toHaveLength(1);
      expect(results[0].nodeId).toBe('child');
    });

    it('charactersプロパティがないTEXTノードを無視する', () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Text without characters',
            type: 'TEXT',
            fontSize: 16,
            fontName: { family: 'Arial', style: 'Regular' },
          },
          {
            id: 'text2',
            name: 'Text with characters',
            type: 'TEXT',
            characters: 'Valid',
            fontSize: 16,
            fontName: { family: 'Arial', style: 'Regular' },
          },
        ],
      };

      const results = extractTextNodes(mockData);

      expect(results).toHaveLength(1);
      expect(results[0].nodeId).toBe('text2');
    });

    it('前後の空白を削除してから判定する', () => {
      const mockData: FigmaNodeData = {
        id: 'text1',
        name: 'Text with spaces',
        type: 'TEXT',
        characters: '  Hello World  ',
        fontSize: 16,
        fontName: { family: 'Arial', style: 'Regular' },
      };

      const results = extractTextNodes(mockData);

      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('Hello World');
    });

    it('日本語、英語、混在の言語判定が正しく行われる', () => {
      const mockData: FigmaNodeData = {
        id: 'root',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: 'text1',
            name: 'Japanese',
            type: 'TEXT',
            characters: 'こんにちは',
            fontSize: 16,
            fontName: { family: 'Noto Sans JP', style: 'Regular' },
          },
          {
            id: 'text2',
            name: 'English',
            type: 'TEXT',
            characters: 'Hello',
            fontSize: 16,
            fontName: { family: 'Arial', style: 'Regular' },
          },
          {
            id: 'text3',
            name: 'Mixed',
            type: 'TEXT',
            characters: 'Helloこんにちは',
            fontSize: 16,
            fontName: { family: 'Arial', style: 'Regular' },
          },
        ],
      };

      const results = extractTextNodes(mockData);

      expect(results).toHaveLength(3);
      expect(results[0].language).toBe('japanese');
      expect(results[1].language).toBe('english');
      expect(results[2].language).toBe('mixed');
    });
  });
});
