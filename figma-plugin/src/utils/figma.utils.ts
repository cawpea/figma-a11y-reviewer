import type {
  FigmaNodeData,
  FigmaStylesData,
  StyleInfo,
  VariableAlias,
  VariableInfo,
} from '@shared/types';

// 設定
const MAX_DEPTH = 10; // 再帰の最大深さ(無限ループ防止)
const MAX_STYLES_PER_CATEGORY = 100; // 各カテゴリの最大スタイル数

/**
 * ファイル全体のスタイル定義情報を取得
 * 各カテゴリ最大100個に制限
 */
export async function extractFileStyles(): Promise<FigmaStylesData> {
  try {
    // Variables取得
    const allVariables = await figma.variables.getLocalVariablesAsync();
    const variables: VariableInfo[] = allVariables.slice(0, MAX_STYLES_PER_CATEGORY).map((v) => ({
      id: v.id,
      name: v.name,
      resolvedType: v.resolvedType,
      valuesByMode: v.valuesByMode,
    }));

    // TextStyles取得
    const allTextStyles = figma.getLocalTextStyles();
    const textStyles: StyleInfo[] = allTextStyles.slice(0, MAX_STYLES_PER_CATEGORY).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
    }));

    // ColorStyles(PaintStyles)取得
    const allPaintStyles = figma.getLocalPaintStyles();
    const colorStyles: StyleInfo[] = allPaintStyles.slice(0, MAX_STYLES_PER_CATEGORY).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
    }));

    // EffectStyles取得
    const allEffectStyles = figma.getLocalEffectStyles();
    const effectStyles: StyleInfo[] = allEffectStyles
      .slice(0, MAX_STYLES_PER_CATEGORY)
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
      }));

    const truncated =
      allVariables.length > MAX_STYLES_PER_CATEGORY ||
      allTextStyles.length > MAX_STYLES_PER_CATEGORY ||
      allPaintStyles.length > MAX_STYLES_PER_CATEGORY ||
      allEffectStyles.length > MAX_STYLES_PER_CATEGORY;

    return {
      variables,
      textStyles,
      colorStyles,
      effectStyles,
      meta: {
        variablesCount: variables.length,
        textStylesCount: textStyles.length,
        colorStylesCount: colorStyles.length,
        effectStylesCount: effectStyles.length,
        truncated,
      },
    };
  } catch (error) {
    console.error('Failed to extract file styles:', error);
    // エラーの場合は空の情報を返す
    return {
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
  }
}

/**
 * ノードデータを再帰的に抽出する関数
 */
