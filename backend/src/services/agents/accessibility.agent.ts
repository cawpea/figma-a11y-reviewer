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
   -大きなテキスト(18pt以上または14pt太字): 3:1以上
2. タッチターゲットサイズ
   - 最小44x44px（WHCAGモバイル基準）
3. テキストの可読性
   - フォントサイズ（最小16px推奨）
   - 行間（1.5倍以上推奨）
4. フォーカス可能な要素の視認性
5. 色のみに依存しない情報伝達

必ず以下のJSON形式で結果を返してください:
\`\`\`json
{
  "score": 0-100の数値,
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "message": "問題の説明（日本語で具体的に）",
      "nodeId": "該当ノードID（不明な場合は省略可）",
      "autoFixable": true | false,
      "suggestion": "改善案（日本語で具体的に）"
    }
  ],
  "positives": ["良い点の配列（任意）"]
}
\`\`\`

重要: レスポンスは必ずJSON形式のみで返してください。説明文は含めないでください。`;

  protected buildPrompt(data: FigmaNodeData): string {
    const formattedData = formatFigmaDataForEvaluation(data);
    
    return `以下のFigmaノードをアクセシビリティの観点で評価してください:

${formattedData}

特に以下の点に注目してください:
- テキスト要素がある場合、フォントサイズと背景色からコントラスト比を推定
- インタラクティブ要素（ボタン等）がある場合、サイズが十分か
- レイアウトが論理的な構造になっているか
- Auto Layoutの使用状況

厳しく評価し、改善の余地がある点は全て指摘してください。
JSON形式で評価結果を返してください。`;
  }
}