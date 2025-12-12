import { CategoryResult, FigmaNodeData, FigmaStylesData } from '@shared/types';

import { calculateWCAGContrast, rgbToHex } from './accessibility';
import { log } from './debug';

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
      "message": "問題の説明（具体的なノード名を含める）。Figma ID（例: 1809:1836）は含めないでください。",
      "nodeId": "単一ノードの場合の実際のFigma ID（例: 1809:1836）。プロンプト内の (ID: xxx) 形式から必ず抽出してください",
      "nodeIds": ["複数ノードに同じ問題がある場合のFigma ID配列（例: [\\"1809:1836\\", \\"1809:1838\\", \\"1809:1840\\"]）。カラーコントラストマップでグループ化されている場合はこちらを使用してください"],
      "autoFixable": true | false,
      "suggestion": "改善案（具体的な数値を含める）。Figma ID（例: 1809:1836）は含めないでください。"
    }
  ],
  "positives": ["良い点の配列（任意）"]
}
\`\`\`

**重要**:
- 単一ノードの問題の場合: nodeIdフィールドを使用
- 複数ノードに同じ問題がある場合（特にカラーコントラストマップでグループ化されている場合）: nodeIdsフィールドに配列として全てのFigma IDを含めてください
- nodeIdsとnodeIdの両方を指定した場合、nodeIdsが優先されます`;
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
- 該当ノードにIDが記載されている場合は必ず指定し、記載がない場合のみ省略してください

