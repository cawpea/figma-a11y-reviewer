import { extractFileStyles, extractNodeData } from './figma.utils';

describe('figma.utils', () => {
  describe('extractFileStyles', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('すべてのスタイルを正しく抽出する', async () => {
      // モックデータの作成
      const mockVariables = [
        {
          id: 'var:1',
          name: 'Primary Color',
          resolvedType: 'COLOR' as const,
          valuesByMode: { mode1: { r: 1, g: 0, b: 0 } },
        },
        {
          id: 'var:2',
          name: 'Font Size',
          resolvedType: 'FLOAT' as const,
          valuesByMode: { mode1: 16 },
        },
      ];

      const mockTextStyles = [
        { id: 'text:1', name: 'Heading', description: 'Main heading style' },
        { id: 'text:2', name: 'Body', description: 'Body text style' },
      ];

      const mockPaintStyles = [
        { id: 'paint:1', name: 'Background', description: 'Background color' },
        { id: 'paint:2', name: 'Border', description: 'Border color' },
      ];

      const mockEffectStyles = [
        { id: 'effect:1', name: 'Shadow', description: 'Drop shadow' },
        { id: 'effect:2', name: 'Blur', description: 'Blur effect' },
      ];

      // Figma APIのモック
      (global as any).figma.variables = {
        getLocalVariablesAsync: jest.fn().mockResolvedValue(mockVariables),
      };
      (global as any).figma.getLocalTextStyles = jest.fn().mockReturnValue(mockTextStyles);
      (global as any).figma.getLocalPaintStyles = jest.fn().mockReturnValue(mockPaintStyles);
      (global as any).figma.getLocalEffectStyles = jest.fn().mockReturnValue(mockEffectStyles);

      const result = await extractFileStyles();

      expect(result.variables).toHaveLength(2);
      expect(result.textStyles).toHaveLength(2);
      expect(result.colorStyles).toHaveLength(2);
      expect(result.effectStyles).toHaveLength(2);
      expect(result.meta.variablesCount).toBe(2);
      expect(result.meta.textStylesCount).toBe(2);
      expect(result.meta.colorStylesCount).toBe(2);
      expect(result.meta.effectStylesCount).toBe(2);
      expect(result.meta.truncated).toBe(false);
    });

    it('スタイルが100個を超える場合、切り詰めフラグがtrueになる', async () => {
      // 101個のスタイルを作成
      const manyVariables = Array.from({ length: 101 }, (_, i) => ({
        id: `var:${i}`,
        name: `Variable ${i}`,
        resolvedType: 'COLOR' as const,
        valuesByMode: { mode1: { r: 1, g: 0, b: 0 } },
      }));

      (global as any).figma.variables = {
        getLocalVariablesAsync: jest.fn().mockResolvedValue(manyVariables),
      };
      (global as any).figma.getLocalTextStyles = jest.fn().mockReturnValue([]);
      (global as any).figma.getLocalPaintStyles = jest.fn().mockReturnValue([]);
      (global as any).figma.getLocalEffectStyles = jest.fn().mockReturnValue([]);

      const result = await extractFileStyles();

      expect(result.variables).toHaveLength(100);
      expect(result.meta.variablesCount).toBe(100);
      expect(result.meta.truncated).toBe(true);
    });

    it('エラーが発生した場合、空のデータを返す', async () => {
      (global as any).figma.variables = {
        getLocalVariablesAsync: jest.fn().mockRejectedValue(new Error('API Error')),
      };
      (global as any).figma.getLocalTextStyles = jest.fn().mockImplementation(() => {
        throw new Error('API Error');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await extractFileStyles();

      expect(result.variables).toHaveLength(0);
      expect(result.textStyles).toHaveLength(0);
      expect(result.colorStyles).toHaveLength(0);
      expect(result.effectStyles).toHaveLength(0);
      expect(result.meta.variablesCount).toBe(0);
      expect(result.meta.truncated).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to extract file styles:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('スタイルがない場合、空の配列を返す', async () => {
      (global as any).figma.variables = {
        getLocalVariablesAsync: jest.fn().mockResolvedValue([]),
      };
      (global as any).figma.getLocalTextStyles = jest.fn().mockReturnValue([]);
      (global as any).figma.getLocalPaintStyles = jest.fn().mockReturnValue([]);
      (global as any).figma.getLocalEffectStyles = jest.fn().mockReturnValue([]);

      const result = await extractFileStyles();

      expect(result.variables).toHaveLength(0);
      expect(result.textStyles).toHaveLength(0);
      expect(result.colorStyles).toHaveLength(0);
      expect(result.effectStyles).toHaveLength(0);
      expect(result.meta.truncated).toBe(false);
    });
  });

  describe('extractNodeData', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('基本的なノード情報を抽出する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Test Frame',
        type: 'FRAME',
      } as SceneNode;

      const result = await extractNodeData(mockNode);

      expect(result.id).toBe('1:1');
      expect(result.name).toBe('Test Frame');
      expect(result.type).toBe('FRAME');
    });

    it('最大深さに達した場合、noteを付与する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Deep Node',
        type: 'FRAME',
      } as SceneNode;

      const result = await extractNodeData(mockNode, 11); // MAX_DEPTH = 10

      expect(result.note).toBe('Max depth reached');
      expect(result.children).toBeUndefined();
    });

    it('boundVariablesを抽出する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Node with Variables',
        type: 'FRAME',
        boundVariables: {
          fills: { id: 'var:1', type: 'VARIABLE_ALIAS' },
        },
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.boundVariables).toEqual({
        fills: { id: 'var:1', type: 'VARIABLE_ALIAS' },
      });
    });

    it('TEXTノードのスタイルIDと名前を抽出する', async () => {
      const mockStyle = {
        id: 'style:1',
        name: 'Heading Style',
      };

      (global as any).figma.getStyleById = jest.fn().mockReturnValue(mockStyle);

      const mockTextNode = {
        id: '1:2',
        name: 'Text Node',
        type: 'TEXT',
        textStyleId: 'style:1',
        characters: 'Hello World',
        fontSize: 16,
        fontName: { family: 'Arial', style: 'Regular' },
        textAlignHorizontal: 'LEFT',
        textAlignVertical: 'TOP',
      } as any;

      const result = await extractNodeData(mockTextNode);

      expect(result.textStyleId).toBe('style:1');
      expect(result.textStyleName).toBe('Heading Style');
      expect(result.characters).toBe('Hello World');
      expect(result.fontSize).toBe(16);
      expect(result.fontName).toEqual({ family: 'Arial', style: 'Regular' });
    });

    it('fillStyleIdと名前を抽出する', async () => {
      const mockStyle = {
        id: 'fill:1',
        name: 'Primary Fill',
      };

      (global as any).figma.getStyleById = jest.fn().mockReturnValue(mockStyle);

      const mockNode = {
        id: '1:1',
        name: 'Node with Fill',
        type: 'FRAME',
        fillStyleId: 'fill:1',
        fills: [
          {
            type: 'SOLID',
            color: { r: 1, g: 0, b: 0 },
            opacity: 1,
          },
        ],
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.fillStyleId).toBe('fill:1');
      expect(result.fillStyleName).toBe('Primary Fill');
      expect(result.fills).toHaveLength(1);
      expect(result.fills?.[0]).toEqual({
        type: 'SOLID',
        color: { r: 1, g: 0, b: 0 },
        opacity: 1,
      });
    });

    it('absoluteBoundingBoxを抽出する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Positioned Node',
        type: 'FRAME',
        absoluteBoundingBox: {
          x: 10,
          y: 20,
          width: 100,
          height: 200,
        },
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.absoluteBoundingBox).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 200,
      });
    });

    it('Auto Layout情報を抽出する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Auto Layout Frame',
        type: 'FRAME',
        layoutMode: 'HORIZONTAL',
        primaryAxisSizingMode: 'AUTO',
        counterAxisSizingMode: 'FIXED',
        primaryAxisAlignItems: 'CENTER',
        counterAxisAlignItems: 'CENTER',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 20,
        paddingBottom: 20,
        itemSpacing: 8,
        counterAxisSpacing: 12,
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.layoutMode).toBe('HORIZONTAL');
      expect(result.primaryAxisSizingMode).toBe('AUTO');
      expect(result.counterAxisSizingMode).toBe('FIXED');
      expect(result.paddingLeft).toBe(10);
      expect(result.itemSpacing).toBe(8);
      expect(result.counterAxisSpacing).toBe(12);
    });

    it('strokesとstrokeWeightを抽出する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Node with Stroke',
        type: 'FRAME',
        strokes: [
          {
            type: 'SOLID',
            color: { r: 0, g: 0, b: 1 },
            opacity: 0.8,
          },
        ],
        strokeWeight: 2,
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.strokes).toHaveLength(1);
      expect(result.strokes?.[0]).toEqual({
        type: 'SOLID',
        color: { r: 0, g: 0, b: 1 },
        opacity: 0.8,
      });
      expect(result.strokeWeight).toBe(2);
    });

    it('effectsを抽出する（非表示のエフェクトは除外）', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Node with Effects',
        type: 'FRAME',
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: true,
            color: { r: 0, g: 0, b: 0, a: 0.5 },
            offset: { x: 0, y: 4 },
            radius: 8,
            spread: 0,
          },
          {
            type: 'INNER_SHADOW',
            visible: false, // この効果は除外される
            color: { r: 1, g: 1, b: 1, a: 0.5 },
            offset: { x: 0, y: 2 },
            radius: 4,
            spread: 0,
          },
        ],
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.effects).toHaveLength(1);
      expect(result.effects?.[0].type).toBe('DROP_SHADOW');
    });

    it('cornerRadiusとopacityを抽出する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Rounded Node',
        type: 'FRAME',
        cornerRadius: 12,
        opacity: 0.9,
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.cornerRadius).toBe(12);
      expect(result.opacity).toBe(0.9);
    });

    it('INSTANCEノードのmainComponentを抽出する', async () => {
      const mockMainComponent = {
        id: 'comp:1',
        name: 'Button Component',
      };

      const mockInstance = {
        id: '1:3',
        name: 'Button Instance',
        type: 'INSTANCE',
        getMainComponentAsync: jest.fn().mockResolvedValue(mockMainComponent),
      } as any;

      const result = await extractNodeData(mockInstance);

      expect(result.mainComponent).toEqual({
        id: 'comp:1',
        name: 'Button Component',
      });
    });

    it('mainComponent取得失敗時は警告を出しundefinedを保持する', async () => {
      const mockInstance = {
        id: '1:3',
        name: 'Button Instance',
        type: 'INSTANCE',
        getMainComponentAsync: jest.fn().mockRejectedValue(new Error('Component not found')),
      } as any;

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await extractNodeData(mockInstance);

      expect(result.mainComponent).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to get main component:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('子要素を再帰的に抽出する', async () => {
      const mockChildNode1 = {
        id: '1:2',
        name: 'Child 1',
        type: 'RECTANGLE',
      } as any;

      const mockChildNode2 = {
        id: '1:3',
        name: 'Child 2',
        type: 'TEXT',
      } as any;

      const mockParentNode = {
        id: '1:1',
        name: 'Parent Frame',
        type: 'FRAME',
        children: [mockChildNode1, mockChildNode2],
      } as any;

      const result = await extractNodeData(mockParentNode);

      expect(result.children).toHaveLength(2);
      expect(result.childrenCount).toBe(2);
      expect(result.children?.[0].id).toBe('1:2');
      expect(result.children?.[1].id).toBe('1:3');
    });

    it('深い階層構造を再帰的に処理する', async () => {
      const mockLevel2Child = {
        id: '1:3',
        name: 'Level 2',
        type: 'RECTANGLE',
      } as any;

      const mockLevel1Child = {
        id: '1:2',
        name: 'Level 1',
        type: 'FRAME',
        children: [mockLevel2Child],
      } as any;

      const mockRootNode = {
        id: '1:1',
        name: 'Root',
        type: 'FRAME',
        children: [mockLevel1Child],
      } as any;

      const result = await extractNodeData(mockRootNode);

      expect(result.children).toHaveLength(1);
      expect(result.children?.[0].id).toBe('1:2');
      expect(result.children?.[0].children).toHaveLength(1);
      expect(result.children?.[0].children?.[0].id).toBe('1:3');
    });

    it('グラデーション塗りを正しく処理する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Gradient Node',
        type: 'FRAME',
        fills: [
          {
            type: 'GRADIENT_LINEAR',
            opacity: 1,
          },
          {
            type: 'GRADIENT_RADIAL',
            opacity: 0.8,
          },
        ],
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.fills).toHaveLength(2);
      expect(result.fills?.[0]).toEqual({
        type: 'GRADIENT_LINEAR',
        opacity: 1,
      });
      expect(result.fills?.[1]).toEqual({
        type: 'GRADIENT_RADIAL',
        opacity: 0.8,
      });
    });

    it('TEXTノードでlineHeightとletterSpacingを抽出する', async () => {
      const mockTextNode = {
        id: '1:2',
        name: 'Text Node',
        type: 'TEXT',
        characters: 'Test',
        lineHeight: { value: 1.5, unit: 'PERCENT' },
        letterSpacing: { value: 0.5, unit: 'PIXELS' },
      } as any;

      const result = await extractNodeData(mockTextNode);

      expect(result.lineHeight).toEqual({ value: 1.5, unit: 'PERCENT' });
      expect(result.letterSpacing).toEqual({ value: 0.5, unit: 'PIXELS' });
    });

    it('スタイル取得エラー時は警告を出し続行する', async () => {
      (global as any).figma.getStyleById = jest.fn().mockImplementation(() => {
        throw new Error('Style not found');
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mockTextNode = {
        id: '1:2',
        name: 'Text Node',
        type: 'TEXT',
        textStyleId: 'style:999',
        characters: 'Test',
      } as any;

      const result = await extractNodeData(mockTextNode);

      expect(result.textStyleId).toBe('style:999');
      expect(result.textStyleName).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to get text style name:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('fillStyleId、strokeStyleId、effectStyleIdのスタイル取得エラー時も警告を出し続行する', async () => {
      (global as any).figma.getStyleById = jest.fn().mockImplementation(() => {
        throw new Error('Style not found');
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mockNode = {
        id: '1:1',
        name: 'Node with Styles',
        type: 'FRAME',
        fillStyleId: 'fill:999',
        strokeStyleId: 'stroke:999',
        effectStyleId: 'effect:999',
        fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 }, opacity: 1 }],
        strokes: [{ type: 'SOLID', color: { r: 0, g: 0, b: 1 }, opacity: 1 }],
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: true,
            color: { r: 0, g: 0, b: 0, a: 0.5 },
            offset: { x: 0, y: 4 },
            radius: 8,
            spread: 0,
          },
        ],
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.fillStyleId).toBe('fill:999');
      expect(result.fillStyleName).toBeUndefined();
      expect(result.strokeStyleId).toBe('stroke:999');
      expect(result.strokeStyleName).toBeUndefined();
      expect(result.effectStyleId).toBe('effect:999');
      expect(result.effectStyleName).toBeUndefined();

      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to get fill style name:',
        expect.any(Error)
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to get stroke style name:',
        expect.any(Error)
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to get effect style name:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('counterAxisSpacingがnullの場合は含めない', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Auto Layout Frame',
        type: 'FRAME',
        layoutMode: 'HORIZONTAL',
        primaryAxisSizingMode: 'AUTO',
        counterAxisSizingMode: 'FIXED',
        primaryAxisAlignItems: 'CENTER',
        counterAxisAlignItems: 'CENTER',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 20,
        paddingBottom: 20,
        itemSpacing: 8,
        counterAxisSpacing: null,
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.layoutMode).toBe('HORIZONTAL');
      expect(result.itemSpacing).toBe(8);
      expect(result.counterAxisSpacing).toBeUndefined();
    });

    it('その他のfillタイプを処理する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Node with Image Fill',
        type: 'FRAME',
        fills: [
          {
            type: 'IMAGE',
          },
        ],
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.fills).toHaveLength(1);
      expect(result.fills?.[0]).toEqual({ type: 'IMAGE' });
    });

    it('その他のstrokeタイプを処理する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Node with Gradient Stroke',
        type: 'FRAME',
        strokes: [
          {
            type: 'GRADIENT_LINEAR',
          },
        ],
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.strokes).toHaveLength(1);
      expect(result.strokes?.[0]).toEqual({ type: 'GRADIENT_LINEAR' });
    });

    it('その他のeffectタイプを処理する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Node with Blur Effect',
        type: 'FRAME',
        effects: [
          {
            type: 'LAYER_BLUR',
            visible: true,
          },
        ],
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.effects).toHaveLength(1);
      expect(result.effects?.[0]).toEqual({ type: 'LAYER_BLUR' });
    });

    it('TEXTノードでfontNameがmixedの場合は含めない', async () => {
      const mockTextNode = {
        id: '1:2',
        name: 'Text Node',
        type: 'TEXT',
        characters: 'Test',
        fontSize: 16,
        fontName: Symbol('mixed') as any, // figma.mixed
      } as any;

      const result = await extractNodeData(mockTextNode);

      expect(result.characters).toBe('Test');
      expect(result.fontSize).toBe(16);
      expect(result.fontName).toBeUndefined();
    });

    it('TEXTノードでlineHeightとletterSpacingがmixedの場合は含めない', async () => {
      const mockTextNode = {
        id: '1:2',
        name: 'Text Node',
        type: 'TEXT',
        characters: 'Test',
        lineHeight: Symbol('mixed') as any, // figma.mixed
        letterSpacing: Symbol('mixed') as any, // figma.mixed
      } as any;

      const result = await extractNodeData(mockTextNode);

      expect(result.characters).toBe('Test');
      expect(result.lineHeight).toBeUndefined();
      expect(result.letterSpacing).toBeUndefined();
    });

    it('getStyleByIdがnullを返す場合、スタイル名は含めない', async () => {
      (global as any).figma.getStyleById = jest.fn().mockReturnValue(null);

      const mockNode = {
        id: '1:1',
        name: 'Node with Styles',
        type: 'FRAME',
        fillStyleId: 'fill:1',
        strokeStyleId: 'stroke:1',
        effectStyleId: 'effect:1',
        fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 }, opacity: 1 }],
        strokes: [{ type: 'SOLID', color: { r: 0, g: 0, b: 1 }, opacity: 1 }],
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: true,
            color: { r: 0, g: 0, b: 0, a: 0.5 },
            offset: { x: 0, y: 4 },
            radius: 8,
            spread: 0,
          },
        ],
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.fillStyleId).toBe('fill:1');
      expect(result.fillStyleName).toBeUndefined();
      expect(result.strokeStyleId).toBe('stroke:1');
      expect(result.strokeStyleName).toBeUndefined();
      expect(result.effectStyleId).toBe('effect:1');
      expect(result.effectStyleName).toBeUndefined();
    });

    it('TEXTノードでtextStyleIdがmixedの場合はスタイル名を取得しない', async () => {
      const mockMixed = Symbol('mixed');
      (global as any).figma.mixed = mockMixed;

      const mockTextNode = {
        id: '1:2',
        name: 'Text Node',
        type: 'TEXT',
        textStyleId: mockMixed,
        characters: 'Test',
      } as any;

      const result = await extractNodeData(mockTextNode);

      expect(result.characters).toBe('Test');
      // textStyleIdはmixedなので処理されない
      expect(result.textStyleId).toBeUndefined();
      expect(result.textStyleName).toBeUndefined();
    });

    it('ルートノードが非表示の場合、エラーをスローする', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Hidden Frame',
        type: 'FRAME',
        visible: false,
      } as any;

      await expect(extractNodeData(mockNode, 0)).rejects.toThrow('選択したフレームが非表示です');
    });

    it('非表示の子ノードを除外する', async () => {
      const mockVisibleChild = {
        id: '1:2',
        name: 'Visible Child',
        type: 'RECTANGLE',
        visible: true,
      } as any;

      const mockHiddenChild = {
        id: '1:3',
        name: 'Hidden Child',
        type: 'TEXT',
        visible: false,
      } as any;

      const mockParentNode = {
        id: '1:1',
        name: 'Parent Frame',
        type: 'FRAME',
        visible: true,
        children: [mockVisibleChild, mockHiddenChild],
      } as any;

      const result = await extractNodeData(mockParentNode);

      expect(result.children).toHaveLength(1);
      expect(result.children?.[0].id).toBe('1:2');
      expect(result.childrenCount).toBe(1);
    });

    it('すべての子ノードが非表示の場合、空の配列を返す', async () => {
      const mockHiddenChild1 = {
        id: '1:2',
        name: 'Hidden Child 1',
        type: 'RECTANGLE',
        visible: false,
      } as any;

      const mockHiddenChild2 = {
        id: '1:3',
        name: 'Hidden Child 2',
        type: 'TEXT',
        visible: false,
      } as any;

      const mockParentNode = {
        id: '1:1',
        name: 'Parent Frame',
        type: 'FRAME',
        visible: true,
        children: [mockHiddenChild1, mockHiddenChild2],
      } as any;

      const result = await extractNodeData(mockParentNode);

      expect(result.children).toHaveLength(0);
      expect(result.childrenCount).toBe(0);
    });

    it('非表示ノードの子孫すべてを除外する', async () => {
      const mockGrandchild = {
        id: '1:3',
        name: 'Visible Grandchild',
        type: 'RECTANGLE',
        visible: true,
      } as any;

      const mockHiddenChild = {
        id: '1:2',
        name: 'Hidden Child',
        type: 'FRAME',
        visible: false,
        children: [mockGrandchild],
      } as any;

      const mockParentNode = {
        id: '1:1',
        name: 'Parent Frame',
        type: 'FRAME',
        visible: true,
        children: [mockHiddenChild],
      } as any;

      const result = await extractNodeData(mockParentNode);

      expect(result.children).toHaveLength(0);
      expect(result.childrenCount).toBe(0);
    });

    it('表示中のノードは通常通り処理する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Visible Frame',
        type: 'FRAME',
        visible: true,
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.id).toBe('1:1');
      expect(result.name).toBe('Visible Frame');
      expect(result.type).toBe('FRAME');
      expect(result.note).toBeUndefined();
    });

    it('visibleプロパティがないノードは通常通り処理する', async () => {
      const mockNode = {
        id: '1:1',
        name: 'Node Without Visible',
        type: 'FRAME',
        // visible property not present
      } as any;

      const result = await extractNodeData(mockNode);

      expect(result.id).toBe('1:1');
      expect(result.name).toBe('Node Without Visible');
      expect(result.note).toBeUndefined();
    });

    it('非ルートの非表示ノードにはnoteを付与する', async () => {
      const mockHiddenChild = {
        id: '1:2',
        name: 'Hidden Child',
        type: 'RECTANGLE',
        visible: false,
      } as any;

      const result = await extractNodeData(mockHiddenChild, 1);

      expect(result.id).toBe('1:2');
      expect(result.name).toBe('Hidden Child');
      expect(result.note).toBe('Hidden layer (excluded from evaluation)');
      expect(result.children).toBeUndefined();
    });
  });
});
