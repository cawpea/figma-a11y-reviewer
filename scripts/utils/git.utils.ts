import { execSync } from 'child_process';

import type { GitExecOptions } from './types';

/**
 * mainブランチの存在を確認
 */
export function checkMainBranchExists(): boolean {
  try {
    execSync('git rev-parse --verify main', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * mainブランチとの差分ファイルを取得
 */
export function getChangedFiles(options: GitExecOptions = {}): string[] {
  try {
    const output = execSync('git diff main...HEAD --name-only', {
      encoding: options.encoding || 'utf-8',
      cwd: options.cwd,
    });
    return output
      .trim()
      .split('\n')
      .filter((line) => line.length > 0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ git diffコマンドの実行に失敗しました:', errorMessage);
    return [];
  }
}
