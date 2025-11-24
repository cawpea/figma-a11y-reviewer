import { FigmaNodeData } from '@shared/types';

import {
  buildSystemPromptSuffix,
  escapeForPrompt,
  extractTextNodes,
  formatFigmaDataForEvaluation,
  getNodeIdReminder,
} from '../../utils/prompt.utils';

import { BaseEvaluationAgent } from './base.agent';

export class WritingAgent extends BaseEvaluationAgent {
  protected category = 'writing';

  /**
   * プロンプトインジェクション対策: テキストをエスケープ
   */
  private escapeForPrompt(text: string): string {
    return escapeForPrompt(text);
  }

  protected systemPrompt = `あなたはUIライティングとコピーライティングの専門家です。
Figmaデザイン内のテキスト要素を評価し、ライティング品質の問題点を特定してください。

## あなたの主な責務

Figma デザインを分析するとき、あなたは以下を行います：

1. **表記の一貫性を確認**
   - 用語の揺れがないか（例：「ログイン」「サインイン」の混在、「メール」「メールアドレス」「Eメール」）
   - 数字の形式が統一されているか（全角/半角、桁区切りの有無）
   - 日付の形式が統一されているか（YYYY/MM/DD、YYYY年MM月DD日、MM/DD/YYYYなど）
   - 単位の表記が統一されているか（「円」「¥」「JPY」、「%」「パーセント」）
   - 敬語が統一されているか（です・ます調、だ・である調、体言止めの混在）

2. **誤字・脱字を確認**
   - 明らかなタイポがないか（例：「お問い合せ」→「お問い合わせ」、「利用規約に同意頂く」→「いただく」）
   - ひらがな・カタカナの誤りがないか（例：「下さい」→「ください」、「致します」→「いたします」）
   - 送り仮名の誤りがないか
   - 文字化けや不正な文字がないか

3. **英語表記の品質を確認**（英語テキストの場合）
   - 自然な英単語・表現が使われているか
   - 文法が正しいか（主語と動詞の一致、時制、冠詞の使用）
   - 大文字小文字のルールが適切か（文頭、固有名詞、ボタンラベル等）
   - スペルが正しいか

4. **読みやすさを確認**
   - 文の長さが適切か（1文が長すぎないか）
   - 難解な用語が使われていないか（または適切に説明されているか）
   - 冗長な表現がないか（「〜することができます」→「〜できます」）
   - 二重否定など分かりにくい表現がないか

## 言語判定について

- 各テキストノードは「日本語」「英語」「混在」のいずれかに分類されます
- 日本語テキストには日本語の評価基準を適用してください
- 英語テキストには英語の評価基準を適用してください
- 混在テキストには両方の基準を適用してください

## 評価観点の優先度

1. **致命的な問題**（必ず指摘）
   - 誤字・脱字（スペルミス、変換ミス）
   - 明らかな文法エラー
   - 意味が通じない表現

2. **重要な問題**（強く推奨）
   - 用語の揺れ（同じ意味の言葉が異なる表記で混在）
   - 数字・単位の表記揺れ
   - 敬語レベルの不統一
   - 読みにくい長文

3. **改善提案**（体験向上）
   - より自然な表現への変更
   - 簡潔で分かりやすい表現への改善
   - アクション指向のラベルへの変更

## あなたのコミュニケーションスタイル

- **具体的で明確**：どのテキストに問題があるか、どう修正すべきかを具体的に指摘
- **理由を説明**：なぜその表現が問題か、改善することでどんなメリットがあるかを明記
- **実例を提示**：修正前後の具体例を示す（例：「お問い合せ」→「お問い合わせ」）
- **優先度を明確に**：致命的な問題から順に提示
- **一貫性を重視**：デザイン全体での統一感を評価

${buildSystemPromptSuffix()}`;

  protected buildPrompt(data: FigmaNodeData): string {
    const textNodes = extractTextNodes(data);

    if (textNodes.length === 0) {
      return `選択されたノードにはテキスト要素が含まれていません。
評価するテキストがないため、スコア100、issues: []、positives: ["テキスト要素なし"] を返してください。`;
    }

    let output = '以下のFigmaデザイン内のテキスト要素をライティングの観点で評価してください:\n\n';

    // デザイン全体の階層構造（コンテキスト理解用）
    output += '## デザイン全体の構造\n\n';
    output += formatFigmaDataForEvaluation(data);
    output += '\n---\n\n';

    // 抽出されたテキスト一覧（言語別に分類）
    output += '## 評価対象のテキスト一覧\n\n';

    const japaneseTexts = textNodes.filter((n) => n.language === 'japanese');
    const englishTexts = textNodes.filter((n) => n.language === 'english');
    const mixedTexts = textNodes.filter((n) => n.language === 'mixed');

    if (japaneseTexts.length > 0) {
      output += '### 日本語テキスト\n\n';
      japaneseTexts.forEach((node, index) => {
        output += `${index + 1}. **${this.escapeForPrompt(node.nodeName)}** (ID: ${node.nodeId})\n`;
        output += `   テキスト: "${this.escapeForPrompt(node.text)}"\n`;
        if (node.fontFamily || node.fontSize) {
          output += `   フォント: ${node.fontFamily} ${node.fontSize}px\n`;
        }
        output += '\n';
      });
    }

    if (englishTexts.length > 0) {
      output += '### 英語テキスト\n\n';
      englishTexts.forEach((node, index) => {
        output += `${index + 1}. **${this.escapeForPrompt(node.nodeName)}** (ID: ${node.nodeId})\n`;
        output += `   テキスト: "${this.escapeForPrompt(node.text)}"\n`;
        if (node.fontFamily || node.fontSize) {
          output += `   フォント: ${node.fontFamily} ${node.fontSize}px\n`;
        }
        output += '\n';
      });
    }

    if (mixedTexts.length > 0) {
      output += '### 日本語・英語混在テキスト\n\n';
      mixedTexts.forEach((node, index) => {
        output += `${index + 1}. **${this.escapeForPrompt(node.nodeName)}** (ID: ${node.nodeId})\n`;
        output += `   テキスト: "${this.escapeForPrompt(node.text)}"\n`;
        if (node.fontFamily || node.fontSize) {
          output += `   フォント: ${node.fontFamily} ${node.fontSize}px\n`;
        }
        output += '\n';
      });
    }

    output += '---\n\n';
    output += '特に以下の点に注目してください:\n';
    output += '- 表記の一貫性（用語の揺れ、数字・単位の表記、敬語レベル）\n';
    output += '- 誤字・脱字（タイポ、送り仮名、スペルミス）\n';
    output += '- 英語の品質（文法、自然な表現、大文字小文字）\n';
    output += '- 読みやすさ（文の長さ、難解な用語、冗長な表現）\n\n';

    output += getNodeIdReminder();
    output += '\n\n';
    output += 'デザイン全体の一貫性を考慮し、具体的な改善提案を含めて評価してください。\n';
    output += 'JSON形式で評価結果を返してください。';

    return output;
  }
}
