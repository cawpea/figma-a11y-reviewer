import { CategoryResult, FigmaNodeData, FigmaStylesData } from '@shared/types';

import { calculateWCAGContrast, rgbToHex } from './accessibility';

/**
 * プロンプトインジェクション対策: ユーザー入力をエスケープ
 * ダブルクォート、バッククォート、改行などの特殊文字をエスケープして、
 * プロンプトの構造が破壊されるのを防ぎます。
 */
export function escapeForPrompt(text: string): string {
  return text
    .replace(/\\/g, '\\\\') // バックスラッシュ
    .replace(/"/g, '\\"') // ダブルクォート
    .replace(/`/g, '\\`') // バッククォート
    .replace(/\n/g, '\\n') // 改行
    .replace(/\r/g, '\\r') // キャリッジリターン
    .replace(/\t/g, '\\t'); // タブ
}

/**
 * カラーコントラスト情報
 */
interface ColorContrastInfo {
  textColor: string;
  backgroundColor: string;
  nodeName: string;
  nodeId: string;
  contrastRatio: number;
  wcagCompliance: {
    AA: {
      normal_text: boolean;
      large_text: boolean;
    };
    AAA: {
      normal_text: boolean;
      large_text: boolean;
    };
  };
}

/**
 * Figmaデータを評価用に整形（階層構造を保持）
 */
export function formatFigmaDataForEvaluation(data: FigmaNodeData): string {
  const visited = new Set<string>();
  return formatNodeRecursive(data, 0, visited);
}

/**
 * ノードを再帰的に整形
 */
function formatNodeRecursive(
  node: FigmaNodeData,
  depth: number,
  visited: Set<string> = new Set(),
  maxDepth: number = 10
): string {
  const indent = '  '.repeat(depth);
  let output = '';

  // 深度制限チェック
  if (depth > maxDepth) {
    output += `${indent}[最大深度 ${maxDepth} に達しました]\n`;
    return output;
  }

  // 循環参照チェック
  if (visited.has(node.id)) {
    output += `${indent}[循環参照を検出: ${escapeForPrompt(node.name)} (ID: ${node.id})]\n`;
    return output;
  }

  // 訪問済みとしてマーク
  visited.add(node.id);

  // ノード基本情報
  output += `${indent}【${node.type}】 ${escapeForPrompt(node.name)} (ID: ${node.id})\n`;

  // サイズ情報
  if (node.absoluteBoundingBox) {
    output += `${indent}  サイズ: ${Math.round(node.absoluteBoundingBox.width)}×${Math.round(node.absoluteBoundingBox.height)}px\n`;
  }

  // レイアウト情報
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    output += `${indent}  Auto Layout: ${node.layoutMode}\n`;
    output += `${indent}    padding: ${node.paddingTop}/${node.paddingRight}/${node.paddingBottom}/${node.paddingLeft}px\n`;
    output += `${indent}    itemSpacing: ${node.itemSpacing}px\n`;
    if (node.counterAxisSpacing) {
      output += `${indent}    counterAxisSpacing: ${node.counterAxisSpacing}px\n`;
    }
    output += `${indent}    primaryAxisAlignItems: ${node.primaryAxisAlignItems}\n`;
    output += `${indent}    counterAxisAlignItems: ${node.counterAxisAlignItems}\n`;
  }

  // 塗り（背景色）
  if (node.fills && node.fills.length > 0) {
    node.fills.forEach((fill, index: number) => {
      if (fill.type === 'SOLID' && fill.color) {
        const color = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
        output += `${indent}  背景色 ${index + 1}: ${color} (opacity: ${fill.opacity})\n`;
      }
    });
  }

  // ストローク（ボーダー）
  if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
    node.strokes.forEach((stroke, index: number) => {
      if (stroke.type === 'SOLID' && stroke.color) {
        const color = rgbToHex(stroke.color.r, stroke.color.g, stroke.color.b);
        output += `${indent}  ボーダー ${index + 1}: ${color} ${node.strokeWeight}px (opacity: ${stroke.opacity})\n`;
      }
    });
  }

  // 角丸
  if (node.cornerRadius) {
    output += `${indent}  角丸: ${node.cornerRadius}px\n`;
  }

  // テキスト情報
  if (node.type === 'TEXT') {
    output += `${indent}  テキスト: "${escapeForPrompt(node.characters || '')}"\n`;
    output += `${indent}  フォント: ${node.fontName?.family} ${node.fontName?.style}\n`;
    output += `${indent}  フォントサイズ: ${node.fontSize}px\n`;

    if (node.lineHeight) {
      if (typeof node.lineHeight === 'object') {
        if (node.lineHeight.unit === 'PIXELS' && node.lineHeight.value) {
          output += `${indent}  行間: ${node.lineHeight.value}px\n`;
        } else if (node.lineHeight.unit === 'PERCENT' && node.lineHeight.value) {
          output += `${indent}  行間: ${node.lineHeight.value}%\n`;
        } else if (node.lineHeight.unit === 'AUTO') {
          output += `${indent}  行間: 自動\n`;
        }
      } else if (typeof node.lineHeight === 'number') {
        output += `${indent}  行間: ${node.lineHeight}px\n`;
      }
    }

    output += `${indent}  配置: ${node.textAlignHorizontal} / ${node.textAlignVertical}\n`;
  }

  // エフェクト
  if (node.effects && node.effects.length > 0) {
    output += `${indent}  エフェクト: ${node.effects.map((e) => e.type).join(', ')}\n`;
  }

  // 透明度
  if (node.opacity !== undefined && node.opacity < 1) {
    output += `${indent}  透明度: ${Math.round(node.opacity * 100)}%\n`;
  }

  // コンポーネント情報
  if (node.mainComponent && node.mainComponent.name) {
    output += `${indent}  コンポーネント: ${escapeForPrompt(node.mainComponent.name)}\n`;
  }

  // 子要素を再帰的に処理
  if (node.children && node.children.length > 0) {
    output += `${indent}  子要素数: ${node.children.length}\n`;
    node.children.forEach((child) => {
      output += formatNodeRecursive(child, depth + 1, visited, maxDepth);
    });
  }

  return output;
}

