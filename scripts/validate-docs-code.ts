#!/usr/bin/env tsx

/**
 * ドキュメント内のコード参照（CODE_REF）の整合性をチェックするスクリプト
 *
 * 使用方法:
 *   tsx scripts/validate-docs-code.ts
 *   tsx scripts/validate-docs-code.ts --verbose
 */

import * as fs from 'fs';
import * as path from 'path';

import type { CodeRef, CodeRefError } from './utils/types';

// 設定
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const CODE_REF_PATTERN = /<!--\s*CODE_REF:\s*([^:]+?)(?::(\d+)-(\d+))?\s*-->/g;

// コマンドライン引数のパース
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');

/**
 * ディレクトリを再帰的に走査してマークダウンファイルを取得
 */
export function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentPath: string): void {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * CODE_REFコメントを抽出
 */
export function extractCodeRefs(content: string, filePath: string): CodeRef[] {
  const refs: CodeRef[] = [];
  let match: RegExpExecArray | null;

  while ((match = CODE_REF_PATTERN.exec(content)) !== null) {
    const [fullMatch, refPath, startLine, endLine] = match;
    refs.push({
      fullMatch,
      refPath: refPath.trim(),
      startLine: startLine ? parseInt(startLine, 10) : null,
      endLine: endLine ? parseInt(endLine, 10) : null,
      docFile: filePath,
    });
  }

  return refs;
}

/**
 * 参照先のファイルと行番号の存在を確認
 */
export function validateCodeRef(ref: CodeRef): CodeRefError[] {
  const errors: CodeRefError[] = [];

  // 相対パスを絶対パスに変換(プロジェクトルートからの相対パス)
  const projectRoot = path.resolve(__dirname, '..');
  const absolutePath = path.resolve(projectRoot, ref.refPath);

  // パストラバーサル攻撃を防ぐ: プロジェクトルート内に留まるか検証
  if (!absolutePath.startsWith(projectRoot + path.sep)) {
    errors.push({
      type: 'PATH_TRAVERSAL',
      message: `参照先のパスがプロジェクトルート外を指しています: ${ref.refPath}`,
      ref,
    });
    return errors;
  }

  // ファイルの存在確認
  if (!fs.existsSync(absolutePath)) {
    errors.push({
      type: 'FILE_NOT_FOUND',
      message: `参照先のファイルが見つかりません: ${ref.refPath}`,
      ref,
    });
    return errors;
  }

  // 行番号が指定されている場合、行数をチェック
  if (ref.startLine !== null && ref.endLine !== null) {
    try {
      const content = fs.readFileSync(absolutePath, 'utf-8');
      const lines = content.split('\n');
      const totalLines = lines.length;

      if (ref.startLine < 1) {
        errors.push({
          type: 'INVALID_LINE_NUMBER',
          message: `開始行番号が無効です（1未満）: ${ref.startLine}`,
          ref,
        });
      }

      if (ref.endLine > totalLines) {
        errors.push({
          type: 'LINE_OUT_OF_RANGE',
          message: `終了行番号がファイルの行数を超えています: ${ref.endLine} > ${totalLines}`,
          ref,
        });
      }

      if (ref.startLine > ref.endLine) {
        errors.push({
          type: 'INVALID_RANGE',
          message: `開始行番号が終了行番号より大きいです: ${ref.startLine} > ${ref.endLine}`,
          ref,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        type: 'READ_ERROR',
        message: `ファイルの読み込みに失敗しました: ${errorMessage}`,
        ref,
      });
    }
  }

  return errors;
}

/**
 * メイン処理
 */
export function main(): void {
  console.log('🔍 ドキュメント内のコード参照を検証しています...\n');

  // マークダウンファイルを検索
  const markdownFiles = findMarkdownFiles(DOCS_DIR);
  console.log(`📄 ${markdownFiles.length} 個のマークダウンファイルを検出\n`);

  // 全てのCODE_REFを抽出
  let totalRefs = 0;
  const allRefs: CodeRef[] = [];

  for (const file of markdownFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const refs = extractCodeRefs(content, file);

    if (refs.length > 0) {
      totalRefs += refs.length;
      allRefs.push(...refs);

      if (verbose) {
        console.log(`  ${path.relative(DOCS_DIR, file)}: ${refs.length} 個の参照`);
      }
    }
  }

  console.log(`\n📌 ${totalRefs} 個のコード参照を検出\n`);

  if (totalRefs === 0) {
    console.log('✅ コード参照が見つかりませんでした（検証不要）');
    process.exit(0);
  }

  // 各参照を検証
  const allErrors: CodeRefError[] = [];

  for (const ref of allRefs) {
    const errors = validateCodeRef(ref);
    allErrors.push(...errors);
  }

  // 結果の表示
  if (allErrors.length === 0) {
    console.log('✅ 全てのコード参照が有効です！');
    process.exit(0);
  } else {
    console.log(`❌ ${allErrors.length} 個のエラーが見つかりました:\n`);

    // エラーをグループ化して表示
    const errorsByDoc: Record<string, CodeRefError[]> = {};

    for (const error of allErrors) {
      const docFile = path.relative(DOCS_DIR, error.ref.docFile);

      if (!errorsByDoc[docFile]) {
        errorsByDoc[docFile] = [];
      }

      errorsByDoc[docFile].push(error);
    }

    // エラー詳細の表示
    for (const [docFile, errors] of Object.entries(errorsByDoc)) {
      console.log(`📄 ${docFile}:`);

      for (const error of errors) {
        console.log(`  ❌ ${error.type}: ${error.message}`);
        console.log(`     参照: ${error.ref.fullMatch}`);

        if (verbose) {
          console.log(`     ファイル: ${error.ref.refPath}`);
          if (error.ref.startLine && error.ref.endLine) {
            console.log(`     行番号: ${error.ref.startLine}-${error.ref.endLine}`);
          }
        }

        console.log('');
      }
    }

    console.log(`\n💡 ヒント:`);
    console.log(`  - ファイルパスがプロジェクトルートからの相対パスになっているか確認してください`);
    console.log(`  - 行番号が最新のコードと一致しているか確認してください`);
    console.log(`  - 詳細情報を表示するには --verbose オプションを使用してください`);

    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmainを実行
if (require.main === module) {
  main();
}