**複数ノードのグループ化指定方法:**
- カラーコントラストマップで同じ色の組み合わせが複数のノードに適用されている場合、それらは1つの問題として報告してください
- グループ内の全てのノードIDをnodeIds配列に含めてください（例: "nodeIds": ["1809:1836", "1809:1838", "1809:1840"]）
- 単一ノードの問題はnodeIdフィールド、複数ノードの問題はnodeIdsフィールドを使用してください`;
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
 * 背景要素がテキスト要素を完全に包含しているか判定
 * @param textBox - テキスト要素のバウンディングボックス
 * @param backgroundBox - 背景要素のバウンディングボックス
 * @returns 完全に包含している場合はtrue
 */
function isFullyContainedBy(
  textBox: { x: number; y: number; width: number; height: number },
  backgroundBox: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    backgroundBox.x <= textBox.x &&
    backgroundBox.y <= textBox.y &&
    backgroundBox.x + backgroundBox.width >= textBox.x + textBox.width &&
    backgroundBox.y + backgroundBox.height >= textBox.y + textBox.height
  );
}

/**
 * ツリーを探索して、指定ノードの親ノードを見つける
 * @param root ルートノード
 * @param targetNode 検索対象ノード
 * @returns 親ノード、見つからない場合はundefined
 */
function findParentNode(root: FigmaNodeData, targetNode: FigmaNodeData): FigmaNodeData | undefined {
  if (root.children) {
    for (const child of root.children) {
      if (child.id === targetNode.id) {
        return root;
      }

      const parent = findParentNode(child, targetNode);
      if (parent) {
        return parent;
      }
    }
  }

  return undefined;
}

/**
 * ノード自体の背景色を抽出する
 * @param node チェック対象ノード
 * @returns 背景色、見つからない場合はundefined
 */
function extractBackgroundColor(node: FigmaNodeData): string | undefined {
  // TEXTノードの場合はスキップ（テキスト色として扱われるため）
  if (node.type === 'TEXT') {
    return undefined;
  }

  if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const solidFill = node.fills.find(
      (
        fill
      ): fill is { type: 'SOLID'; color: { r: number; g: number; b: number }; opacity?: number } =>
        fill.type === 'SOLID' && fill.color !== undefined
    );

    if (solidFill) {
      const opacity = solidFill.opacity ?? 1;
      if (opacity > 0) {
        const { r, g, b } = solidFill.color;
        return rgbToHex(r, g, b);
      }
    }
  }

  return undefined;
}

/**
 * ノードがルートノードかどうかを判定
 * @param node チェック対象ノード
 * @param root ルートノード
 * @returns ルートノードの場合true
 */
function isRootNode(node: FigmaNodeData, root: FigmaNodeData): boolean {
  return node.id === root.id;
}

/**
 * 階層的に背景色を検索する
 * 各階層で以下の順序で検索:
 * 1. 兄弟要素から検索
 * 2. 親要素自体の背景色を確認
 * 3. 祖父母要素の兄弟要素から検索
 * 4. 祖父母要素自体の背景色を確認
 * 5. 同様に親を辿る（再帰的）
 * 6. ルート要素の背景色を使用
 *
 * @param rootNode ツリーのルートノード
 * @param textNode テキストノード
 * @param currentParent 現在の親ノード
 * @param depth 現在の深度（循環参照防止用）
 * @param visited 訪問済みノードID（循環参照防止用）
 * @returns 背景色、見つからない場合はundefined
 */
function findBackgroundColorWithHierarchy(
  rootNode: FigmaNodeData,
  textNode: FigmaNodeData,
  currentParent: FigmaNodeData | undefined,
  depth: number = 0,
  visited: Set<string> = new Set()
): string | undefined {
  // 安全対策: 最大深度チェック
  if (depth > 20) {
    log(
      'warn',
      `Max depth reached for: ${textNode.name}, Depth: ${depth}`,
      '[Hierarchical Search]'
    );
    return undefined;
  }

  // 親ノードが存在しない場合は終了
  if (!currentParent) {
    log('debug', 'No parent found, ending search', '[Hierarchical Search]');
    return undefined;
  }

  // 安全対策: 循環参照チェック
  if (visited.has(currentParent.id)) {
    log(
      'warn',
      `Circular reference detected: Node: ${currentParent.name} (ID: ${currentParent.id})`,
      '[Hierarchical Search]'
    );
    return undefined;
  }

  visited.add(currentParent.id);

  log(
    'debug',
    `Level ${depth}: Searching for: ${textNode.name}, Current parent: ${currentParent.name} (ID: ${currentParent.id})`,
    '[Hierarchical Search]'
  );

  // [Step 1] 兄弟要素から検索
  if (currentParent.children) {
    log(
      'debug',
      `Step 1 (Level ${depth}): Searching siblings, Siblings count: ${currentParent.children.length}`,
      '[Hierarchical Search]'
    );

    const siblingBackground = findSiblingBackgroundColor(currentParent.children, textNode);

    if (siblingBackground) {
      log(
        'info',
        `✓ Found sibling background at depth ${depth}: Background: ${siblingBackground}, Parent: ${currentParent.name}`,
        '[Hierarchical Search]'
      );
      return siblingBackground;
    }
  }

  // [Step 2] 親要素自体の背景色を確認
  log(
    'debug',
    `Step 2 (Level ${depth}): Checking parent's own background`,
    '[Hierarchical Search]'
  );

  const parentBackground = extractBackgroundColor(currentParent);

  if (parentBackground) {
    log(
      'info',
      `✓ Found parent's own background at depth ${depth}: Background: ${parentBackground}, Parent: ${currentParent.name}`,
      '[Hierarchical Search]'
    );
    return parentBackground;
  }

  // [Step 3] ルートノードに到達した場合は終了
  if (isRootNode(currentParent, rootNode)) {
    log('debug', 'Reached root, no background found', '[Hierarchical Search]');
    return undefined;
  }

  // [Step 4] 祖父母ノードを取得
  const grandparent = findParentNode(rootNode, currentParent);

  if (!grandparent) {
    log('debug', `No grandparent found for: ${currentParent.name}`, '[Hierarchical Search]');
    return undefined;
  }

  // [Step 5] 再帰的に上位階層へ
  log(
    'debug',
    `Moving up to level ${depth + 1}: Grandparent: ${grandparent.name} (ID: ${grandparent.id})`,
    '[Hierarchical Search]'
  );

  return findBackgroundColorWithHierarchy(rootNode, textNode, grandparent, depth + 1, visited);
}