export async function extractNodeData(node: SceneNode, depth: number = 0): Promise<FigmaNodeData> {
  // 最大深さチェック
  if (depth > MAX_DEPTH) {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      note: 'Max depth reached',
    };
  }

  const data: FigmaNodeData = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  // スタイル参照情報を取得
  // Variables バインド情報
  if ('boundVariables' in node && node.boundVariables) {
    data.boundVariables = node.boundVariables as Record<string, VariableAlias | VariableAlias[]>;
  }

  // TextStyle参照
  if (node.type === 'TEXT' && node.textStyleId && node.textStyleId !== figma.mixed) {
    data.textStyleId = node.textStyleId;
    try {
      const style = figma.getStyleById(node.textStyleId);
      if (style) {
        data.textStyleName = style.name;
      }
    } catch (error) {
      console.warn('Failed to get text style name:', error);
    }
  }

  // ColorStyle(FillStyle)参照
  if ('fillStyleId' in node && node.fillStyleId) {
    data.fillStyleId = node.fillStyleId as string;
    try {
      const style = figma.getStyleById(node.fillStyleId as string);
      if (style) {
        data.fillStyleName = style.name;
      }
    } catch (error) {
      console.warn('Failed to get fill style name:', error);
    }
  }

  // StrokeStyle参照
  if ('strokeStyleId' in node && node.strokeStyleId) {
    data.strokeStyleId = node.strokeStyleId as string;
    try {
      const style = figma.getStyleById(node.strokeStyleId as string);
      if (style) {
        data.strokeStyleName = style.name;
      }
    } catch (error) {
      console.warn('Failed to get stroke style name:', error);
    }
  }

  // EffectStyle参照
  if ('effectStyleId' in node && node.effectStyleId) {
    data.effectStyleId = node.effectStyleId as string;
    try {
      const style = figma.getStyleById(node.effectStyleId as string);
      if (style) {
        data.effectStyleName = style.name;
      }
    } catch (error) {
      console.warn('Failed to get effect style name:', error);
    }
  }

  // バウンディングボックス（サイズと位置）
  if ('absoluteBoundingBox' in node && node.absoluteBoundingBox) {
    data.absoluteBoundingBox = {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
      width: node.absoluteBoundingBox.width,
      height: node.absoluteBoundingBox.height,
    };
  }

  // レイアウト情報（Auto Layout）
  if ('layoutMode' in node) {
    data.layoutMode = node.layoutMode;
    data.primaryAxisSizingMode = node.primaryAxisSizingMode;
    data.counterAxisSizingMode = node.counterAxisSizingMode;
    data.primaryAxisAlignItems = node.primaryAxisAlignItems;
    data.counterAxisAlignItems = node.counterAxisAlignItems;
    data.paddingLeft = node.paddingLeft;
    data.paddingRight = node.paddingRight;
    data.paddingTop = node.paddingTop;
    data.paddingBottom = node.paddingBottom;
    data.itemSpacing = node.itemSpacing;
    if (node.counterAxisSpacing !== null) {
      data.counterAxisSpacing = node.counterAxisSpacing;
    }
  }

  // 塗り（背景色など）
  if ('fills' in node && node.fills !== figma.mixed && Array.isArray(node.fills)) {
    data.fills = node.fills.map((fill) => {
      if (fill.type === 'SOLID') {
        return {
          type: fill.type,
          color: {
            r: fill.color.r,
            g: fill.color.g,
            b: fill.color.b,
          },
          opacity: fill.opacity,
        };
      } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
        return {
          type: fill.type,
          opacity: fill.opacity,
        };
      }
      return { type: fill.type };
    });
  }

  // ストローク（ボーダー）
  if ('strokes' in node && Array.isArray(node.strokes)) {
    data.strokes = node.strokes.map((stroke) => {
      if (stroke.type === 'SOLID') {
        return {
          type: stroke.type,
          color: {
            r: stroke.color.r,
            g: stroke.color.g,
            b: stroke.color.b,
          },
          opacity: stroke.opacity,
        };
      }
      return { type: stroke.type };
    });

    if ('strokeWeight' in node && typeof node.strokeWeight === 'number') {
      data.strokeWeight = node.strokeWeight;
    }
  }

  // エフェクト（シャドウ、ブラーなど）
  if ('effects' in node && Array.isArray(node.effects)) {
    data.effects = node.effects
      .filter((effect) => effect.visible)
      .map((effect) => {
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
          return {
            type: effect.type,
            color: effect.color,
            offset: effect.offset,
            radius: effect.radius,
            spread: effect.spread,
          };
        }
        return { type: effect.type };
      });
  }

  // 角丸
  if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
    data.cornerRadius = node.cornerRadius;
  }

  // 透明度
  if ('opacity' in node) {
    data.opacity = node.opacity;
  }

  // テキスト情報
  if (node.type === 'TEXT') {
    data.characters = node.characters;

    // フォント情報
    if (typeof node.fontSize === 'number') {
      data.fontSize = node.fontSize;
    }

    if (node.fontName !== figma.mixed && typeof node.fontName === 'object') {
      data.fontName = {
        family: node.fontName.family,
        style: node.fontName.style,
      };
    }

    if (node.lineHeight !== figma.mixed && typeof node.lineHeight === 'object') {
      data.lineHeight = node.lineHeight;
    }

    if (node.letterSpacing !== figma.mixed && typeof node.letterSpacing === 'object') {
      data.letterSpacing = node.letterSpacing;
    }

    // テキストの配置
    if (typeof node.textAlignHorizontal === 'string') {
      data.textAlignHorizontal = node.textAlignHorizontal;
    }

    if (typeof node.textAlignVertical === 'string') {
      data.textAlignVertical = node.textAlignVertical;
    }
  }

  // コンポーネント情報
  if (node.type === 'INSTANCE') {
    try {
      const mainComponent = await node.getMainComponentAsync();
      if (mainComponent) {
        data.mainComponent = {
          id: mainComponent.id,
          name: mainComponent.name,
        };
      }
    } catch (error) {
      console.warn('Failed to get main component:', error);
      // mainComponentはundefinedのままにする
    }
  }

  // 子要素を再帰的に取得
  if ('children' in node && node.children.length > 0) {
    data.children = [];

    for (const child of node.children) {
      const childData = await extractNodeData(child, depth + 1);
      data.children.push(childData);
    }

    data.childrenCount = node.children.length;
  }

  return data;
}
