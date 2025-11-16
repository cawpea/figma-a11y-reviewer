import { FigmaNodeData } from '../types';

/**
 * Figmaデータを評価用に整形
 */
export function formatFigmaDataForEvaluation(data: FigmaNodeData): string {
  const formatted = {
    基本情報: {
      名前: data.name,
      タイプ: data.type,
      子要素数: data.children?.length || 0,
    },
    レイアウト: data.layoutMode ? {
      モード: data.layoutMode,
      primaryAxisSizingMode: data.primaryAxisSizingMode,
      counterAxisSizingMode: data.counterAxisSizingMode,
      padding: {
        left: data.paddingLeft,
        right: data.paddingRight,
        top: data.paddingTop,
        bottom: data.paddingBottom,
      },
      itemSpacing: data.itemSpacing,
    } : undefined,
    サイズ: data.absoluteBoundingBox ? {
      幅: data.absoluteBoundingBox.width,
      高さ: data.absoluteBoundingBox.height,
    } : undefined,
    スタイル: {
      fills: data.fills?.length || 0,
      strokes: data.strokes?.length || 0,
    },
    テキスト: data.textStyle,
  };

  return JSON.stringify(formatted, null, 2);
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