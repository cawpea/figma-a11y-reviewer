#!/usr/bin/env tsx

/**
 * CLAUDE.mdと.github/copilot-instructions.mdの同期を検証するスクリプト
 *
 * CLAUDE.mdが更新された場合、.github/copilot-instructions.mdも更新されているかをチェックします。
 * このスクリプトは警告のみで、CI/CDを失敗させません。
 *
 * 使用方法:
 *   tsx scripts/validate-copilot-sync.ts
 *   tsx scripts/validate-copilot-sync.ts --verbose
 */

import * as path from 'path';

import { checkMainBranchExists, getChangedFiles } from './utils/git.utils';

// 設定
const PROJECT_ROOT = path.join(__dirname, '..');
const CLAUDE_MD = 'CLAUDE.md';
const COPILOT_INSTRUCTIONS = '.github/copilot-instructions.md';

// コマンドライン引数のパース
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');

export interface ValidationResult {
  success: boolean;
  exitCode: number;
  claudeUpdated: boolean;
  copilotUpdated: boolean;
  needsSync: boolean;
  changedFiles: string[];
}

/**
 * CLAUDE.mdとCopilot Instructionsの同期を検証
 */
export function validateCopilotSync(options: {
  verbose: boolean;
  projectRoot: string;
}): ValidationResult {
  const { verbose, projectRoot } = options;

  // mainブランチの存在確認
  if (!checkMainBranchExists()) {
    if (verbose) {
      console.log('⚠️  mainブランチが見つかりません。同期チェックをスキップします。');
    }
    return {
      success: true,
      exitCode: 0,
      claudeUpdated: false,
      copilotUpdated: false,
      needsSync: false,
      changedFiles: [],
    };
  }

  // mainブランチとの差分を取得
  const changedFiles = getChangedFiles({ cwd: projectRoot });

  if (changedFiles.length === 0) {
    if (verbose) {
      console.log('✅ mainブランチとの差分がありません');
    }
    return {
      success: true,
      exitCode: 0,
      claudeUpdated: false,
      copilotUpdated: false,
      needsSync: false,
      changedFiles: [],
    };
  }

  // CLAUDE.mdとcopilot-instructions.mdの更新を確認
  const claudeUpdated = changedFiles.includes(CLAUDE_MD);
  const copilotUpdated = changedFiles.includes(COPILOT_INSTRUCTIONS);

  if (verbose) {
    console.log(`📄 変更されたファイル数: ${changedFiles.length}`);
    console.log(`   CLAUDE.md: ${claudeUpdated ? '✅ 更新あり' : '変更なし'}`);
    console.log(`   copilot-instructions.md: ${copilotUpdated ? '✅ 更新あり' : '変更なし'}\n`);
  }

  // CLAUDE.mdが更新されているが、copilot-instructions.mdが更新されていない場合は警告
  const needsSync = claudeUpdated && !copilotUpdated;

  if (needsSync) {
    return {
      success: false, // 警告として扱うがCI失敗はさせない
      exitCode: 0, // 警告のみなので0を返す
      claudeUpdated,
      copilotUpdated,
      needsSync,
      changedFiles,
    };
  }

  return {
    success: true,
    exitCode: 0,
    claudeUpdated,
    copilotUpdated,
    needsSync: false,
    changedFiles,
  };
}

/**
 * メイン処理
 */
export function main(): void {
  console.log('🔍 GitHub Copilot Instructions の同期を検証しています...\n');

  const result = validateCopilotSync({
    verbose,
    projectRoot: PROJECT_ROOT,
  });

  if (result.needsSync) {
    console.log(
      '⚠️  警告: CLAUDE.md が更新されていますが、copilot-instructions.md が更新されていません\n'
    );
    console.log('📝 以下のコマンドを実行して同期してください:');
    console.log('   npm run sync:copilot\n');
    console.log('   または手動で .github/copilot-instructions.md を更新してください\n');

    // 警告のみなので終了コード0で終了
    process.exit(0);
  }

  if (result.claudeUpdated && result.copilotUpdated) {
    console.log('✅ CLAUDE.md と copilot-instructions.md の両方が更新されています\n');
  } else if (!result.claudeUpdated) {
    if (verbose) {
      console.log('ℹ️  CLAUDE.md は更新されていません\n');
    }
  }

  console.log('✅ 同期チェック完了\n');
  process.exit(result.exitCode);
}

// スクリプトとして実行された場合のみmainを呼び出し
if (require.main === module) {
  main();
}