/**
 * スタイル適用状況マップを生成
 * Variables、TextStyle、ColorStyleなどのスタイル定義と実際の適用状況を可視化
 */
export function buildStylesApplicationMap(
  nodeData: FigmaNodeData,
  stylesData?: FigmaStylesData
): string {
  if (!stylesData) {
    return '⚠️ スタイル情報が取得されていません。';
  }

  let output = '## スタイル定義と適用状況\n\n';

  // メタ情報の表示
  if (stylesData.meta.truncated) {
    output +=
      '> **注意**: スタイル情報が100件を超えたため、各カテゴリ最初の100件のみ表示しています。\n\n';
  }

  // ファイル全体で定義されているスタイル一覧
  output += '### 1. ファイル内で定義されているスタイル\n\n';

  // Variables
  output += `#### Variables（デザイントークン）: ${stylesData.meta.variablesCount}件\n`;
  if (stylesData.variables.length > 0) {
    stylesData.variables.forEach((v, index) => {
      output += `${index + 1}. **${v.name}** (${v.resolvedType}) - ID: ${v.id}\n`;
    });
    output += '\n';
  } else {
    output += '_Variablesは定義されていません_\n\n';
  }

  // TextStyles
  output += `#### TextStyles: ${stylesData.meta.textStylesCount}件\n`;
  if (stylesData.textStyles.length > 0) {
    stylesData.textStyles.forEach((s, index) => {
      output += `${index + 1}. **${s.name}**${s.description ? ` - ${s.description}` : ''} - ID: ${s.id}\n`;
    });
    output += '\n';
  } else {
    output += '_TextStylesは定義されていません_\n\n';
  }

  // ColorStyles
  output += `#### ColorStyles: ${stylesData.meta.colorStylesCount}件\n`;
  if (stylesData.colorStyles.length > 0) {
    stylesData.colorStyles.forEach((s, index) => {
      output += `${index + 1}. **${s.name}**${s.description ? ` - ${s.description}` : ''} - ID: ${s.id}\n`;
    });
    output += '\n';
  } else {
    output += '_ColorStylesは定義されていません_\n\n';
  }

  // EffectStyles
  output += `#### EffectStyles（シャドウ/ブラー）: ${stylesData.meta.effectStylesCount}件\n`;
  if (stylesData.effectStyles.length > 0) {
    stylesData.effectStyles.forEach((s, index) => {
      output += `${index + 1}. **${s.name}**${s.description ? ` - ${s.description}` : ''} - ID: ${s.id}\n`;
    });
    output += '\n';
  } else {
    output += '_EffectStylesは定義されていません_\n\n';
  }

  // 実際の適用状況を収集
  const usageStats = collectStyleUsage(nodeData, stylesData);

  output += '### 2. 選択されたノード内でのスタイル適用状況\n\n';

  // Variables使用状況
  output += `#### Variables適用状況\n`;
  if (usageStats.variablesUsed.length > 0) {
    output += `✅ **使用されているVariables (${usageStats.variablesUsed.length}件):**\n`;
    usageStats.variablesUsed.forEach((usage) => {
      output += `- **${usage.variableName}** → ${escapeForPrompt(usage.nodeName)} (ID: ${usage.nodeId}) [${usage.property}]\n`;
    });
    output += '\n';
  } else {
    output += '⚠️ _Variablesは使用されていません_\n\n';
  }

  // TextStyle使用状況
  output += `#### TextStyle適用状況\n`;
  if (usageStats.textStylesUsed.length > 0) {
    output += `✅ **使用されているTextStyles (${usageStats.textStylesUsed.length}件):**\n`;
    usageStats.textStylesUsed.forEach((usage) => {
      output += `- **${usage.styleName}** → ${escapeForPrompt(usage.nodeName)} (ID: ${usage.nodeId})\n`;
    });
    output += '\n';
  } else {
    output += '⚠️ _TextStylesは使用されていません_\n\n';
  }
  if (usageStats.textNodesWithoutStyle.length > 0) {
    output += `❌ **TextStyleが未適用のテキスト (${usageStats.textNodesWithoutStyle.length}件):**\n`;
    usageStats.textNodesWithoutStyle.forEach((node) => {
      output += `- ${escapeForPrompt(node.name)} (ID: ${node.id}) - フォント: ${node.fontFamily} ${node.fontSize}px\n`;
    });
    output += '\n';
  }

  // ColorStyle使用状況
  output += `#### ColorStyle適用状況\n`;
  if (usageStats.colorStylesUsed.length > 0) {
    output += `✅ **使用されているColorStyles (${usageStats.colorStylesUsed.length}件):**\n`;
    usageStats.colorStylesUsed.forEach((usage) => {
      output += `- **${usage.styleName}** → ${escapeForPrompt(usage.nodeName)} (ID: ${usage.nodeId}) [${usage.type}]\n`;
    });
    output += '\n';
  } else {
    output += '⚠️ _ColorStylesは使用されていません_\n\n';
  }
  if (usageStats.hardcodedColors.length > 0) {
    output += `❌ **ハードコードされた色 (${usageStats.hardcodedColors.length}件):**\n`;
    usageStats.hardcodedColors.forEach((item) => {
      output += `- ${escapeForPrompt(item.nodeName)} (ID: ${item.nodeId}) - ${item.type}: ${item.color}\n`;
    });
    output += '\n';
  }

  // EffectStyle使用状況
  output += `#### EffectStyle適用状況\n`;
  if (usageStats.effectStylesUsed.length > 0) {
    output += `✅ **使用されているEffectStyles (${usageStats.effectStylesUsed.length}件):**\n`;
    usageStats.effectStylesUsed.forEach((usage) => {
      output += `- **${usage.styleName}** → ${escapeForPrompt(usage.nodeName)} (ID: ${usage.nodeId})\n`;
    });
    output += '\n';
  } else {
    output += '⚠️ _EffectStylesは使用されていません_\n\n';
  }

  output += '---\n\n';
  output += '**評価時の参考情報:**\n';
  output += '- 上記の情報を基に、スタイルの一貫性と適切な適用を評価してください\n';
  output += '- ハードコードされた値がある場合は、適切なスタイルの使用を提案してください\n';
  output += '- 未使用のスタイル定義がある場合は、削除または活用を検討してください\n';

  return output;
}