/**
 * 兄弟要素から背景色を探す（座標ベースの完全包含検出 + サイズフィルタリング）
 * Z-orderを考慮して最も手前（topmost）の背景を優先的に検出します。
 * @param siblings - 兄弟要素の配列（前から順にz-order後ろ→前）
 * @param referenceNode - 参照テキストノード（サイズ・座標比較用）
 * @returns 検出された背景色（hex形式）、見つからない場合はundefined
 */
function findSiblingBackgroundColor(
  siblings: FigmaNodeData[],
  referenceNode?: FigmaNodeData,
): string | undefined {
  // 座標ベースの検出を試みる（テキストノードに座標情報がある場合）
  if (referenceNode?.absoluteBoundingBox) {
    const textBox = referenceNode.absoluteBoundingBox;

    log(
      'debug',
      `Text box: x=${textBox.x}, y=${textBox.y}, w=${textBox.width}, h=${textBox.height}`,
      '[Sibling Search]'
    );

    // Z-orderを考慮して逆順で探索（最も手前から）
    for (let i = siblings.length - 1; i >= 0; i--) {
      const sibling = siblings[i];

      // スキップ条件のデバッグログ
      if (sibling.type === 'TEXT') {
        log('debug', `Skip TEXT: ${sibling.name}`, '[Sibling Search]');
        continue;
      }
      if (!sibling.fills || sibling.fills.length === 0) {
        log('debug', `Skip no fills: ${sibling.name}`, '[Sibling Search]');
        continue;
      }

      const fill = sibling.fills[0];
      if (fill.type !== 'SOLID' || !fill.color) {
        log('debug', `Skip non-SOLID fill: ${sibling.name}`, '[Sibling Search]');
        continue;
      }
      if (fill.opacity !== undefined && fill.opacity <= 0.1) {
        log('debug', `Skip low opacity: ${sibling.name}`, '[Sibling Search]');
        continue;
      }

      // サイズフィルタリング
      if (!sibling.absoluteBoundingBox) {
        log('debug', `Skip no boundingBox: ${sibling.name}`, '[Sibling Search]');
        continue;
      }

      const siblingBox = sibling.absoluteBoundingBox;
      const siblingWidth = siblingBox.width;
      const siblingHeight = siblingBox.height;

      log(
        'debug',
        `Checking: ${sibling.name} (${sibling.type}), x=${siblingBox.x}, y=${siblingBox.y}, w=${siblingWidth}, h=${siblingHeight}`,
        '[Sibling Search]'
      );

      // 幅または高さが10px以下の要素は装飾要素としてスキップ
      if (siblingWidth <= 10 || siblingHeight <= 10) {
        log('debug', `Skip too small: ${sibling.name}`, '[Sibling Search]');
        continue;
      }

      const textArea = textBox.width * textBox.height;
      const siblingArea = siblingWidth * siblingHeight;

      // 兄弟要素の面積がテキストの10%未満の場合はスキップ
      if (siblingArea < textArea * 0.1) {
        log(
          'debug',
          `Skip too small area: ${sibling.name}, siblingArea=${siblingArea}, textArea=${textArea}, ratio=${siblingArea / textArea}`,
          '[Sibling Search]'
        );
        continue;
      }

      // 完全包含チェック
      const isContained = isFullyContainedBy(textBox, siblingBox);
      log(
        'debug',
        `Containment check: ${sibling.name}, isContained=${isContained}`,
        '[Sibling Search]'
      );

      if (isContained) {
        const bgColor = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
        log('info', `✓ Found background: ${sibling.name}, color=${bgColor}`, '[Sibling Search]');
        return bgColor;
      }
    }

    // 座標情報がある場合、完全包含する背景が見つからなければ
    // 親要素の背景色にフォールバック（undefinedを返す）
    log('warn', 'No matching sibling found, returning undefined', '[Sibling Search]');
    return undefined;
  }

  // フォールバック：座標情報がない場合のみサイズでフィルタリング（後方互換性維持）
  for (const sibling of siblings) {
    if (sibling.type !== 'TEXT' && sibling.fills && sibling.fills.length > 0) {
      const fill = sibling.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        if (fill.opacity !== undefined && fill.opacity <= 0.1) continue;

        const siblingWidth = sibling.absoluteBoundingBox?.width ?? 0;
        const siblingHeight = sibling.absoluteBoundingBox?.height ?? 0;

        // 幅または高さが10px以下の要素は装飾要素としてスキップ
        if (siblingWidth <= 10 || siblingHeight <= 10) continue;

        // 参照テキストノードと比較して面積が小さすぎる場合はスキップ
        if (referenceNode?.absoluteBoundingBox) {
          const textArea =
            referenceNode.absoluteBoundingBox.width * referenceNode.absoluteBoundingBox.height;
          const siblingArea = siblingWidth * siblingHeight;

          // 兄弟要素の面積がテキストの10%未満の場合はスキップ
          if (siblingArea < textArea * 0.1) continue;
        }

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
  rootNode: FigmaNodeData,
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
    let finalBackgroundColor: string | undefined;

    // TEXTノードの場合、階層的に背景色を探す
    log(
      'debug',
      `Starting hierarchical search for: ${node.name} (ID: ${node.id})`,
      '[Background Detection]'
    );

    // [Step 1] 階層的検索を実行
    finalBackgroundColor = findBackgroundColorWithHierarchy(rootNode, node, parentNode);

    if (finalBackgroundColor) {
      log(
        'info',
        `✓ Found via hierarchical search: ${finalBackgroundColor}`,
        '[Background Detection]'
      );
    } else {
      log(
        'warn',
        `Hierarchical search failed for: ${node.name}, No background color found in hierarchy`,
        '[Background Detection]'
      );
    }

    // 【新規】異常値検出: 文字色と背景色が同一
    if (finalBackgroundColor && textColor === finalBackgroundColor) {
      log(
        'warn',
        `TEXT node has identical text and background color: Node: ${node.name} (ID: ${node.id}), Color: ${textColor}`,
        '[Contrast Anomaly]'
      );

      // デバッグモード時の詳細ログ
      log('debug', 'Node data:', '[Contrast Anomaly]', {
        name: node.name,
        id: node.id,
        type: node.type,
        fills: node.fills,
        parentNode: parentNode?.name,
        parentBackground: parentBackgroundColor,
        siblings: parentNode?.children?.map((c) => ({
          name: c.name,
          type: c.type,
          fills: c.fills,
        })),
      });

      // 対策: 親要素の背景色を再確認
      if (parentBackgroundColor && parentBackgroundColor !== textColor) {
        finalBackgroundColor = parentBackgroundColor;
        log('info', `Using parent background: ${parentBackgroundColor}`, '[Contrast Anomaly]');
      }
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
        log('error', `Failed to calculate contrast for node ${node.name}:`, undefined, error);
      }
    }
  }

  // 子要素を再帰的に処理（最大件数に達していない場合のみ）
  if (node.children && node.children.length > 0 && results.length < maxResults) {
    // 現在のノードの背景色を取得
    // fills: [] の場合（hasExplicitNoFill）は親の背景色を継承しない
    const currentBg = backgroundColor || (hasExplicitNoFill ? undefined : parentBackgroundColor);

    for (const child of node.children) {
      collectTextColorPairs(child, rootNode, currentBg, node, results, visited, maxResults);
      // 最大件数に達したら処理を中断
      if (results.length >= maxResults) {
        break;
      }
    }
  }

  return results;
}

