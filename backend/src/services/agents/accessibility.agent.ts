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
      "nodeId": "該当ノードの実際のFigma ID（例: 1809:1836）。プロンプト内の (ID: xxx) 形式から必ず抽出してください",
      "autoFixable": true | false,
      "suggestion": "改善案（具体的な数値を含める）"
    }
  ],
  "positives": ["良い点の配列（任意）"]
}
\`\`\`

**重要なnodeIdの指定方法:**
- nodeIdには必ずプロンプト内に記載されている実際のFigma IDを使用してください
- 例: 「【FRAME】 Header (ID: 1809:1838)」の場合、nodeIdは "1809:1838" です
- 「数字:数字」の形式（例: "1809:1838", "123:456"）で指定してください
- 独自の説明的な名前（"Header"、"Button (Primary)"など）は使用しないでください
- 該当ノードにIDが記載されている場合は必ず指定し、記載がない場合のみ省略してください

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
- **重要**: 問題を指摘する際は、各ノードに記載されている (ID: xxx) 形式の実際のFigma ID（例: 1809:1836）をnodeIdフィールドに使用してください

子要素も含めて厳しく評価し、具体的なノード名とFigma IDを指摘してください。
JSON形式で評価結果を返してください。`;
  }
}