/**
 * validate-docs-update.tsのユニットテスト
 */

import { checkMainBranchExists, getChangedFiles } from './utils/git.utils';
import { isIgnored, loadDocsignorePatterns } from './utils/ignore-pattern.utils';
import { displayResult, getUpdatedDocFiles, validateDocsUpdate } from './validate-docs-update';

// ユーティリティ関数をモック化
jest.mock('./utils/git.utils');
jest.mock('./utils/ignore-pattern.utils');

const mockCheckMainBranchExists = checkMainBranchExists as jest.MockedFunction<
  typeof checkMainBranchExists
>;
const mockGetChangedFiles = getChangedFiles as jest.MockedFunction<typeof getChangedFiles>;
const mockLoadDocsignorePatterns = loadDocsignorePatterns as jest.MockedFunction<
  typeof loadDocsignorePatterns
>;
const mockIsIgnored = isIgnored as jest.MockedFunction<typeof isIgnored>;

describe('validate-docs-update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUpdatedDocFiles', () => {
    it('CLAUDE.mdファイルを検出する', () => {
      const files = ['src/index.ts', 'CLAUDE.md', 'backend/api.ts'];
      const result = getUpdatedDocFiles(files);

      expect(result).toEqual(['CLAUDE.md']);
    });

    it('docs/配下のファイルを検出する', () => {
      const files = ['src/index.ts', 'docs/README.md', 'docs/api/endpoint.md', 'backend/api.ts'];
      const result = getUpdatedDocFiles(files);

      expect(result).toEqual(['docs/README.md', 'docs/api/endpoint.md']);
    });

    it('CLAUDE.mdとdocs/の両方を検出する', () => {
      const files = ['src/index.ts', 'CLAUDE.md', 'docs/README.md'];
      const result = getUpdatedDocFiles(files);

      expect(result).toEqual(['CLAUDE.md', 'docs/README.md']);
    });

    it('ドキュメントファイルがない場合は空配列を返す', () => {
      const files = ['src/index.ts', 'backend/api.ts', 'README.md'];
      const result = getUpdatedDocFiles(files);

      expect(result).toEqual([]);
    });

    it('空配列の場合は空配列を返す', () => {
      const result = getUpdatedDocFiles([]);

      expect(result).toEqual([]);
    });
  });

  describe('validateDocsUpdate', () => {
    const options = {
      verbose: false,
      projectRoot: '/test/project',
      docsignoreFile: '/test/project/.docsignore',
    };

    it('mainブランチが存在しない場合は成功として返す', () => {
      mockCheckMainBranchExists.mockReturnValue(false);

      const result = validateDocsUpdate(options);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        hasDocUpdates: false,
        updatedDocFiles: [],
        relevantFiles: [],
        allChangedFiles: [],
      });
    });

    it('差分がない場合は成功として返す', () => {
      mockCheckMainBranchExists.mockReturnValue(true);
      mockLoadDocsignorePatterns.mockReturnValue([]);
      mockGetChangedFiles.mockReturnValue([]);

      const result = validateDocsUpdate(options);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        hasDocUpdates: false,
        updatedDocFiles: [],
        relevantFiles: [],
        allChangedFiles: [],
      });
      expect(mockGetChangedFiles).toHaveBeenCalledWith({ cwd: '/test/project' });
    });

    it('.docsignoreで全て除外される場合は成功として返す', () => {
      mockCheckMainBranchExists.mockReturnValue(true);
      mockLoadDocsignorePatterns.mockReturnValue(['*.test.ts']);
      mockGetChangedFiles.mockReturnValue(['src/utils.test.ts']);
      mockIsIgnored.mockReturnValue(true);

      const result = validateDocsUpdate(options);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        hasDocUpdates: false,
        updatedDocFiles: [],
        relevantFiles: [],
        allChangedFiles: ['src/utils.test.ts'],
      });
      expect(mockLoadDocsignorePatterns).toHaveBeenCalledWith('/test/project/.docsignore');
    });

    it('ドキュメント更新ありの場合は正しい結果を返す', () => {
      mockCheckMainBranchExists.mockReturnValue(true);
      mockLoadDocsignorePatterns.mockReturnValue([]);
      mockGetChangedFiles.mockReturnValue(['src/index.ts', 'CLAUDE.md', 'docs/README.md']);
      mockIsIgnored.mockReturnValue(false);

      const result = validateDocsUpdate(options);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        hasDocUpdates: true,
        updatedDocFiles: ['CLAUDE.md', 'docs/README.md'],
        relevantFiles: ['src/index.ts', 'CLAUDE.md', 'docs/README.md'],
        allChangedFiles: ['src/index.ts', 'CLAUDE.md', 'docs/README.md'],
      });
    });

    it('ドキュメント未更新の場合は正しい結果を返す', () => {
      mockCheckMainBranchExists.mockReturnValue(true);
      mockLoadDocsignorePatterns.mockReturnValue([]);
      mockGetChangedFiles.mockReturnValue(['src/index.ts', 'backend/api.ts']);
      mockIsIgnored.mockReturnValue(false);

      const result = validateDocsUpdate(options);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        hasDocUpdates: false,
        updatedDocFiles: [],
        relevantFiles: ['src/index.ts', 'backend/api.ts'],
        allChangedFiles: ['src/index.ts', 'backend/api.ts'],
      });
    });

    it('verboseモードで詳細情報を出力する', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockCheckMainBranchExists.mockReturnValue(true);
      mockLoadDocsignorePatterns.mockReturnValue(['*.test.ts']);
      mockGetChangedFiles.mockReturnValue(['src/index.ts']);
      mockIsIgnored.mockReturnValue(false);

      validateDocsUpdate({ ...options, verbose: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '📋 .docsignoreから1個のパターンを読み込みました\n'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('📄 1個のファイルが変更されています\n');

      consoleLogSpy.mockRestore();
    });
  });

  describe('displayResult', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('ドキュメント更新ありの場合にメッセージを表示する', () => {
      const result = {
        success: true,
        exitCode: 0,
        hasDocUpdates: true,
        updatedDocFiles: ['CLAUDE.md', 'docs/README.md'],
        relevantFiles: ['src/index.ts', 'CLAUDE.md', 'docs/README.md'],
        allChangedFiles: ['src/index.ts', 'CLAUDE.md', 'docs/README.md'],
      };

      displayResult(result, false);

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ ドキュメントが更新されています:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  ✓ CLAUDE.md');
      expect(consoleLogSpy).toHaveBeenCalledWith('  ✓ docs/README.md');
    });

    it('ドキュメント未更新の場合に警告メッセージを表示する', () => {
      const result = {
        success: true,
        exitCode: 0,
        hasDocUpdates: false,
        updatedDocFiles: [],
        relevantFiles: ['src/index.ts', 'backend/api.ts'],
        allChangedFiles: ['src/index.ts', 'backend/api.ts'],
      };

      displayResult(result, false);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '⚠️  コードが変更されていますが、ドキュメントは更新されていません\n'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('📝 以下のファイルが変更されています:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  - src/index.ts');
      expect(consoleLogSpy).toHaveBeenCalledWith('  - backend/api.ts');
    });

    it('変更ファイルが10個を超える場合は省略表示する', () => {
      const files = Array.from({ length: 15 }, (_, i) => `file${i}.ts`);
      const result = {
        success: true,
        exitCode: 0,
        hasDocUpdates: false,
        updatedDocFiles: [],
        relevantFiles: files,
        allChangedFiles: files,
      };

      displayResult(result, false);

      expect(consoleLogSpy).toHaveBeenCalledWith('  ... 他 5 ファイル');
    });

    it('verboseモードで変更されたコードファイル一覧を表示する', () => {
      const result = {
        success: true,
        exitCode: 0,
        hasDocUpdates: true,
        updatedDocFiles: ['CLAUDE.md'],
        relevantFiles: ['src/index.ts', 'src/utils.ts', 'CLAUDE.md'],
        allChangedFiles: ['src/index.ts', 'src/utils.ts', 'CLAUDE.md'],
      };

      displayResult(result, true);

      expect(consoleLogSpy).toHaveBeenCalledWith('📝 変更されたコードファイル (3個):');
      expect(consoleLogSpy).toHaveBeenCalledWith('  - src/index.ts');
      expect(consoleLogSpy).toHaveBeenCalledWith('  - src/utils.ts');
      expect(consoleLogSpy).toHaveBeenCalledWith('  - CLAUDE.md');
    });

    it('変更ファイルがない場合はメッセージを表示しない', () => {
      const result = {
        success: true,
        exitCode: 0,
        hasDocUpdates: false,
        updatedDocFiles: [],
        relevantFiles: [],
        allChangedFiles: [],
      };

      displayResult(result, false);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
