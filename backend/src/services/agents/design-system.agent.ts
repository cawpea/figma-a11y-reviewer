import { BaseEvaluationAgent } from './base.agent';
import { FigmaNodeData } from '../../types';
import { formatFigmaDataForEvaluation } from '../../utils/prompt.utils';

export class DesignSystemAgent extends BaseEvaluationAgent {
  protected category = 'designSystem';
  
  protected systemPrompt = `あなたはデザインシステムとコンポーネント設計の専門家です。
Figmaデザインの一貫性、再利用性、保守性を評価してください。

評価基準:
1. Spacing値の一貫性（8pxグリッドシステム）
   - padding値: 8, 16, 24, 32, 40, 48... のいずれか
   - itemSpacing値: 同上
   - 不規則な値（例: 13px, 27px, 10px）は厳しく減点
   - 子要素のspacing値も全て確認
2. カラーパレットの統一性
   - 使用されている色が適切か
   - 背景色とテキスト色の組み合わせ
3. タイポグラフィスケール
   - フォントサイズの体系性（12, 14, 16, 20, 24, 32...）
   - フォントファミリーの一貫性
4. レイアウト設計
   - Auto Layoutの適切な使用
   - primaryAxis/counterAxisの理解
5. 命名規則
   - 分かりやすく一貫性のある命名
   - 階層構造を反映した命名
6. コンポーネント化
   - 適切な抽象化レベル
   - 再利用可能な設計

階層構造全体を見て、一貫性を評価してください。

必ず以下のJSON形式で結果を返してください:
\`\`\`json
{
  "score": 0-100の数値,
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "message": "問題の説明（具体的なノード名と値を含める）",
      "nodeId": "該当ノードの実際のFigma ID（例: 1809:1836）。プロンプト内の (ID: xxx) 形式から必ず抽出してください",
      "autoFixable": true | false,
      "suggestion": "改善案（具体的な数値を含める）"
    }
  ],
  "positives": ["良い点の配列（任意）"]
}
\`\`\`

**重要なnodeIdの指定方法:**
- nodeIdには必ずプロンプト内に記載されている実際のFigma IDをそのまま完全にコピーしてください
- 基本的なノード: 「【FRAME】 Header (ID: 1809:1838)」→ nodeIdは "1809:1838"
- インスタンスノード: 「【INSTANCE】 Button (ID: I1806:932;589:1207)」→ nodeIdは "I1806:932;589:1207"
- ネストされたインスタンス: 「【INSTANCE】 Icon (ID: I1806:984;1809:902;105:1169)」→ nodeIdは "I1806:984;1809:902;105:1169"
- プロンプトに記載されている通りの形式で、(ID: xxx) から完全にコピーしてください
- I接頭辞やセミコロンが含まれている場合もそのまま使用してください
- 独自の説明的な名前（"Header"、"Button (Primary)"など）は使用しないでください
- 該当ノードにIDが記載されている場合は必ず指定し、記載がない場合のみ省略してください

重要: レスポンスは必ずJSON形式のみで返してください。説明文は含めないでください。`;

  protected buildPrompt(data: FigmaNodeData): string {
    const formattedData = formatFigmaDataForEvaluation(data);

    return `以下のFigmaノード（子要素を含む階層構造）をデザインシステムの観点で評価してください:

${formattedData}

確認ポイント:
- 全てのpadding値が8pxグリッドに準拠しているか（8, 16, 24, 32...）
- 全てのitemSpacing値が8pxグリッドに準拠しているか
- 不規則な値（10px, 13px, 20px等）があれば厳しく指摘
- フォントサイズが体系的か
- カラーパレットの使用が適切か
- Auto Layoutの使用が適切か
- 命名規則が一貫しているか
- **重要**: 問題を指摘する際は、各ノードに記載されている (ID: xxx) 形式の実際のFigma ID（例: 1809:1836）をnodeIdフィールドに使用してください

子要素も含めて厳しく評価し、具体的なノード名、不適切な値、Figma IDを指摘してください。
JSON形式で評価結果を返してください。`;
  }
}