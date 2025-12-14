import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

const mockedFs = jest.mocked(fs);

// テスト用のモジュールを事前にインポート
import { copySharedToProject } from './copy-shared';

describe('copy-shared', () => {
  // 実際のプロジェクトルートを使用（__dirnameの親ディレクトリ）
  const PROJECT_ROOT = path.join(__dirname, '..');
  const SHARED_SRC = path.join(PROJECT_ROOT, 'shared', 'src');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('copySharedToProject', () => {
    describe('正常系', () => {
      it('backendプロジェクトにshared/をコピーする', () => {
        const targetDir = path.join(PROJECT_ROOT, 'backend', 'src', 'shared');

        mockedFs.existsSync.mockReturnValueOnce(true); // SHARED_SRC exists
        mockedFs.existsSync.mockReturnValueOnce(true); // targetParent exists
        mockedFs.cpSync.mockImplementation(() => {});

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        copySharedToProject('backend');

        // ソースディレクトリの存在確認
        expect(mockedFs.existsSync).toHaveBeenCalledWith(SHARED_SRC);

        // コピー実行
        expect(mockedFs.cpSync).toHaveBeenCalledWith(SHARED_SRC, targetDir, {
          recursive: true,
          force: true,
        });

        // ログ出力
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('📦 Copying shared/ to backend/src/shared/')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('✅ Successfully copied to backend/src/shared/')
        );

        consoleSpy.mockRestore();
      });

      it('figma-pluginプロジェクトにshared/をコピーする', () => {
        const targetDir = path.join(PROJECT_ROOT, 'figma-plugin', 'src', 'shared');

        mockedFs.existsSync.mockReturnValueOnce(true); // SHARED_SRC exists
        mockedFs.existsSync.mockReturnValueOnce(true); // targetParent exists
        mockedFs.cpSync.mockImplementation(() => {});

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        copySharedToProject('figma-plugin');

        expect(mockedFs.cpSync).toHaveBeenCalledWith(SHARED_SRC, targetDir, {
          recursive: true,
          force: true,
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('📦 Copying shared/ to figma-plugin/src/shared/')
        );

        consoleSpy.mockRestore();
      });

      it('ターゲットディレクトリの親ディレクトリが存在しない場合は作成する', () => {
        const targetParent = path.join(PROJECT_ROOT, 'backend', 'src');

        mockedFs.existsSync.mockReturnValueOnce(true); // SHARED_SRC exists
        mockedFs.existsSync.mockReturnValueOnce(false); // targetParent does not exist
        mockedFs.mkdirSync.mockImplementation(() => undefined);
        mockedFs.cpSync.mockImplementation(() => {});

        jest.spyOn(console, 'log').mockImplementation();

        copySharedToProject('backend');

        expect(mockedFs.mkdirSync).toHaveBeenCalledWith(targetParent, {
          recursive: true,
        });
      });
    });

    describe('異常系', () => {
      it('ソースディレクトリが存在しない場合はエラーをスローする', () => {
        mockedFs.existsSync.mockReturnValueOnce(false); // SHARED_SRC does not exist

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        expect(() => copySharedToProject('backend')).toThrow(
          `Source directory not found: ${SHARED_SRC}`
        );

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('❌ Error copying shared/ to backend:'),
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
        consoleSpy.mockRestore();
      });

      it('コピー中にエラーが発生した場合はエラーをスローする', () => {
        mockedFs.existsSync.mockReturnValueOnce(true); // SHARED_SRC exists
        mockedFs.existsSync.mockReturnValueOnce(true); // targetParent exists

        const copyError = new Error('Permission denied');
        mockedFs.cpSync.mockImplementation(() => {
          throw copyError;
        });

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        expect(() => copySharedToProject('figma-plugin')).toThrow('Permission denied');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('❌ Error copying shared/ to figma-plugin:'),
          copyError
        );

        consoleErrorSpy.mockRestore();
        consoleSpy.mockRestore();
      });
    });
  });

  describe('ログ出力', () => {
    it('コピー元とコピー先のパスをログに表示する', () => {
      const targetDir = path.join(PROJECT_ROOT, 'backend', 'src', 'shared');

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.cpSync.mockImplementation(() => {});

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      copySharedToProject('backend');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`Source: ${SHARED_SRC}`));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`Target: ${targetDir}`));

      consoleSpy.mockRestore();
    });
  });

  describe('上書き動作', () => {
    it('cpSyncがforce: trueで呼ばれる', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.cpSync.mockImplementation(() => {});

      jest.spyOn(console, 'log').mockImplementation();

      copySharedToProject('backend');

      expect(mockedFs.cpSync).toHaveBeenCalledWith(
        SHARED_SRC,
        expect.any(String),
        expect.objectContaining({ force: true })
      );
    });

    it('cpSyncがrecursive: trueで呼ばれる', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.cpSync.mockImplementation(() => {});

      jest.spyOn(console, 'log').mockImplementation();

      copySharedToProject('figma-plugin');

      expect(mockedFs.cpSync).toHaveBeenCalledWith(
        SHARED_SRC,
        expect.any(String),
        expect.objectContaining({ recursive: true })
      );
    });
  });
});
