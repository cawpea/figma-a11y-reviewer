import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

import type { ScreenshotData } from '@shared/types';

const logsDir = join(__dirname, '../../logs');
const screenshotsDir = join(logsDir, 'screenshots');

/**
 * スクリーンショットをファイルに保存
 * @param screenshot - スクリーンショットデータ
 */
export function saveScreenshot(screenshot: ScreenshotData): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    // screenshotsディレクトリが存在しない場合は作成
    if (!existsSync(screenshotsDir)) {
      mkdirSync(screenshotsDir, { recursive: true });
      console.log('📁 Created screenshots directory:', screenshotsDir);
    }

    // タイムスタンプ付きファイル名
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const nodeName = screenshot.nodeName.replace(/[^a-zA-Z0-9]/g, '_'); // 安全なファイル名に変換
    const filename = `screenshot-${nodeName}-${timestamp}.png`;
    const filepath = join(screenshotsDir, filename);

    // Base64からバイナリデータを抽出
    const base64Data = screenshot.imageData.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // ファイルに保存
    writeFileSync(filepath, buffer);

    console.log(`✅ Screenshot saved to: logs/screenshots/${filename}`);
    console.log(`   Node: ${screenshot.nodeName} (ID: ${screenshot.nodeId})`);
    console.log(`   Size: ${(screenshot.byteSize / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Failed to save screenshot file:', error);
  }
}

/**
 * 古いスクリーンショットファイルを削除（7日以上前のファイル）
 */
export function cleanupOldScreenshots(): void {
  try {
    if (!existsSync(screenshotsDir)) return;

    const files = readdirSync(screenshotsDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7日

    let deletedCount = 0;
    files.forEach((file) => {
      if (!file.startsWith('screenshot-')) return;

      const filepath = join(screenshotsDir, file);
      const stats = statSync(filepath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        unlinkSync(filepath);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`🗑️  Cleaned up ${deletedCount} old screenshot files`);
    }
  } catch (error) {
    console.error('Failed to cleanup old screenshot files:', error);
  }
}