/**
 * スタイル使用状況の統計情報
 */
interface StyleUsageStats {
  variablesUsed: Array<{
    variableName: string;
    nodeId: string;
    nodeName: string;
    property: string;
  }>;
  textStylesUsed: Array<{
    styleName: string;
    nodeId: string;
    nodeName: string;
  }>;
  textNodesWithoutStyle: Array<{
    id: string;
    name: string;
    fontFamily?: string;
    fontSize?: number;
  }>;
  colorStylesUsed: Array<{
    styleName: string;
    nodeId: string;
    nodeName: string;
    type: 'fill' | 'stroke';
  }>;
  hardcodedColors: Array<{
    nodeId: string;
    nodeName: string;
    color: string;
    type: 'fill' | 'stroke';
  }>;
  effectStylesUsed: Array<{
    styleName: string;
    nodeId: string;
    nodeName: string;
  }>;
}

/**
 * ノードツリーからスタイル使用状況を収集
 */
function collectStyleUsage(
  node: FigmaNodeData,
  stylesData: FigmaStylesData,
  stats: StyleUsageStats = {
    variablesUsed: [],
    textStylesUsed: [],
    textNodesWithoutStyle: [],
    colorStylesUsed: [],
    hardcodedColors: [],
    effectStylesUsed: [],
  },
  visited: Set<string> = new Set()
): StyleUsageStats {
  // 循環参照チェック
  if (visited.has(node.id)) {
    return stats;
  }
  visited.add(node.id);

  // Variables使用状況
  if (node.boundVariables) {
    Object.entries(node.boundVariables).forEach(([property, alias]) => {
      const aliases = Array.isArray(alias) ? alias : [alias];
      aliases.forEach((a) => {
        if (a.type === 'VARIABLE_ALIAS') {
          const variable = stylesData.variables.find((v) => v.id === a.id);
          if (variable) {
            stats.variablesUsed.push({
              variableName: variable.name,
              nodeId: node.id,
              nodeName: node.name,
              property,
            });
          }
        }
      });
    });
  }

  // TextStyle使用状況
  if (node.type === 'TEXT') {
    if (node.textStyleId && node.textStyleName) {
      stats.textStylesUsed.push({
        styleName: node.textStyleName,
        nodeId: node.id,
        nodeName: node.name,
      });
    } else if (!node.textStyleId) {
      // TextStyleが未適用
      stats.textNodesWithoutStyle.push({
        id: node.id,
        name: node.name,
        fontFamily: node.fontName?.family,
        fontSize: node.fontSize,
      });
    }
  }

  // ColorStyle使用状況
  if (node.fillStyleId && node.fillStyleName) {
    stats.colorStylesUsed.push({
      styleName: node.fillStyleName,
      nodeId: node.id,
      nodeName: node.name,
      type: 'fill',
    });
  } else if (node.fills && node.fills.length > 0) {
    // ハードコードされた色を検出
    node.fills.forEach((fill) => {
      if (fill.type === 'SOLID' && fill.color) {
        const color = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
        stats.hardcodedColors.push({
          nodeId: node.id,
          nodeName: node.name,
          color,
          type: 'fill',
        });
      }
    });
  }

  if (node.strokeStyleId && node.strokeStyleName) {
    stats.colorStylesUsed.push({
      styleName: node.strokeStyleName,
      nodeId: node.id,
      nodeName: node.name,
      type: 'stroke',
    });
  } else if (node.strokes && node.strokes.length > 0) {
    // ハードコードされたストローク色を検出
    node.strokes.forEach((stroke) => {
      if (stroke.type === 'SOLID' && stroke.color) {
        const color = rgbToHex(stroke.color.r, stroke.color.g, stroke.color.b);
        stats.hardcodedColors.push({
          nodeId: node.id,
          nodeName: node.name,
          color,
          type: 'stroke',
        });
      }
    });
  }

  // EffectStyle使用状況
  if (node.effectStyleId && node.effectStyleName) {
    stats.effectStylesUsed.push({
      styleName: node.effectStyleName,
      nodeId: node.id,
      nodeName: node.name,
    });
  }

  // 子要素を再帰的に処理
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      collectStyleUsage(child, stylesData, stats, visited);
    });
  }

  return stats;
}

