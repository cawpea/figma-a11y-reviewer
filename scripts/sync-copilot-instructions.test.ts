
import {
  convertClaudeToGitHubCopilot,
  extractManualSection,
  generateCopilotInstructions,
} from './sync-copilot-instructions';

describe('sync-copilot-instructions', () => {
  describe('convertClaudeToGitHubCopilot', () => {
    it('Claude Code固有の文言をGitHub Copilot向けに変換すること', () => {
      const claudeContent = `This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

# CLAUDE.md

## プロジェクト概要
プロジェクトの説明...

詳細は[こちら](docs/README.md)を参照してください。`;

      const result = convertClaudeToGitHubCopilot(claudeContent);

      expect(result).toContain(
        'This file provides guidance to GitHub Copilot when working with code in this repository.'
      );
      expect(result).not.toContain('Claude Code');
      expect(result).not.toContain('# CLAUDE.md');
      expect(result).toContain('(../docs/README.md)');
    });

    it('複数のdocs/パスを正しく変換すること', () => {
      const claudeContent = `参照:
- [ドキュメント1](docs/guide.md)
- [ドキュメント2](docs/api/reference.md)
- [外部リンク](https://example.com)`;

      const result = convertClaudeToGitHubCopilot(claudeContent);

      expect(result).toContain('(../docs/guide.md)');
      expect(result).toContain('(../docs/api/reference.md)');
      expect(result).toContain('(https://example.com)'); // 外部リンクは変換しない
    });
  });

  describe('extractManualSection', () => {
    const AUTO_GEN_END = '<!-- AUTO-GENERATED: END -->';

    it('手動編集セクションが存在する場合に正しく抽出すること', () => {
      const content = `# GitHub Copilot Instructions

<!-- AUTO-GENERATED: START -->
自動生成されたコンテンツ
${AUTO_GEN_END}

---

## GitHub Copilot固有のガイダンス

### カスタムルール

1. ルール1
2. ルール2

これは手動で追加されたコンテンツです。`;

      const result = extractManualSection(content);

      expect(result).toBe(`### カスタムルール

1. ルール1
2. ルール2

これは手動で追加されたコンテンツです。`);
    });

    it('AUTO_GEN_ENDマーカーがない場合はnullを返すこと', () => {
      const content = `# GitHub Copilot Instructions

自動生成されたコンテンツ`;

      const result = extractManualSection(content);

      expect(result).toBeNull();
    });

    it('手動セクションのヘッダーがない場合はnullを返すこと', () => {
      const content = `# GitHub Copilot Instructions

<!-- AUTO-GENERATED: START -->
自動生成されたコンテンツ
<!-- AUTO-GENERATED: END -->

何かのコンテンツ`;

      const result = extractManualSection(content);

      expect(result).toBeNull();
    });

    it('デフォルトガイダンスのみの場合はnullを返すこと', () => {
      const content = `# GitHub Copilot Instructions

<!-- AUTO-GENERATED: START -->
自動生成されたコンテンツ
${AUTO_GEN_END}

---

## GitHub Copilot固有のガイダンス

このセクションは手動で編集できます。GitHub Copilot特有の指示をここに追加してください。`;

      const result = extractManualSection(content);

      expect(result).toBeNull();
    });

    it('空の手動セクションの場合はnullを返すこと', () => {
      const content = `# GitHub Copilot Instructions

<!-- AUTO-GENERATED: START -->
自動生成されたコンテンツ
${AUTO_GEN_END}

---

## GitHub Copilot固有のガイダンス

`;

      const result = extractManualSection(content);

      expect(result).toBeNull();
    });
  });

  describe('generateCopilotInstructions', () => {
    const AUTO_GEN_START = '<!-- AUTO-GENERATED: START -->';
    const AUTO_GEN_END = '<!-- AUTO-GENERATED: END -->';

    it('手動セクションがない場合にデフォルトガイダンスを生成すること', () => {
      const claudeContent = `# プロジェクト概要
テスト用のコンテンツ`;

      const result = generateCopilotInstructions(claudeContent, null);

      expect(result).toContain('# GitHub Copilot Instructions');
      expect(result).toContain(AUTO_GEN_START);
      expect(result).toContain(AUTO_GEN_END);
      expect(result).toContain('## GitHub Copilot固有のガイダンス');
      expect(result).toContain(
        'このセクションは手動で編集できます。GitHub Copilot特有の指示をここに追加してください。'
      );
    });

    it('手動セクションが存在する場合にそれを保持すること', () => {
      const claudeContent = `# プロジェクト概要
テスト用のコンテンツ`;

      const manualSection = `### カスタムルール

- ルール1
- ルール2`;

      const result = generateCopilotInstructions(claudeContent, manualSection);

      expect(result).toContain('## GitHub Copilot固有のガイダンス');
      expect(result).toContain('### カスタムルール');
      expect(result).toContain('- ルール1');
      expect(result).toContain('- ルール2');
      expect(result).not.toContain(
        'このセクションは手動で編集できます。GitHub Copilot特有の指示をここに追加してください。'
      );
    });

    it('変換後のコンテンツが自動生成セクションに含まれること', () => {
      const claudeContent = `This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

# CLAUDE.md

## プロジェクト概要
プロジェクトの説明...

[ドキュメント](docs/README.md)`;

      const result = generateCopilotInstructions(claudeContent, null);

      // 変換後のコンテンツが含まれていることを確認
      expect(result).toContain(
        'This file provides guidance to GitHub Copilot when working with code in this repository.'
      );
      expect(result).not.toContain('Claude Code');
      expect(result).not.toContain('# CLAUDE.md');
      expect(result).toContain('(../docs/README.md)');
    });

    it('AUTO_GEN_STARTとAUTO_GEN_ENDの間に変換後のコンテンツが配置されること', () => {
      const claudeContent = `テストコンテンツ`;

      const result = generateCopilotInstructions(claudeContent, null);

      const startIndex = result.indexOf(AUTO_GEN_START);
      const endIndex = result.indexOf(AUTO_GEN_END);

      expect(startIndex).toBeGreaterThan(-1);
      expect(endIndex).toBeGreaterThan(startIndex);

      const autoGenSection = result.substring(startIndex, endIndex);
      expect(autoGenSection).toContain('テストコンテンツ');
    });

    it('手動セクションが---の後に配置されること', () => {
      const claudeContent = `自動生成コンテンツ`;
      const manualSection = `手動追加コンテンツ`;

      const result = generateCopilotInstructions(claudeContent, manualSection);

      const separatorIndex = result.lastIndexOf('---');
      const manualSectionIndex = result.indexOf('手動追加コンテンツ');

      expect(separatorIndex).toBeGreaterThan(-1);
      expect(manualSectionIndex).toBeGreaterThan(separatorIndex);
    });
  });

  describe('統合テスト', () => {
    it('既存の手動セクションを保持しながら自動生成セクションを更新できること', () => {
      // 1. 最初の生成（手動セクションなし）
      const claudeContent1 = `# プロジェクト概要
バージョン1のコンテンツ`;

      const firstGeneration = generateCopilotInstructions(claudeContent1, null);

      expect(firstGeneration).toContain('バージョン1のコンテンツ');
      expect(firstGeneration).toContain(
        'このセクションは手動で編集できます。GitHub Copilot特有の指示をここに追加してください。'
      );

      // 2. 手動セクションを編集（シミュレーション）
      const customManualSection = `### 私のカスタムルール

これは手動で追加したルールです。`;

      // 3. CLAUDE.mdが更新された想定で再生成
      const claudeContent2 = `# プロジェクト概要
バージョン2のコンテンツ（更新されました）`;

      const secondGeneration = generateCopilotInstructions(claudeContent2, customManualSection);

      // 自動生成セクションは更新される
      expect(secondGeneration).toContain('バージョン2のコンテンツ（更新されました）');
      expect(secondGeneration).not.toContain('バージョン1のコンテンツ');

      // 手動セクションは保持される
      expect(secondGeneration).toContain('### 私のカスタムルール');
      expect(secondGeneration).toContain('これは手動で追加したルールです。');

      // デフォルトガイダンスは含まれない
      expect(secondGeneration).not.toContain(
        'このセクションは手動で編集できます。GitHub Copilot特有の指示をここに追加してください。'
      );
    });

    it('extractManualSection → generateCopilotInstructions の往復で手動セクションが保持されること', () => {
      const claudeContent = `# テストコンテンツ`;
      const manualContent = `### マイルール

1. ルール1
2. ルール2`;

      // 1. 手動セクション付きで生成
      const generated = generateCopilotInstructions(claudeContent, manualContent);

      // 2. 生成されたコンテンツから手動セクションを抽出
      const extracted = extractManualSection(generated);

      // 3. 抽出された手動セクションが元と一致すること
      expect(extracted).toBe(manualContent);
    });
  });
});
