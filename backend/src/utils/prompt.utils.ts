import { FigmaNodeData } from '../types';

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
  node: any,
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
    output += `${indent}[循環参照を検出: ${node.name} (ID: ${node.id})]\n`;
    return output;
  }

  // 訪問済みとしてマーク
  visited.add(node.id);

  // ノード基本情報
  output += `${indent}【${node.type}】 ${node.name} (ID: ${node.id})\n`;

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
    node.fills.forEach((fill: any, index: number) => {
      if (fill.type === 'SOLID' && fill.color) {
        const color = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
        output += `${indent}  背景色 ${index + 1}: ${color} (opacity: ${fill.opacity})\n`;
      }
    });
  }

  // ストローク（ボーダー）
  if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
    node.strokes.forEach((stroke: any, index: number) => {
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
    output += `${indent}  テキスト: "${node.characters}"\n`;
    output += `${indent}  フォント: ${node.fontName?.family} ${node.fontName?.style}\n`;
    output += `${indent}  フォントサイズ: ${node.fontSize}px\n`;

    if (node.lineHeight) {
      if (node.lineHeight.unit === 'PIXELS') {
        output += `${indent}  行間: ${node.lineHeight.value}px\n`;
      } else if (node.lineHeight.unit === 'PERCENT') {
        output += `${indent}  行間: ${node.lineHeight.value}%\n`;
      }
    }

    output += `${indent}  配置: ${node.textAlignHorizontal} / ${node.textAlignVertical}\n`;
  }

  // エフェクト
  if (node.effects && node.effects.length > 0) {
    output += `${indent}  エフェクト: ${node.effects.map((e: any) => e.type).join(', ')}\n`;
  }

  // 透明度
  if (node.opacity !== undefined && node.opacity < 1) {
    output += `${indent}  透明度: ${Math.round(node.opacity * 100)}%\n`;
  }

  // コンポーネント情報
  if (node.mainComponent) {
    output += `${indent}  コンポーネント: ${node.mainComponent.name}\n`;
  }

  // 子要素を再帰的に処理
  if (node.children && node.children.length > 0) {
    output += `${indent}  子要素数: ${node.children.length}\n`;
    node.children.forEach((child: any) => {
      output += formatNodeRecursive(child, depth + 1, visited, maxDepth);
    });
  }

  return output;
}

/**
 * RGBを16進数カラーコードに変換
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * JSONレスポンスから評価結果を抽出
 */
export function extractJsonFromResponse(text: string): any {
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
  "score": 0-100の数値,
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