/**
 * JSONレスポンスから評価結果を抽出
 */
export function extractJsonFromResponse(text: string): CategoryResult {
  // コードブロック内のJSONを抽出
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // コードブロックなしのJSONを抽出
  const directJsonMatch = text.match(/\{[\s\S]*\}/);
  if (directJsonMatch) {
    return JSON.parse(directJsonMatch[0]);
  }

  throw new Error('No valid JSON found in response');
}

/**
 * ノード階層パスを抽出（ルートからターゲットまでのIDリスト）
 */
export function extractNodeHierarchyPath(
  data: FigmaNodeData,
  targetNodeId: string,
  currentPath: string[] = [],
  visited: Set<string> = new Set()
): string[] | null {
  // 循環参照チェック
  if (visited.has(data.id)) {
    return null;
  }

  // 訪問済みとしてマーク
  visited.add(data.id);

  const newPath = [...currentPath, data.id];

  // ターゲットノードが見つかった
  if (data.id === targetNodeId) {
    return newPath;
  }

  // 子要素を再帰的に探索
  if (data.children && data.children.length > 0) {
    for (const child of data.children) {
      const result = extractNodeHierarchyPath(child, targetNodeId, newPath, visited);
      if (result) {
        return result;
      }
    }
  }

  // このパスにはターゲットノードが見つからなかった
  return null;
}

