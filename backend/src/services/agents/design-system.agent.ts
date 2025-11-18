import { FigmaNodeData } from '../../types';
import {
  formatFigmaDataForEvaluation,
  buildSystemPromptSuffix,
  getNodeIdReminder,
} from '../../utils/prompt.utils';

import { BaseEvaluationAgent } from './base.agent';

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
${buildSystemPromptSuffix()}`;

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
${getNodeIdReminder()}

子要素も含めて厳しく評価し、具体的なノード名、不適切な値、Figma IDを指摘してください。
JSON形式で評価結果を返してください。`;
  }
}
