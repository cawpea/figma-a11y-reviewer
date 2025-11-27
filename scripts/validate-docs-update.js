#!/usr/bin/env node

/**
 * 作業ブランチのコミットログをもとにドキュメント更新を確認するスクリプト
 *
 * 使用方法:
 *   node scripts/validate-docs-update.js
 *   node scripts/validate-docs-update.js --verbose
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 設定
const PROJECT_ROOT = path.join(__dirname, '..');
const DOCSIGNORE_FILE = path.join(PROJECT_ROOT, '.docsignore');
const DOCS_PATHS = ['CLAUDE.md', 'docs/'];

// コマンドライン引数のパース
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');

/**
 * .docsignoreファイルを読み込んでパターンを取得
 */
function loadDocsignorePatterns() {
  if (!fs.existsSync(DOCSIGNORE_FILE)) {
    return [];
  }

  const content = fs.readFileSync(DOCSIGNORE_FILE, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#')); // コメントと空行を除外
}

/**
 * ファイルパスがパターンにマッチするかチェック（シンプルなグロブマッチング）
 */
function matchesPattern(filePath, pattern) {
  // ディレクトリパターン（末尾が/）
  if (pattern.endsWith('/')) {
    return filePath.startsWith(pattern) || filePath.startsWith(pattern.slice(0, -1) + '/');
  }

  // **/ パターン（任意のディレクトリ階層）
  if (pattern.startsWith('**/')) {
    const suffix = pattern.slice(3);
    // ファイル名マッチまたはパス内に含まれるかチェック
    if (suffix.includes('*')) {
      // ワイルドカード処理
      const regex = new RegExp(
        suffix.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.')
      );
      return (
        regex.test(path.basename(filePath)) || filePath.split('/').some((part) => regex.test(part))
      );
    }
    return filePath.endsWith(suffix) || filePath.includes('/' + suffix);
  }

  // * ワイルドカード
  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(filePath);
  }

  // 完全一致またはプレフィックスマッチ
  return filePath === pattern || filePath.startsWith(pattern + '/');
}

/**
 * ファイルが.docsignoreで除外されるかチェック
 */
function isIgnored(filePath, patterns) {
  return patterns.some((pattern) => matchesPattern(filePath, pattern));
}

/**
 * mainブランチの存在を確認
 */
function checkMainBranchExists() {
  try {
    execSync('git rev-parse --verify main', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * mainブランチとの差分ファイルを取得
 */
function getChangedFiles() {
  try {
    const output = execSync('git diff main...HEAD --name-only', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
    });
    return output
      .trim()
      .split('\n')
      .filter((line) => line);
  } catch (error) {
    console.error('❌ git diffコマンドの実行に失敗しました:', error.message);
    return [];
  }
}

/**
 * ドキュメントファイルの更新を検出
 */
function getUpdatedDocFiles(files) {
  return files.filter((file) =>
    DOCS_PATHS.some((docPath) => {
      if (docPath.endsWith('/')) {
        return file.startsWith(docPath);
      }
      return file === docPath;
    })
  );
}

/**
 * メイン処理
 */
function main() {
  console.log('🔍 ドキュメント更新を確認しています...\n');

  // mainブランチの存在確認
  if (!checkMainBranchExists()) {
    console.log('⚠️  mainブランチが見つかりません。ドキュメント更新チェックをスキップします。');
    process.exit(0);
  }

  // .docsignoreパターンを読み込み
  const ignorePatterns = loadDocsignorePatterns();
  if (verbose) {
    console.log(`📋 .docsignoreから${ignorePatterns.length}個のパターンを読み込みました\n`);
  }

  // mainブランチとの差分を取得
  const allChangedFiles = getChangedFiles();

  if (allChangedFiles.length === 0) {
    console.log('✅ mainブランチとの差分がありません');
    process.exit(0);
  }

  if (verbose) {
    console.log(`📄 ${allChangedFiles.length}個のファイルが変更されています\n`);
  }

  // .docsignoreで除外
  const relevantFiles = allChangedFiles.filter((file) => !isIgnored(file, ignorePatterns));

  if (relevantFiles.length === 0) {
    console.log('✅ ドキュメント更新が必要なコード変更はありません（すべて除外対象）');
    process.exit(0);
  }

  // ドキュメントファイルの更新を確認
  const updatedDocFiles = getUpdatedDocFiles(allChangedFiles);

  if (verbose) {
    console.log(`📝 変更されたコードファイル (${relevantFiles.length}個):`);
    relevantFiles.forEach((file) => console.log(`  - ${file}`));
    console.log('');
  }

  // 結果の表示
  if (updatedDocFiles.length > 0) {
    console.log('✅ ドキュメントが更新されています:');
    updatedDocFiles.forEach((file) => console.log(`  ✓ ${file}`));
    console.log('');
  } else {
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

  // 警告のみで正常終了
  process.exit(0);
}

// 実行
main();