/**
 * JSON形式の指示テンプレートを取得
 * 全エージェントで共通のJSON出力フォーマット
 */
export function getJsonSchemaTemplate(): string {
  return `必ず以下のJSON形式で結果を返してください:
\`\`\`json
{
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "message": "問題の説明（具体的なノード名を含める）",
      "nodeId": "該当ノードの実際のFigma ID（例: 1809:1836）。プロンプト内の (ID: xxx) 形式から必ず抽出してください",
      "autoFixable": true | false,
      "suggestion": "改善案（具体的な数値を含める）"
    }
  ],
  "positives": ["良い点の配列（任意）"]
}
\`\`\``;
}

/**
 * nodeId指定方法の詳細な説明を取得
 * Claude APIがFigma IDを正確に抽出するための指示
 */
export function getNodeIdInstructions(): string {
  return `**重要なnodeIdの指定方法:**
- nodeIdには必ずプロンプト内に記載されている実際のFigma IDをそのまま完全にコピーしてください
- 基本的なノード: 「【FRAME】 Header (ID: 1809:1838)」→ nodeIdは "1809:1838"
- インスタンスノード: 「【INSTANCE】 Button (ID: I1806:932;589:1207)」→ nodeIdは "I1806:932;589:1207"
- ネストされたインスタンス: 「【INSTANCE】 Icon (ID: I1806:984;1809:902;105:1169)」→ nodeIdは "I1806:984;1809:902;105:1169"
- プロンプトに記載されている通りの形式で、(ID: xxx) から完全にコピーしてください
- I接頭辞やセミコロンが含まれている場合もそのまま使用してください
- 独自の説明的な名前（"Header"、"Button (Primary)"など）は使用しないでください
- 該当ノードにIDが記載されている場合は必ず指定し、記載がない場合のみ省略してください`;
}

/**
 * システムプロンプトの共通末尾部分を構築
 * JSON形式指示 + nodeId指定方法 + 最終指示
 */
export function buildSystemPromptSuffix(): string {
  return `
${getJsonSchemaTemplate()}

${getNodeIdInstructions()}

重要: レスポンスは必ずJSON形式のみで返してください。説明文は含めないでください。`;
}

/**
 * ユーザープロンプトのnodeID注意書きを取得
 */
export function getNodeIdReminder(): string {
  return '- **重要**: 問題を指摘する際は、各ノードに記載されている (ID: xxx) 形式の実際のFigma ID（例: 1809:1836）をnodeIdフィールドに使用してください';
}

/**
 * テキストノードから文字色と親要素の背景色を取得
 */
