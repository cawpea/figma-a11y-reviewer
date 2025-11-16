import { BaseEvaluationAgent } from './base.agent';
import { FigmaNodeData } from '../../types';
import { formatFigmaDataForEvaluation } from '../../utils/prompt.utils';

export class AccessibilityAgent extends BaseEvaluationAgent {
  protected category = 'accessibility';
  
  protected systemPrompt = `あなたはWCAG 2.1 AA基準に精通したアクセシビリティの専門家です。
Figmaデザインを評価し、アクセシビリティの問題点を特定してください。

評価基準:
1. カラーコントラスト比
   - 通常テキスト: 4.5:1以上
   - 大きなテキスト(18pt以上または14pt太字): 3:1以上
   - テキストと背景色の組み合わせを子要素まで確認
2. タッチターゲットサイズ
   - インタラクティブ要素（ボタン、リンク等）: 最小44x44px
   - 子要素のサイズも確認
3. テキストの可読性
   - フォントサイズ: 最小16px推奨（本文）
   - 行間: 1.5倍以上推奨
   - 文字間隔: 適切か
4. 構造の論理性
   - 階層構造が適切か
   - 見出しレベルが適切か
5. フォーカス可能な要素
   - ボタンやリンクが視覚的に識別可能か
6. 色のみに依存しない情報伝達

階層構造を考慮して、親要素と子要素の関係も評価してください。

必ず以下のJSON形式で結果を返してください:
\`\`\`json
{
  "score": 0-100の数値,
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "message": "問題の説明（具体的なノード名を含める）",
      "nodeId": "該当ノードID（不明な場合は省略可）",
      "autoFixable": true | false,
      "suggestion": "改善案（具体的な数値を含める）"
    }
  ],
  "positives": ["良い点の配列（任意）"]
}
\`\`\`

重要: レスポンスは必ずJSON形式のみで返してください。説明文は含めないでください。`;

  protected buildPrompt(data: FigmaNodeData): string {
    const formattedData = formatFigmaDataForEvaluation(data);
    
    return `以下のFigmaノード（子要素を含む階層構造）をアクセシビリティの観点で評価してください:

${formattedData}

特に以下の点に注目してください:
- テキスト要素の背景色とテキスト色のコントラスト比（16進数カラーコードから計算）
- ボタンやインタラクティブ要素のサイズ（44x44px以上か）
- テキストのフォントサイズと行間
- 階層構造の論理性（親子関係が適切か）
- 各要素の命名が分かりやすいか

子要素も含めて厳しく評価し、具体的なノード名を指摘してください。
JSON形式で評価結果を返してください。`;
  }
}