"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveScreenshot = saveScreenshot;
exports.cleanupOldScreenshots = cleanupOldScreenshots;
const fs_1 = require("fs");
const path_1 = require("path");
const logsDir = (0, path_1.join)(__dirname, '../../logs');
const screenshotsDir = (0, path_1.join)(logsDir, 'screenshots');
/**
 * スクリーンショットをファイルに保存
 * @param screenshot - スクリーンショットデータ
 */
function saveScreenshot(screenshot) {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }
    try {
        // screenshotsディレクトリが存在しない場合は作成
        if (!(0, fs_1.existsSync)(screenshotsDir)) {
            (0, fs_1.mkdirSync)(screenshotsDir, { recursive: true });
            console.log('📁 Created screenshots directory:', screenshotsDir);
        }
        // タイムスタンプ付きファイル名
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        const nodeName = screenshot.nodeName.replace(/[^a-zA-Z0-9]/g, '_'); // 安全なファイル名に変換
        const filename = `screenshot-${nodeName}-${timestamp}.png`;
        const filepath = (0, path_1.join)(screenshotsDir, filename);
        // Base64からバイナリデータを抽出
        const base64Data = screenshot.imageData.replace(/^data:image\/png;base64,/, '');
        // Base64文字列の形式を検証
        if (!base64Data || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
            throw new Error('Invalid Base64 format in screenshot data');
        }
        // Base64デコード
        const buffer = Buffer.from(base64Data, 'base64');
        // デコード結果の検証
        if (buffer.length === 0) {
            throw new Error('Base64 decoding resulted in empty buffer');
        }
        // ファイルに保存
        (0, fs_1.writeFileSync)(filepath, buffer);
        console.log(`✅ Screenshot saved to: logs/screenshots/${filename}`);
        console.log(`   Node: ${screenshot.nodeName} (ID: ${screenshot.nodeId})`);
        console.log(`   Size: ${(screenshot.byteSize / 1024).toFixed(2)} KB`);
    }
    catch (error) {
        console.error('❌ Failed to save screenshot file:', error);
    }
}
/**
 * 古いスクリーンショットファイルを削除（7日以上前のファイル）
 */
function cleanupOldScreenshots() {
    try {
        if (!(0, fs_1.existsSync)(screenshotsDir))
            return;
        const files = (0, fs_1.readdirSync)(screenshotsDir);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7日
        let deletedCount = 0;
        files.forEach((file) => {
            if (!file.startsWith('screenshot-'))
                return;
            const filepath = (0, path_1.join)(screenshotsDir, file);
            const stats = (0, fs_1.statSync)(filepath);
            const age = now - stats.mtimeMs;
            if (age > maxAge) {
                (0, fs_1.unlinkSync)(filepath);
                deletedCount++;
            }
        });
        if (deletedCount > 0) {
            console.log(`🗑️  Cleaned up ${deletedCount} old screenshot files`);
        }
    }
    catch (error) {
        console.error('Failed to cleanup old screenshot files:', error);
    }
}