function extractTextAndBackgroundColors(
  node: FigmaNodeData,
  parentBackgroundColor?: string
): { textColor?: string; backgroundColor?: string; hasExplicitNoFill?: boolean } {
  let textColor: string | undefined;
  let backgroundColor: string | undefined;
  let hasExplicitNoFill = false;

  // テキストノードの場合、文字色を取得
  if (node.type === 'TEXT' && node.fills && node.fills.length > 0) {
    const fill = node.fills[0];
    // opacityが0.1以下の場合は無視
    if (fill.type === 'SOLID' && fill.color && (fill.opacity === undefined || fill.opacity > 0.1)) {
      textColor = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
    }
  }

  // テキストノード以外の場合、背景色を取得
  if (node.type !== 'TEXT') {
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      // opacityが0.1以下の場合は無視
      if (
        fill.type === 'SOLID' &&
        fill.color &&
        (fill.opacity === undefined || fill.opacity > 0.1)
      ) {
        backgroundColor = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
      }
    } else if (Array.isArray(node.fills) && node.fills.length === 0) {
      // fills: [] の場合、明示的に背景色なしとマーク
      hasExplicitNoFill = true;
    }
  }

  // 背景色がなく、かつ明示的にfills: []でない場合のみ、親の背景色を使用
  if (!backgroundColor && !hasExplicitNoFill && parentBackgroundColor) {
    backgroundColor = parentBackgroundColor;
  }

  return { textColor, backgroundColor, hasExplicitNoFill };
}

/**
 * 兄弟要素から背景色を探す（テキストより前にある要素を優先）
 */
function findSiblingBackgroundColor(siblings: FigmaNodeData[]): string | undefined {
  // RECTANGLEやFRAMEなどの背景要素を探す
  for (const sibling of siblings) {
    if (sibling.type !== 'TEXT' && sibling.fills && sibling.fills.length > 0) {
      const fill = sibling.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        return rgbToHex(fill.color.r, fill.color.g, fill.color.b);
      }
    }
  }
  return undefined;
}

/**
 * ノードツリーからテキストと背景色のペアを再帰的に抽出
 * @param maxResults - 最大収集件数（デフォルト: 100）。この数に達したら処理を中断
 */
function collectTextColorPairs(
  node: FigmaNodeData,
  parentBackgroundColor?: string,
  parentNode?: FigmaNodeData,
  results: ColorContrastInfo[] = [],
  visited: Set<string> = new Set(),
  maxResults: number = 100
): ColorContrastInfo[] {
  // 最大件数に達したら早期終了
  if (results.length >= maxResults) {
    return results;
  }

  // 循環参照チェック
  if (visited.has(node.id)) {
    return results;
  }
  visited.add(node.id);

  const { textColor, backgroundColor, hasExplicitNoFill } = extractTextAndBackgroundColors(
    node,
    parentBackgroundColor
  );

  // テキストノードの場合
  if (node.type === 'TEXT' && textColor) {
    let finalBackgroundColor = backgroundColor;

    // 背景色がない場合、兄弟要素から探す
    if (!finalBackgroundColor && parentNode?.children) {
      finalBackgroundColor = findSiblingBackgroundColor(parentNode.children);
    }

    // それでもない場合は親の背景色を使用
    if (!finalBackgroundColor) {
      finalBackgroundColor = parentBackgroundColor;
    }

    // 背景色が見つかった場合のみコントラスト比を計算
    if (finalBackgroundColor && results.length < maxResults) {
      try {
        const contrastResult = calculateWCAGContrast({
          color1: textColor,
          color2: finalBackgroundColor,
        });

        results.push({
          textColor,
          backgroundColor: finalBackgroundColor,
          nodeName: node.name,
          nodeId: node.id,
          contrastRatio: contrastResult.contrast_ratio,
          wcagCompliance: contrastResult.wcag_compliance,
        });
      } catch (error) {
        console.error(`Failed to calculate contrast for node ${node.name}:`, error);
      }
    }
  }

  // 子要素を再帰的に処理（最大件数に達していない場合のみ）
  if (node.children && node.children.length > 0 && results.length < maxResults) {
    // 現在のノードの背景色を取得
    // fills: [] の場合（hasExplicitNoFill）は親の背景色を継承しない
    const currentBg = backgroundColor || (hasExplicitNoFill ? undefined : parentBackgroundColor);

    for (const child of node.children) {
      collectTextColorPairs(child, currentBg, node, results, visited, maxResults);
      // 最大件数に達したら処理を中断
      if (results.length >= maxResults) {
        break;
      }
    }
  }

  return results;
}

