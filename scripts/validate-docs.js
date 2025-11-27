#!/usr/bin/env node

/**
 * ドキュメント検証の統合スクリプト
 * - コード参照（CODE_REF）の整合性チェック
 * - ドキュメント更新の確認
 *
 * 使用方法:
 *   node scripts/validate-docs.js
 *   node scripts/validate-docs.js --verbose
 */

const { execSync } = require('child_process');
const path = require('path');

// コマンドライン引数のパース
const args = process.argv.slice(2);
const verboseFlag = args.includes('--verbose') || args.includes('-v') ? ' --verbose' : '';

/**
 * スクリプトを実行して結果を返す
 */
function runScript(scriptPath, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${description}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    execSync(`node ${scriptPath}${verboseFlag}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    return true;
  } catch (error) {
    // エラーが発生した場合も継続（各スクリプトがexit codeを管理）
    return false;
  }
}

/**
 * メイン処理
 */
function main() {
  console.log('📚 ドキュメント検証を開始します...');

  let hasError = false;

  // 1. コード参照の検証
  const codeRefResult = runScript(
    path.join(__dirname, 'validate-docs-code.js'),
    '1️⃣  コード参照（CODE_REF）の検証'
  );
  if (!codeRefResult) {
    hasError = true;
  }

  // 2. ドキュメント更新の確認
  const updateResult = runScript(
    path.join(__dirname, 'validate-docs-update.js'),
    '2️⃣  ドキュメント更新の確認'
  );
  if (!updateResult) {
    hasError = true;
  }

  // 結果サマリー
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 検証結果サマリー');
  console.log(`${'='.repeat(60)}\n`);

  if (hasError) {
    console.log('❌ 一部の検証でエラーが発生しました');
    console.log('   詳細は上記の出力を確認してください\n');
    process.exit(1);
  } else {
    console.log('✅ すべての検証が完了しました\n');
    process.exit(0);
  }
}

// 実行
main();
