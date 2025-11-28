/**
 * スクリプト共通の型定義
 */

/**
 * コード参照情報
 */
export interface CodeRef {
  fullMatch: string;
  refPath: string;
  startLine: number | null;
  endLine: number | null;
  docFile: string;
}

/**
 * コード参照エラー
 */
export interface CodeRefError {
  type:
    | 'FILE_NOT_FOUND'
    | 'LINE_OUT_OF_RANGE'
    | 'INVALID_LINE_NUMBER'
    | 'INVALID_RANGE'
    | 'READ_ERROR'
    | 'PATH_TRAVERSAL';
  message: string;
  ref: CodeRef;
}

/**
 * Git実行オプション
 */
export interface GitExecOptions {
  cwd?: string;
  encoding?: BufferEncoding;
}

/**
 * パターンマッチング結果
 */
export interface PatternMatchResult {
  matched: boolean;
  pattern?: string;
}