/**
 * カラーコントラスト比マップを生成
 * @param data - Figmaノードデータ
 * @param maxItems - 最大表示件数（デフォルト: 100）
 */
export function buildColorContrastMap(data: FigmaNodeData, maxItems: number = 100): string {
  const contrastInfos = collectTextColorPairs(data, undefined, undefined, [], new Set(), maxItems);

  if (contrastInfos.length === 0) {
    return 'テキスト要素が見つかりませんでした。';
  }

  const hasMore = contrastInfos.length >= maxItems;

  let output = '## カラーコントラスト比マップ\n\n';
  output += '以下は、各テキスト要素の文字色と背景色のコントラスト比を事前計算した結果です。\n';
  output += 'この情報を参照して、WCAG 2.2準拠の評価を行ってください。\n\n';

  if (hasMore) {
    output += `> **注意**: テキスト要素が${maxItems}件以上見つかったため、最初の${maxItems}件のみを表示しています。\n\n`;
  }

  contrastInfos.forEach((info, index) => {
    output += `### ${index + 1}. ${escapeForPrompt(info.nodeName)} (ID: ${info.nodeId})\n`;
    output += `- 文字色: ${info.textColor}\n`;
    output += `- 背景色: ${info.backgroundColor}\n`;
    output += `- **コントラスト比: ${info.contrastRatio}:1**\n`;
    output += `- WCAG AA準拠:\n`;
    output += `  - 通常テキスト (4.5:1以上): ${info.wcagCompliance.AA.normal_text ? '✅ 合格' : '❌ 不合格'}\n`;
    output += `  - 大きなテキスト (3.0:1以上): ${info.wcagCompliance.AA.large_text ? '✅ 合格' : '❌ 不合格'}\n`;
    output += `- WCAG AAA準拠:\n`;
    output += `  - 通常テキスト (7.0:1以上): ${info.wcagCompliance.AAA.normal_text ? '✅ 合格' : '❌ 不合格'}\n`;
    output += `  - 大きなテキスト (4.5:1以上): ${info.wcagCompliance.AAA.large_text ? '✅ 合格' : '❌ 不合格'}\n`;
    output += '\n';
  });

  if (hasMore) {
    output += `> さらに多くのテキスト要素が存在する可能性がありますが、パフォーマンスのため省略されています。\n`;
  }

  return output;
}

/**
 * テキストノード情報（言語判定付き）
 */
export interface TextNodeInfo {
  nodeId: string;
  nodeName: string;
  text: string;
  language: 'japanese' | 'english' | 'mixed';
  fontSize?: number;
  fontFamily?: string;
}

/**
 * ノードツリーから全テキストノードを抽出（言語判定・文字数制限付き）
 */
export function extractTextNodes(
  node: FigmaNodeData,
  results: TextNodeInfo[] = [],
  visited: Set<string> = new Set()
): TextNodeInfo[] {
  // 循環参照チェック
  if (visited.has(node.id)) {
    return results;
  }
  visited.add(node.id);

  // TEXTノードの場合
  if (node.type === 'TEXT' && node.characters) {
    const trimmed = node.characters.trim();

    // 空白のみ・空文字列は除外
    if (trimmed.length > 0) {
      // 1000文字に切り詰め
      const truncated = trimmed.length > 1000 ? trimmed.slice(0, 1000) : trimmed;

      results.push({
        nodeId: node.id,
        nodeName: node.name,
        text: truncated,
        language: detectLanguage(truncated),
        fontSize: node.fontSize,
        fontFamily: node.fontName?.family,
      });
    }
  }

  // 子要素を再帰的に処理
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      extractTextNodes(child, results, visited);
    });
  }

  return results;
}

/**
 * テキストの言語を判定
 * - ひらがな・カタカナ・漢字のいずれかが含まれる → 日本語
 * - ASCII only → 英語
 * - 両方含まれる → 混在
 */
export function detectLanguage(text: string): 'japanese' | 'english' | 'mixed' {
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);

  if (hasJapanese && hasEnglish) {
    return 'mixed';
  } else if (hasJapanese) {
    return 'japanese';
  } else if (hasEnglish) {
    return 'english';
  }

  // どちらでもない場合は日本語として扱う（記号のみなど）
  return 'japanese';
}
