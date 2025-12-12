#!/usr/bin/env tsx

/**
 * CLAUDE.mdから.github/copilot-instructions.mdを自動生成するスクリプト
 *
 * 使用方法:
 *   tsx scripts/sync-copilot-instructions.ts
 *   npm run sync:copilot
 */

import * as fs from 'fs';
import * as path from 'path';

// 設定
const PROJECT_ROOT = path.join(__dirname, '..');
const CLAUDE_MD_PATH = path.join(PROJECT_ROOT, 'CLAUDE.md');
const COPILOT_INSTRUCTIONS_PATH = path.join(PROJECT_ROOT, '.github', 'copilot-instructions.md');

// 自動生成マーカー
const AUTO_GEN_START = '<!-- AUTO-GENERATED: START -->';
const AUTO_GEN_END = '<!-- AUTO-GENERATED: END -->';

/**
 * CLAUDE.mdの内容をGitHub Copilot向けに変換
 */
export function convertClaudeToGitHubCopilot(claudeContent: string): string {
  // Claude Code固有の文言を削除または一般化
  let converted = claudeContent
    // ファイルヘッダーの説明を更新
    .replace(
      /This file provides guidance to Claude Code \(claude\.ai\/code\) when working with\ncode in this repository\./,
      'This file provides guidance to GitHub Copilot when working with code in this repository.'
    )
    // ファイル名参照を削除
    .replace(/^# CLAUDE\.md\n\n/m, '')
    // docs/への相対パスを.github/からの相対パスに変換
    .replace(/\(docs\//g, '(../docs/');

  return converted;
}

/**
 * 既存のcopilot-instructions.mdから手動編集セクションを抽出
 */
export function extractManualSection(content: string): string | null {
  const endMarkerIndex = content.indexOf(AUTO_GEN_END);
  if (endMarkerIndex === -1) {
    return null;
  }

  const manualSection = content.substring(endMarkerIndex + AUTO_GEN_END.length).trim();
  return manualSection || null;
}

/**
 * 新しいcopilot-instructions.mdを生成
 */
export function generateCopilotInstructions(
  claudeContent: string,
  manualSection: string | null
): string {
  const convertedContent = convertClaudeToGitHubCopilot(claudeContent);

  const header = `# GitHub Copilot Instructions

This file provides guidance to GitHub Copilot when working with code in this repository.

${AUTO_GEN_START}
<!-- This section is automatically generated from CLAUDE.md. Do not edit manually. -->
<!-- Run \`npm run sync:copilot\` to regenerate this section. -->

`;

  const autoGenSection = convertedContent;

  const footer = `
${AUTO_GEN_END}`;

  const manualPart = manualSection
    ? `\n\n---\n\n## GitHub Copilot固有のガイダンス

このセクションは手動で編集できます。GitHub Copilot特有の指示をここに追加してください。

${manualSection}`
    : `\n\n---\n\n## GitHub Copilot固有のガイダンス

このセクションは手動で編集できます。GitHub Copilot特有の指示をここに追加してください。

### コード提案の品質向上

- TypeScript型推論を最大限活用してください
- Preactコンポーネントでは関数コンポーネントとフックを優先してください
- TailwindCSSのユーティリティクラスを使用し、カスタムCSSは最小限にしてください

### テストコード生成

- テスト名は日本語で記述してください
- Testing Libraryのアクセシビリティクエリ（\`getByRole\`, \`getByLabelText\`など）を優先してください
- モックは\`jest.mock()\`を使用し、実装の詳細ではなく振る舞いをテストしてください
`;

  return header + autoGenSection + footer + manualPart;
}

/**
 * メイン処理
 */
export function main(): void {
  console.log('🔄 GitHub Copilot Instructions を同期しています...\n');

  // CLAUDE.mdを読み込み
  if (!fs.existsSync(CLAUDE_MD_PATH)) {
    console.error('❌ エラー: CLAUDE.md が見つかりません');
    process.exit(1);
  }

  const claudeContent = fs.readFileSync(CLAUDE_MD_PATH, 'utf-8');

  // 既存のcopilot-instructions.mdから手動セクションを抽出（存在する場合）
  let manualSection: string | null = null;
  if (fs.existsSync(COPILOT_INSTRUCTIONS_PATH)) {
    const existingContent = fs.readFileSync(COPILOT_INSTRUCTIONS_PATH, 'utf-8');
    manualSection = extractManualSection(existingContent);

    if (manualSection) {
      console.log('📝 既存の手動編集セクションを保持します');
    }
  }

  // 新しいcopilot-instructions.mdを生成
  const newContent = generateCopilotInstructions(claudeContent, manualSection);

  // .githubディレクトリが存在しない場合は作成
  const githubDir = path.dirname(COPILOT_INSTRUCTIONS_PATH);
  if (!fs.existsSync(githubDir)) {
    fs.mkdirSync(githubDir, { recursive: true });
  }

  // ファイルを書き込み
  fs.writeFileSync(COPILOT_INSTRUCTIONS_PATH, newContent, 'utf-8');

  console.log('✅ GitHub Copilot Instructions を更新しました');
  console.log(`   ${path.relative(PROJECT_ROOT, COPILOT_INSTRUCTIONS_PATH)}\n`);
}

// スクリプトとして実行された場合のみmainを呼び出し
if (require.main === module) {
  main();
}
