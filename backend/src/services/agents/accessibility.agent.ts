import { FigmaNodeData } from '../../types';
import {
  buildColorContrastMap,
  buildSystemPromptSuffix,
  formatFigmaDataForEvaluation,
  getNodeIdReminder,
} from '../../utils/prompt.utils';

import { BaseEvaluationAgent } from './base.agent';

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
${buildSystemPromptSuffix()}`;

  protected buildPrompt(data: FigmaNodeData): string {
    const formattedData = formatFigmaDataForEvaluation(data);
    const contrastMap = buildColorContrastMap(data);

    return `以下のFigmaノード（子要素を含む階層構造）をアクセシビリティの観点で評価してください:

${formattedData}

---

${contrastMap}

---

特に以下の点に注目してください:
- **上記のカラーコントラスト比マップを参照して**、各テキスト要素のコントラスト比がWCAG 2.1 AA基準を満たしているか評価してください
  - 通常テキスト: 4.5:1以上
  - 大きなテキスト(18pt以上または14pt太字): 3:1以上
  - コントラスト比はすでに計算済みなので、マップの値を使用してください
- ボタンやインタラクティブ要素のサイズ（44x44px以上か）
- テキストのフォントサイズと行間
- 階層構造の論理性（親子関係が適切か）
- 各要素の命名が分かりやすいか
${getNodeIdReminder()}

子要素も含めて厳しく評価し、具体的なノード名とFigma IDを指摘してください。
JSON形式で評価結果を返してください。`;
  }
}
