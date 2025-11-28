import * as fs from 'fs';
import * as path from 'path';

import { jest } from '@jest/globals';

import type { CodeRef } from './utils/types';
import { extractCodeRefs, findMarkdownFiles, validateCodeRef } from './validate-docs-code';

// モックの設定
jest.mock('fs');
jest.mock('path');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('validate-docs-code', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // pathのモックを設定
    mockedPath.join.mockImplementation((...args) => args.join('/'));
    mockedPath.resolve.mockImplementation(
      (...args) => '/' + args.filter((arg) => arg !== '..' && arg !== '.').join('/')
    );
    mockedPath.relative.mockImplementation((from, to) => to.replace(from + '/', ''));
  });

  describe('findMarkdownFiles', () => {
    it('マークダウンファイルのみを返すこと', () => {
      // モックデータの設定
      const mockDirents = [
        { name: 'file1.md', isDirectory: () => false, isFile: () => true },
        { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
        { name: 'subdir', isDirectory: () => true, isFile: () => false },
      ];

      const mockSubdirents = [{ name: 'file3.md', isDirectory: () => false, isFile: () => true }];

      mockedFs.readdirSync
        .mockReturnValueOnce(mockDirents as any)
        .mockReturnValueOnce(mockSubdirents as any);

      const result = findMarkdownFiles('/test');

      expect(result).toEqual(['/test/file1.md', '/test/subdir/file3.md']);
      expect(mockedFs.readdirSync).toHaveBeenCalledWith('/test', { withFileTypes: true });
      expect(mockedFs.readdirSync).toHaveBeenCalledWith('/test/subdir', { withFileTypes: true });
    });

    it('空のディレクトリでは空の配列を返すこと', () => {
      mockedFs.readdirSync.mockReturnValue([]);

      const result = findMarkdownFiles('/empty');

      expect(result).toEqual([]);
    });
  });

  describe('extractCodeRefs', () => {
    it('CODE_REFコメントを正しく抽出すること', () => {
      const content = `
# テストドキュメント

<!-- CODE_REF: src/example.ts -->
コードの例：

<!-- CODE_REF: src/example.ts:10-20 -->
特定の行範囲：

<!-- CODE_REF: src/other.js:5-15 -->
他のファイル：
      `;

      const result = extractCodeRefs(content, '/docs/test.md');

      expect(result).toHaveLength(3);

      expect(result[0]).toEqual({
        fullMatch: '<!-- CODE_REF: src/example.ts -->',
        refPath: 'src/example.ts',
        startLine: null,
        endLine: null,
        docFile: '/docs/test.md',
      });

      expect(result[1]).toEqual({
        fullMatch: '<!-- CODE_REF: src/example.ts:10-20 -->',
        refPath: 'src/example.ts',
        startLine: 10,
        endLine: 20,
        docFile: '/docs/test.md',
      });

      expect(result[2]).toEqual({
        fullMatch: '<!-- CODE_REF: src/other.js:5-15 -->',
        refPath: 'src/other.js',
        startLine: 5,
        endLine: 15,
        docFile: '/docs/test.md',
      });
    });

    it('CODE_REFがない場合は空の配列を返すこと', () => {
      const content = `
# テストドキュメント

これは通常のマークダウンファイルです。
      `;

      const result = extractCodeRefs(content, '/docs/test.md');

      expect(result).toEqual([]);
    });

    it('スペースが含まれるCODE_REFを正しく処理すること', () => {
      const content = `<!-- CODE_REF:   src/example.ts   -->`;

      const result = extractCodeRefs(content, '/docs/test.md');

      expect(result).toHaveLength(1);
      expect(result[0].refPath).toBe('src/example.ts');
    });
  });

  describe('validateCodeRef', () => {
    const mockProjectRoot = '/project';

    beforeEach(() => {
      mockedPath.resolve
        .mockImplementationOnce(() => mockProjectRoot) // __dirname, '..'
        .mockImplementation((root, refPath) => `${root}/${refPath}`);
    });

    it('有効なファイル参照では空のエラー配列を返すこと', () => {
      const ref: CodeRef = {
        fullMatch: '<!-- CODE_REF: src/example.ts -->',
        refPath: 'src/example.ts',
        startLine: null,
        endLine: null,
        docFile: '/docs/test.md',
      };

      mockedFs.existsSync.mockReturnValue(true);

      const result = validateCodeRef(ref);

      expect(result).toEqual([]);
    });

    it('存在しないファイルでFILE_NOT_FOUNDエラーを返すこと', () => {
      const ref: CodeRef = {
        fullMatch: '<!-- CODE_REF: src/missing.ts -->',
        refPath: 'src/missing.ts',
        startLine: null,
        endLine: null,
        docFile: '/docs/test.md',
      };

      mockedFs.existsSync.mockReturnValue(false);

      const result = validateCodeRef(ref);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('FILE_NOT_FOUND');
      expect(result[0].message).toBe('参照先のファイルが見つかりません: src/missing.ts');
    });

    it('パストラバーサルでPATH_TRAVERSALエラーを返すこと', () => {
      const ref: CodeRef = {
        fullMatch: '<!-- CODE_REF: ../../../etc/passwd -->',
        refPath: '../../../etc/passwd',
        startLine: null,
        endLine: null,
        docFile: '/docs/test.md',
      };

      mockedPath.resolve.mockImplementation(() => '/etc/passwd'); // プロジェクトルート外

      const result = validateCodeRef(ref);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('PATH_TRAVERSAL');
    });

    it('無効な開始行番号でINVALID_LINE_NUMBERエラーを返すこと', () => {
      const ref: CodeRef = {
        fullMatch: '<!-- CODE_REF: src/example.ts:0-5 -->',
        refPath: 'src/example.ts',
        startLine: 0,
        endLine: 5,
        docFile: '/docs/test.md',
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('line1\nline2\nline3\nline4\nline5\n');

      const result = validateCodeRef(ref);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('INVALID_LINE_NUMBER');
    });

    it('終了行が総行数を超える場合にLINE_OUT_OF_RANGEエラーを返すこと', () => {
      const ref: CodeRef = {
        fullMatch: '<!-- CODE_REF: src/example.ts:1-10 -->',
        refPath: 'src/example.ts',
        startLine: 1,
        endLine: 10,
        docFile: '/docs/test.md',
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('line1\nline2\nline3\n'); // 3行のみ

      const result = validateCodeRef(ref);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('LINE_OUT_OF_RANGE');
    });

    it('開始行が終了行より大きい場合にINVALID_RANGEエラーを返すこと', () => {
      const ref: CodeRef = {
        fullMatch: '<!-- CODE_REF: src/example.ts:10-5 -->',
        refPath: 'src/example.ts',
        startLine: 10,
        endLine: 5,
        docFile: '/docs/test.md',
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\nline11\n'
      );

      const result = validateCodeRef(ref);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('INVALID_RANGE');
    });

    it('ファイル読み込みエラーでREAD_ERRORエラーを返すこと', () => {
      const ref: CodeRef = {
        fullMatch: '<!-- CODE_REF: src/example.ts:1-5 -->',
        refPath: 'src/example.ts',
        startLine: 1,
        endLine: 5,
        docFile: '/docs/test.md',
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = validateCodeRef(ref);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('READ_ERROR');
      expect(result[0].message).toBe('ファイルの読み込みに失敗しました: Permission denied');
    });

    it('有効な行範囲指定では空のエラー配列を返すこと', () => {
      const ref: CodeRef = {
        fullMatch: '<!-- CODE_REF: src/example.ts:1-3 -->',
        refPath: 'src/example.ts',
        startLine: 1,
        endLine: 3,
        docFile: '/docs/test.md',
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('line1\nline2\nline3\nline4\nline5\n');

      const result = validateCodeRef(ref);

      expect(result).toEqual([]);
    });
  });

  describe('統合テスト', () => {
    beforeEach(() => {
      mockedPath.resolve
        .mockImplementationOnce(() => '/project') // __dirname, '..'
        .mockImplementation((root, refPath) => `${root}/${refPath}`);
    });

    it('複数のエラータイプを同時に検出すること', () => {
      // パストラバーサル + ファイル不存在の組み合わせ
      const ref: CodeRef = {
        fullMatch: '<!-- CODE_REF: ../../../etc/passwd -->',
        refPath: '../../../etc/passwd',
        startLine: 1,
        endLine: 5,
        docFile: '/docs/test.md',
      };

      mockedPath.resolve.mockImplementation(() => '/etc/passwd');

      const result = validateCodeRef(ref);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('PATH_TRAVERSAL');
    });

    it('CODE_REF正規表現パターンが正しく動作すること', () => {
      const testCases = [
        {
          input: '<!-- CODE_REF: src/example.ts -->',
          expected: { refPath: 'src/example.ts', startLine: null, endLine: null },
        },
        {
          input: '<!-- CODE_REF: src/example.ts:10-20 -->',
          expected: { refPath: 'src/example.ts', startLine: 10, endLine: 20 },
        },
        {
          input: '<!--CODE_REF:src/example.ts:5-15-->',
          expected: { refPath: 'src/example.ts', startLine: 5, endLine: 15 },
        },
        {
          input: '<!--   CODE_REF:   src/example.ts   -->',
          expected: { refPath: 'src/example.ts', startLine: null, endLine: null },
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = extractCodeRefs(input, '/test.md');
        expect(result).toHaveLength(1);
        expect(result[0].refPath).toBe(expected.refPath);
        expect(result[0].startLine).toBe(expected.startLine);
        expect(result[0].endLine).toBe(expected.endLine);
      });
    });

    it('エッジケースの正規表現パターンを正しく処理すること', () => {
      const testCases = [
        {
          input: '<!-- CODE_REF: src/example.ts -->',
          expected: { refPath: 'src/example.ts', startLine: null, endLine: null },
        },
        {
          input: '<!-- CODE_REF: src/example.ts:10-20 -->',
          expected: { refPath: 'src/example.ts', startLine: 10, endLine: 20 },
        },
        {
          input: '<!--CODE_REF:src/example.ts:5-15-->',
          expected: { refPath: 'src/example.ts', startLine: 5, endLine: 15 },
        },
        {
          input: '<!--   CODE_REF:   src/example.ts   -->',
          expected: { refPath: 'src/example.ts', startLine: null, endLine: null },
        },
        {
          input: '<!-- CODE_REF: path/with spaces/file.ts:1-2 -->',
          expected: { refPath: 'path/with spaces/file.ts', startLine: 1, endLine: 2 },
        },
        {
          input: '<!-- CODE_REF: file-with-dashes.ts -->',
          expected: { refPath: 'file-with-dashes.ts', startLine: null, endLine: null },
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = extractCodeRefs(input, '/test.md');
        expect(result).toHaveLength(1);
        expect(result[0].refPath).toBe(expected.refPath);
        expect(result[0].startLine).toBe(expected.startLine);
        expect(result[0].endLine).toBe(expected.endLine);
      });
    });

    it('複数のCODE_REFが同一ドキュメント内にある場合を処理すること', () => {
      const content = `
# ドキュメント

<!-- CODE_REF: src/a.ts -->
<!-- CODE_REF: src/b.ts:5-10 -->
<!-- CODE_REF: src/c.js -->

テキストの間に

<!-- CODE_REF: src/d.ts:1-5 -->
      `;

      const result = extractCodeRefs(content, '/docs/multiple.md');

      expect(result).toHaveLength(4);
      expect(result[0].refPath).toBe('src/a.ts');
      expect(result[1].refPath).toBe('src/b.ts');
      expect(result[2].refPath).toBe('src/c.js');
      expect(result[3].refPath).toBe('src/d.ts');
    });
  });
});
