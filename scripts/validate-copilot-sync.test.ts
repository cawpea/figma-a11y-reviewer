/**
 * validate-copilot-sync.tsのユニットテスト
 */

import { checkMainBranchExists, getChangedFiles } from './utils/git.utils';
import { validateCopilotSync } from './validate-copilot-sync';

// ユーティリティ関数をモック化
jest.mock('./utils/git.utils');

const mockCheckMainBranchExists = checkMainBranchExists as jest.MockedFunction<
  typeof checkMainBranchExists
>;
const mockGetChangedFiles = getChangedFiles as jest.MockedFunction<typeof getChangedFiles>;

describe('validate-copilot-sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCopilotSync', () => {
    const options = {
      verbose: false,
      projectRoot: '/test/project',
    };

    it('mainブランチが存在しない場合は成功として返す', () => {
      mockCheckMainBranchExists.mockReturnValue(false);

      const result = validateCopilotSync(options);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        claudeUpdated: false,
        copilotUpdated: false,
        needsSync: false,
        changedFiles: [],
      });
    });

    it('差分がない場合は成功として返す', () => {
      mockCheckMainBranchExists.mockReturnValue(true);
      mockGetChangedFiles.mockReturnValue([]);

      const result = validateCopilotSync(options);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        claudeUpdated: false,
        copilotUpdated: false,
        needsSync: false,
        changedFiles: [],
      });
      expect(mockGetChangedFiles).toHaveBeenCalledWith({ cwd: '/test/project' });
    });

    it('CLAUDE.mdとcopilot-instructions.mdの両方が更新されている場合は成功', () => {
      mockCheckMainBranchExists.mockReturnValue(true);
      mockGetChangedFiles.mockReturnValue([
        'CLAUDE.md',
        '.github/copilot-instructions.md',
        'src/index.ts',
      ]);

      const result = validateCopilotSync(options);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        claudeUpdated: true,
        copilotUpdated: true,
        needsSync: false,
        changedFiles: ['CLAUDE.md', '.github/copilot-instructions.md', 'src/index.ts'],
      });
    });

    it('CLAUDE.mdのみ更新されている場合は警告（needsSync: true）', () => {
      mockCheckMainBranchExists.mockReturnValue(true);
      mockGetChangedFiles.mockReturnValue(['CLAUDE.md', 'src/index.ts', 'backend/api.ts']);

      const result = validateCopilotSync(options);

      expect(result).toEqual({
        success: false,
        exitCode: 0, // 警告のみなのでexitCodeは0
        claudeUpdated: true,
        copilotUpdated: false,
        needsSync: true,
        changedFiles: ['CLAUDE.md', 'src/index.ts', 'backend/api.ts'],
      });
    });

    it('copilot-instructions.mdのみ更新されている場合は成功', () => {
      mockCheckMainBranchExists.mockReturnValue(true);
      mockGetChangedFiles.mockReturnValue(['.github/copilot-instructions.md', 'src/index.ts']);

      const result = validateCopilotSync(options);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        claudeUpdated: false,
        copilotUpdated: true,
        needsSync: false,
        changedFiles: ['.github/copilot-instructions.md', 'src/index.ts'],
      });
    });

    it('CLAUDE.mdもcopilot-instructions.mdも更新されていない場合は成功', () => {
      mockCheckMainBranchExists.mockReturnValue(true);
      mockGetChangedFiles.mockReturnValue(['src/index.ts', 'backend/api.ts', 'README.md']);

      const result = validateCopilotSync(options);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        claudeUpdated: false,
        copilotUpdated: false,
        needsSync: false,
        changedFiles: ['src/index.ts', 'backend/api.ts', 'README.md'],
      });
    });

    it('多数のファイルが変更されている場合でも正しく検出する', () => {
      mockCheckMainBranchExists.mockReturnValue(true);
      mockGetChangedFiles.mockReturnValue([
        'src/index.ts',
        'src/utils.ts',
        'backend/api.ts',
        'backend/services.ts',
        'CLAUDE.md',
        'docs/README.md',
        'docs/architecture/overview.md',
        '.github/copilot-instructions.md',
        'figma-plugin/src/main.ts',
        'shared/types.ts',
      ]);

      const result = validateCopilotSync(options);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        claudeUpdated: true,
        copilotUpdated: true,
        needsSync: false,
        changedFiles: expect.arrayContaining(['CLAUDE.md', '.github/copilot-instructions.md']),
      });
      expect(result.changedFiles).toHaveLength(10);
    });

    describe('verboseオプション', () => {
      it('verbose: trueの場合も正しく動作する', () => {
        mockCheckMainBranchExists.mockReturnValue(true);
        mockGetChangedFiles.mockReturnValue(['CLAUDE.md']);

        const result = validateCopilotSync({
          verbose: true,
          projectRoot: '/test/project',
        });

        expect(result).toEqual({
          success: false,
          exitCode: 0,
          claudeUpdated: true,
          copilotUpdated: false,
          needsSync: true,
          changedFiles: ['CLAUDE.md'],
        });
      });

      it('verbose: falseでもmainブランチなしを検出できる', () => {
        mockCheckMainBranchExists.mockReturnValue(false);

        const result = validateCopilotSync({
          verbose: false,
          projectRoot: '/test/project',
        });

        expect(result.success).toBe(true);
        expect(result.needsSync).toBe(false);
      });
    });

    describe('エッジケース', () => {
      it('空の変更リストを処理する', () => {
        mockCheckMainBranchExists.mockReturnValue(true);
        mockGetChangedFiles.mockReturnValue([]);

        const result = validateCopilotSync(options);

        expect(result.success).toBe(true);
        expect(result.changedFiles).toEqual([]);
      });

      it('CLAUDE.mdのみの変更を検出する', () => {
        mockCheckMainBranchExists.mockReturnValue(true);
        mockGetChangedFiles.mockReturnValue(['CLAUDE.md']);

        const result = validateCopilotSync(options);

        expect(result.claudeUpdated).toBe(true);
        expect(result.copilotUpdated).toBe(false);
        expect(result.needsSync).toBe(true);
      });

      it('copilot-instructions.mdのみの変更は問題なし', () => {
        mockCheckMainBranchExists.mockReturnValue(true);
        mockGetChangedFiles.mockReturnValue(['.github/copilot-instructions.md']);

        const result = validateCopilotSync(options);

        expect(result.claudeUpdated).toBe(false);
        expect(result.copilotUpdated).toBe(true);
        expect(result.needsSync).toBe(false);
      });

      it('大文字小文字を区別してファイル名を検出する', () => {
        mockCheckMainBranchExists.mockReturnValue(true);
        mockGetChangedFiles.mockReturnValue(['claude.md', 'CLAUDE.MD']); // 誤ったケース

        const result = validateCopilotSync(options);

        // 正確な "CLAUDE.md" のみを検出すべき
        expect(result.claudeUpdated).toBe(false);
      });
    });

    describe('統合テスト', () => {
      it('典型的な開発フロー: CLAUDE.md更新 → 同期忘れ → 警告', () => {
        mockCheckMainBranchExists.mockReturnValue(true);
        mockGetChangedFiles.mockReturnValue([
          'CLAUDE.md',
          'docs/architecture/overview.md',
          'src/index.ts',
        ]);

        const result = validateCopilotSync(options);

        expect(result.success).toBe(false);
        expect(result.needsSync).toBe(true);
        expect(result.exitCode).toBe(0); // 警告のみなので終了コード0
      });

      it('典型的な開発フロー: CLAUDE.md更新 → 同期実行 → 成功', () => {
        mockCheckMainBranchExists.mockReturnValue(true);
        mockGetChangedFiles.mockReturnValue([
          'CLAUDE.md',
          '.github/copilot-instructions.md',
          'docs/architecture/overview.md',
          'src/index.ts',
        ]);

        const result = validateCopilotSync(options);

        expect(result.success).toBe(true);
        expect(result.needsSync).toBe(false);
        expect(result.exitCode).toBe(0);
      });

      it('通常のコード変更のみ → 成功', () => {
        mockCheckMainBranchExists.mockReturnValue(true);
        mockGetChangedFiles.mockReturnValue([
          'src/index.ts',
          'backend/api.ts',
          'figma-plugin/src/main.ts',
        ]);

        const result = validateCopilotSync(options);

        expect(result.success).toBe(true);
        expect(result.needsSync).toBe(false);
        expect(result.claudeUpdated).toBe(false);
        expect(result.copilotUpdated).toBe(false);
      });
    });
  });
});
