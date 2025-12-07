import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ScreenshotData } from '@shared/types';

import { cleanupOldScreenshots, saveScreenshot } from './screenshot';

// fsモジュールをモック
jest.mock('fs');

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockMkdirSync = mkdirSync as jest.MockedFunction<typeof mkdirSync>;
const mockWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>;
const mockReaddirSync = readdirSync as jest.MockedFunction<typeof readdirSync>;
const mockStatSync = statSync as jest.MockedFunction<typeof statSync>;
const mockUnlinkSync = unlinkSync as jest.MockedFunction<typeof unlinkSync>;

describe('screenshot', () => {
  const originalEnv = process.env.NODE_ENV;

  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    // コンソール出力をスパイ
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // モックをリセット
    jest.clearAllMocks();
  });

  afterEach(() => {
    // 環境変数を元に戻す
    process.env.NODE_ENV = originalEnv;

    // コンソールスパイを復元
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('saveScreenshot', () => {
    const mockScreenshot: ScreenshotData = {
      imageData:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      nodeName: 'Test Button',
      nodeId: '1:1',
      byteSize: 1024,
    };

    it('開発環境でスクリーンショットを保存する', () => {
      process.env.NODE_ENV = 'development';
      mockExistsSync.mockReturnValue(true);

      saveScreenshot(mockScreenshot);

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const writeCall = mockWriteFileSync.mock.calls[0];
      expect(writeCall[0]).toContain('screenshot-Test_Button-');
      expect(writeCall[0]).toContain('.png');
      expect(Buffer.isBuffer(writeCall[1])).toBe(true);
    });

    it('本番環境では何もしない', () => {
      process.env.NODE_ENV = 'production';

      saveScreenshot(mockScreenshot);

      expect(mockExistsSync).not.toHaveBeenCalled();
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it('screenshotsディレクトリが存在しない場合は作成する', () => {
      process.env.NODE_ENV = 'development';
      mockExistsSync.mockReturnValue(false);

      saveScreenshot(mockScreenshot);

      expect(mockMkdirSync).toHaveBeenCalledTimes(1);
      expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('📁 Created screenshots directory:'),
        expect.any(String)
      );
    });

    it('ノード名を安全なファイル名に変換する', () => {
      process.env.NODE_ENV = 'development';
      mockExistsSync.mockReturnValue(true);

      const screenshotWithSpecialChars: ScreenshotData = {
        ...mockScreenshot,
        nodeName: 'Button/Component #1 @2x',
      };

      saveScreenshot(screenshotWithSpecialChars);

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const writeCall = mockWriteFileSync.mock.calls[0];
      const filepath = writeCall[0] as string;
      const filename = filepath.split('/').pop() || '';

      expect(filename).toContain('screenshot-Button_Component__1__2x-');
      expect(filename).not.toContain('/');
      expect(filename).not.toContain('#');
      expect(filename).not.toContain('@');
    });

    it('Base64データを正しくバイナリに変換する', () => {
      process.env.NODE_ENV = 'development';
      mockExistsSync.mockReturnValue(true);

      saveScreenshot(mockScreenshot);

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const writeCall = mockWriteFileSync.mock.calls[0];
      const buffer = writeCall[1] as Buffer;

      // Base64デコード後のバッファが正しいことを確認
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('保存成功後にログを出力する', () => {
      process.env.NODE_ENV = 'development';
      mockExistsSync.mockReturnValue(true);

      saveScreenshot(mockScreenshot);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Screenshot saved to:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Node: Test Button \(ID: 1:1\)/)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Size: \d+\.\d+ KB/));
    });

    it('エラーが発生した場合にエラーログを出力する', () => {
      process.env.NODE_ENV = 'development';
      mockExistsSync.mockReturnValue(true);
      const error = new Error('Write failed');
      mockWriteFileSync.mockImplementation(() => {
        throw error;
      });

      saveScreenshot(mockScreenshot);

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to save screenshot file:', error);
    });

    it('data:image/png;base64,プレフィックスを正しく除去する', () => {
      process.env.NODE_ENV = 'development';
      mockExistsSync.mockReturnValue(true);

      const base64Data =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const screenshotWithPrefix: ScreenshotData = {
        ...mockScreenshot,
        imageData: `data:image/png;base64,${base64Data}`,
      };

      saveScreenshot(screenshotWithPrefix);

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const writeCall = mockWriteFileSync.mock.calls[0];
      const buffer = writeCall[1] as Buffer;

      // プレフィックスが除去され、正しいBase64データのみがデコードされることを確認
      const expectedBuffer = Buffer.from(base64Data, 'base64');
      expect(buffer.equals(expectedBuffer)).toBe(true);
    });
  });

  describe('cleanupOldScreenshots', () => {
    const logsDir = join(__dirname, '../../logs');
    const screenshotsDir = join(logsDir, 'screenshots');

    it('7日以上前のファイルを削除する', () => {
      const now = Date.now();
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        'screenshot-old-file.png',
        'screenshot-recent-file.png',
      ] as any);
      mockStatSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('old')) {
          return { mtimeMs: eightDaysAgo } as any;
        }
        return { mtimeMs: now } as any;
      });

      cleanupOldScreenshots();

      expect(mockUnlinkSync).toHaveBeenCalledTimes(1);
      expect(mockUnlinkSync).toHaveBeenCalledWith(join(screenshotsDir, 'screenshot-old-file.png'));
      expect(consoleLogSpy).toHaveBeenCalledWith('🗑️  Cleaned up 1 old screenshot files');
    });

    it('7日以内のファイルは削除しない', () => {
      const now = Date.now();
      const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['screenshot-recent-file.png'] as any);
      mockStatSync.mockReturnValue({ mtimeMs: sixDaysAgo } as any);

      cleanupOldScreenshots();

      expect(mockUnlinkSync).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('screenshotsディレクトリが存在しない場合は何もしない', () => {
      mockExistsSync.mockReturnValue(false);

      cleanupOldScreenshots();

      expect(mockReaddirSync).not.toHaveBeenCalled();
      expect(mockUnlinkSync).not.toHaveBeenCalled();
    });

    it('screenshot-で始まらないファイルはスキップする', () => {
      const now = Date.now();
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        'screenshot-old.png',
        'other-file.png',
        'screenshot-recent.png',
      ] as any);
      mockStatSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('old')) {
          return { mtimeMs: eightDaysAgo } as any;
        }
        return { mtimeMs: now } as any;
      });

      cleanupOldScreenshots();

      expect(mockUnlinkSync).toHaveBeenCalledTimes(1);
      expect(mockUnlinkSync).toHaveBeenCalledWith(join(screenshotsDir, 'screenshot-old.png'));
    });

    it('複数の古いファイルを削除する', () => {
      const now = Date.now();
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        'screenshot-old1.png',
        'screenshot-old2.png',
        'screenshot-old3.png',
      ] as any);
      mockStatSync.mockReturnValue({ mtimeMs: eightDaysAgo } as any);

      cleanupOldScreenshots();

      expect(mockUnlinkSync).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).toHaveBeenCalledWith('🗑️  Cleaned up 3 old screenshot files');
    });

    it('エラーが発生した場合にエラーログを出力する', () => {
      const error = new Error('Failed to read directory');
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockImplementation(() => {
        throw error;
      });

      cleanupOldScreenshots();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to cleanup old screenshot files:',
        error
      );
    });

    it('ファイル削除中のエラーを処理する', () => {
      const now = Date.now();
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
      const error = new Error('Permission denied');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['screenshot-old.png'] as any);
      mockStatSync.mockReturnValue({ mtimeMs: eightDaysAgo } as any);
      mockUnlinkSync.mockImplementation(() => {
        throw error;
      });

      cleanupOldScreenshots();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to cleanup old screenshot files:',
        error
      );
    });

    it('ちょうど7日前のファイルは削除しない', () => {
      const now = Date.now();
      const exactlySevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['screenshot-seven-days.png'] as any);
      mockStatSync.mockReturnValue({ mtimeMs: exactlySevenDaysAgo } as any);

      cleanupOldScreenshots();

      expect(mockUnlinkSync).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
