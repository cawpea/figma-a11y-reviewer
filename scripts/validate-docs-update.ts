#!/usr/bin/env tsx

/**
 * 作業ブランチのコミットログをもとにドキュメント更新を確認するスクリプト
 *
 * 使用方法:
 *   tsx scripts/validate-docs-update.ts
 *   tsx scripts/validate-docs-update.ts --verbose
 */

import * as path from 'path';

import { checkMainBranchExists, getChangedFiles } from './utils/git.utils';
import { isIgnored, loadDocsignorePatterns } from './utils/ignore-pattern.utils';

// 設定
const PROJECT_ROOT = path.join(__dirname, '..');
const DOCSIGNORE_FILE = path.join(PROJECT_ROOT, '.docsignore');
const DOCS_PATHS = ['CLAUDE.md', 'docs/'] as const;

/**
 * ドキュメントファイルの更新を検出
 */
export function getUpdatedDocFiles(files: string[]): string[] {
  return files.filter((file) =>
    DOCS_PATHS.some((docPath) => {
      if (docPath.endsWith('/')) {
        return file.startsWith(docPath);
      }
      return file === docPath;
    })
  );
}

export interface ValidationResult {
  success: boolean;
  exitCode: number;
  hasDocUpdates: boolean;
  updatedDocFiles: string[];
  relevantFiles: string[];
  allChangedFiles: string[];
}

/**
 * ドキュメント更新検証のメインロジック
 */
export function validateDocsUpdate(options: {
  verbose: boolean;
  projectRoot: string;
  docsignoreFile: string;
}): ValidationResult {
  const { verbose, projectRoot, docsignoreFile } = options;

  // mainブランチの存在確認
  if (!checkMainBranchExists()) {
    if (verbose) {
      console.log('⚠️  mainブランチが見つかりません。ドキュメント更新チェックをスキップします。');
    }
    return {
      success: true,
      exitCode: 0,
      hasDocUpdates: false,
      updatedDocFiles: [],
      relevantFiles: [],
      allChangedFiles: [],
    };
  }

  // .docsignoreパターンを読み込み
  const ignorePatterns = loadDocsignorePatterns(docsignoreFile);
  if (verbose) {
    console.log(`📋 .docsignoreから${ignorePatterns.length}個のパターンを読み込みました\n`);
  }

  // mainブランチとの差分を取得
  const allChangedFiles = getChangedFiles({ cwd: projectRoot });

  if (allChangedFiles.length === 0) {
    if (verbose) {
      console.log('✅ mainブランチとの差分がありません');
    }
    return {
      success: true,
      exitCode: 0,
      hasDocUpdates: false,
      updatedDocFiles: [],
      relevantFiles: [],
      allChangedFiles: [],
    };
  }

  if (verbose) {
    console.log(`📄 ${allChangedFiles.length}個のファイルが変更されています\n`);
  }

  // .docsignoreで除外
  const relevantFiles = allChangedFiles.filter((file) => !isIgnored(file, ignorePatterns));

  if (relevantFiles.length === 0) {
    if (verbose) {
      console.log('✅ ドキュメント更新が必要なコード変更はありません（すべて除外対象）');
    }
    return {
      success: true,
      exitCode: 0,
      hasDocUpdates: false,
      updatedDocFiles: [],
      relevantFiles: [],
      allChangedFiles,
    };
  }

  // ドキュメントファイルの更新を確認
  const updatedDocFiles = getUpdatedDocFiles(allChangedFiles);

  return {
    success: true,
    exitCode: 0,
    hasDocUpdates: updatedDocFiles.length > 0,
    updatedDocFiles,
    relevantFiles,
    allChangedFiles,
  };
}

/**
 * 検証結果を表示
 */
export function displayResult(result: ValidationResult, verbose: boolean): void {
  const { hasDocUpdates, updatedDocFiles, relevantFiles } = result;

  if (verbose && relevantFiles.length > 0) {
    console.log(`📝 変更されたコードファイル (${relevantFiles.length}個):`);
    relevantFiles.forEach((file) => console.log(`  - ${file}`));
    console.log('');
  }

  // 結果の表示
  if (hasDocUpdates) {
    console.log('✅ ドキュメントが更新されています:');
    updatedDocFiles.forEach((file) => console.log(`  ✓ ${file}`));
    console.log('');
  } else if (relevantFiles.length > 0) {
    console.log('⚠️  コードが変更されていますが、ドキュメントは更新されていません\n');
    console.log('📝 以下のファイルが変更されています:');
    relevantFiles.slice(0, 10).forEach((file) => console.log(`  - ${file}`));
    if (relevantFiles.length > 10) {
      console.log(`  ... 他 ${relevantFiles.length - 10} ファイル`);
    }
    console.log('');
    console.log('💡 ヒント:');
    console.log('  - 重要な変更の場合は CLAUDE.md または docs/ の更新を検討してください');
    console.log('  - 軽微な変更や内部実装の変更の場合は更新不要です');
    console.log('');
  }
}

/**
 * メイン処理
 */
function main(): void {
  console.log('🔍 ドキュメント更新を確認しています...\n');

  // コマンドライン引数のパース
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');

  const result = validateDocsUpdate({
    verbose,
    projectRoot: PROJECT_ROOT,
    docsignoreFile: DOCSIGNORE_FILE,
  });

  displayResult(result, verbose);

  // 警告のみで正常終了
  process.exit(result.exitCode);
}

// 実行 (テスト時は実行しない)
if (require.main === module) {
  main();
}
