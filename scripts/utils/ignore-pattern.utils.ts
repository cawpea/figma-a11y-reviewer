import * as fs from 'fs';
import * as path from 'path';

/**
 * ファイルパスがパターンにマッチするかチェック（シンプルなグロブマッチング）
 */
export function matchesPattern(filePath: string, pattern: string): boolean {
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
 * ファイルが指定されたパターンで除外されるかチェック
 */
export function isIgnored(filePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(filePath, pattern));
}

/**
 * .docsignoreファイルを読み込んでパターンを取得
 */
export function loadDocsignorePatterns(docsignoreFile: string): string[] {
  if (!fs.existsSync(docsignoreFile)) {
    return [];
  }

  const content = fs.readFileSync(docsignoreFile, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#')); // コメントと空行を除外
}