/**
 * 同じ色の組み合わせでテキストノードをグループ化
 * @param contrastInfos - コントラスト情報の配列
 * @returns グループ化されたマップ（キー: "textColor|backgroundColor", 値: ColorContrastInfo[]）
 */
function groupByColorCombination(
  contrastInfos: ColorContrastInfo[]
): Map<string, ColorContrastInfo[]> {
  const groups = new Map<string, ColorContrastInfo[]>();

  for (const info of contrastInfos) {
    const key = `${info.textColor}|${info.backgroundColor}`;
    const existing = groups.get(key);

    if (existing) {
      existing.push(info);
    } else {
      groups.set(key, [info]);
    }
  }

  return groups;
}

/**
 * カラーコントラスト比マップを生成（色の組み合わせでグループ化）
 * @param data - Figmaノードデータ
 * @param maxItems - 最大表示件数（デフォルト: 100）
 */
export function buildColorContrastMap(data: FigmaNodeData, maxItems: number = 100): string {
  const contrastInfos = collectTextColorPairs(
    data,
    data,
    undefined,
    undefined,
    [],
    new Set(),
    maxItems
  );

  if (contrastInfos.length === 0) {
    return 'テキスト要素が見つかりませんでした。';
  }

  // 色の組み合わせでグループ化
  const groupedByColor = groupByColorCombination(contrastInfos);

  const hasMore = contrastInfos.length >= maxItems;

  let output = '## カラーコントラスト比マップ（色の組み合わせ別）\n\n';
  output +=
    '以下は、各テキスト要素の文字色と背景色のコントラスト比を色の組み合わせごとにグループ化した結果です。\n';
  output += 'この情報を参照して、WCAG 2.2準拠の評価を行ってください。\n';
  output +=
    '**同じ色の組み合わせが複数のノードで使用されている場合、それらは1つの問題として扱ってください。**\n\n';

  if (hasMore) {
    output += `> **注意**: テキスト要素が${maxItems}件以上見つかったため、最初の${maxItems}件のみを表示しています。\n\n`;
  }

  let groupIndex = 1;
  for (const [_colorKey, infos] of groupedByColor) {
    const firstInfo = infos[0];
    const nodeCount = infos.length;

    // グループヘッダー
    output += `### グループ ${groupIndex}: ${firstInfo.textColor} / ${firstInfo.backgroundColor}`;
    if (nodeCount > 1) {
      output += ` (${nodeCount}個のノードに適用)`;
    }
    output += '\n';

    // コントラスト情報（グループで共通）
    output += `- 文字色: ${firstInfo.textColor}\n`;
    output += `- 背景色: ${firstInfo.backgroundColor}\n`;
    output += `- **コントラスト比: ${firstInfo.contrastRatio}:1**\n`;
    output += `- WCAG AA準拠:\n`;
    output += `  - 通常テキスト (4.5:1以上): ${firstInfo.wcagCompliance.AA.normal_text ? '✅ 合格' : '❌ 不合格'}\n`;
    output += `  - 大きなテキスト (3.0:1以上): ${firstInfo.wcagCompliance.AA.large_text ? '✅ 合格' : '❌ 不合格'}\n`;
    output += `- WCAG AAA準拠:\n`;
    output += `  - 通常テキスト (7.0:1以上): ${firstInfo.wcagCompliance.AAA.normal_text ? '✅ 合格' : '❌ 不合格'}\n`;
    output += `  - 大きなテキスト (4.5:1以上): ${firstInfo.wcagCompliance.AAA.large_text ? '✅ 合格' : '❌ 不合格'}\n`;

    // 影響を受けるノードのリスト
    output += `- **影響を受けるノード** (${nodeCount}個):\n`;
    infos.forEach((info, idx) => {
      output += `  ${idx + 1}. ${escapeForPrompt(info.nodeName)} (ID: ${info.nodeId})\n`;
    });
    output += '\n';

    groupIndex++;
  }

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
