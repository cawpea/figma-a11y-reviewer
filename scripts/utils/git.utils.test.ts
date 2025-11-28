import { execSync } from 'child_process';

import { checkMainBranchExists, getChangedFiles } from './git.utils';

// execSyncをモック
jest.mock('child_process');
const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('git.utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // console.errorをモック
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkMainBranchExists', () => {
    it('mainブランチが存在する場合はtrueを返す', () => {
      mockedExecSync.mockReturnValue(Buffer.from(''));

      const result = checkMainBranchExists();

      expect(result).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith('git rev-parse --verify main', {
        stdio: 'ignore',
      });
    });

    it('mainブランチが存在しない場合はfalseを返す', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('fatal: Needed a single revision');
      });

      const result = checkMainBranchExists();

      expect(result).toBe(false);
    });

    it('Gitコマンドエラー時はfalseを返す', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = checkMainBranchExists();

      expect(result).toBe(false);
    });
  });

  describe('getChangedFiles', () => {
    it('差分ファイルのリストを返す', () => {
      const mockOutput = 'file1.ts\nfile2.ts\nfile3.js\n';
      mockedExecSync.mockReturnValue(mockOutput as any);

      const result = getChangedFiles();

      expect(result).toEqual(['file1.ts', 'file2.ts', 'file3.js']);
      expect(mockedExecSync).toHaveBeenCalledWith('git diff main...HEAD --name-only', {
        encoding: 'utf-8',
        cwd: undefined,
      });
    });

    it('差分がない場合は空配列を返す', () => {
      mockedExecSync.mockReturnValue('' as any);

      const result = getChangedFiles();

      expect(result).toEqual([]);
    });

    it('空行を除外する', () => {
      const mockOutput = 'file1.ts\n\nfile2.ts\n\n';
      mockedExecSync.mockReturnValue(mockOutput as any);

      const result = getChangedFiles();

      expect(result).toEqual(['file1.ts', 'file2.ts']);
    });

    it('cwdオプションを指定できる', () => {
      const mockOutput = 'file1.ts\n';
      mockedExecSync.mockReturnValue(mockOutput as any);

      const result = getChangedFiles({ cwd: '/custom/path' });

      expect(result).toEqual(['file1.ts']);
      expect(mockedExecSync).toHaveBeenCalledWith('git diff main...HEAD --name-only', {
        encoding: 'utf-8',
        cwd: '/custom/path',
      });
    });

    it('カスタムエンコーディングを指定できる', () => {
      const mockOutput = 'file1.ts\n';
      mockedExecSync.mockReturnValue(mockOutput as any);

      const result = getChangedFiles({ encoding: 'utf8' });

      expect(result).toEqual(['file1.ts']);
      expect(mockedExecSync).toHaveBeenCalledWith('git diff main...HEAD --name-only', {
        encoding: 'utf8',
        cwd: undefined,
      });
    });

    it('Gitコマンドエラー時は空配列を返しエラーログを出力', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('fatal: ambiguous argument');
      });

      const result = getChangedFiles();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        '❌ git diffコマンドの実行に失敗しました:',
        'fatal: ambiguous argument'
      );
    });

    it('非Errorオブジェクトのエラーも処理できる', () => {
      mockedExecSync.mockImplementation(() => {
        throw 'string error';
      });

      const result = getChangedFiles();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        '❌ git diffコマンドの実行に失敗しました:',
        'string error'
      );
    });
  });
});
