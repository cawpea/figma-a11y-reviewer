import { BaseEvaluationAgent } from './base.agent';
import { FigmaNodeData } from '../../types';
import { formatFigmaDataForEvaluation } from '../../utils/prompt.utils';

export class DesignSystemAgent extends BaseEvaluationAgent {
  protected category = 'designSystem';
  
  protected systemPrompt = `あなたはデザインシステムとコンポーネント設計の専門家です。
Figmaデザインの一貫性、再利用性、保守性を評価してください。

評価基準:
1. Spacing値の一貫性
   - 8pxグリッドシステム準拠（8, 16, 24, 32, 40, 48...）
   - 不規則な値（例: 13px, 27px）は減点
2. レイアウト設計
   - Auto Layoutの適切な使用
   - Flexboxの理解（primaryAxis, counterAxis）
3. 命名規則
   - 分かりやすく一貫性のある命名
   - 階層構造の適切な表現
4. コンポーネント化
   - 適切な抽象化レベル
   - 再利用可能な設計

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
    
    return `以下のFigmaノードをデザインシステムの観点で評価してください:

${formattedData}

確認ポイント:
- padding値（paddingLeft, paddingRight, paddingTop, paddingBottom）が8pxグリッドに準拠しているか
- itemSpacingが8pxグリッドに準拠しているか
- Auto Layoutの適切な使用（layoutMode）
- 命名規則（nameフィールド）の妥当性
- サイズ（width, height）が適切か

不規則な値や非効率な設計があれば厳しく指摘してください。
JSON形式で評価結果を返してください。`;
  }
}