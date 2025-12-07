import type { ScreenshotData } from '@shared/types';

/**
 * Uint8ArrayをBase64文字列に変換
 * Figmaプラグイン環境でbtoaが使えないため、手動実装
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;

  // 3バイトずつ処理（Base64は3バイト→4文字）
  for (i = 0; i < buffer.length - 2; i += 3) {
    const byte1 = buffer[i];
    const byte2 = buffer[i + 1];
    const byte3 = buffer[i + 2];

    result += base64Chars[byte1 >> 2];
    result += base64Chars[((byte1 & 0x03) << 4) | (byte2 >> 4)];
    result += base64Chars[((byte2 & 0x0f) << 2) | (byte3 >> 6)];
    result += base64Chars[byte3 & 0x3f];
  }

  // 残りのバイトを処理（パディング）
  const remaining = buffer.length - i;
  if (remaining === 1) {
    const byte1 = buffer[i];
    result += base64Chars[byte1 >> 2];
    result += base64Chars[(byte1 & 0x03) << 4];
    result += '==';
  } else if (remaining === 2) {
    const byte1 = buffer[i];
    const byte2 = buffer[i + 1];
    result += base64Chars[byte1 >> 2];
    result += base64Chars[((byte1 & 0x03) << 4) | (byte2 >> 4)];
    result += base64Chars[(byte2 & 0x0f) << 2];
    result += '=';
  }

  return result;
}

/**
 * ノードのスクリーンショットを取得
 * @param node - スクリーンショットを取得するノード
 * @returns Base64エンコードされた画像データとメタデータ、失敗時はnull
 */
export async function captureNodeScreenshot(node: SceneNode): Promise<ScreenshotData | null> {
  try {
    console.log('📸 Capturing screenshot for node:', node.name);

    // 解像度0.5でPNG形式でエクスポート（ファイルサイズ削減のため）
    const imageBytes = await node.exportAsync({
      format: 'PNG',
      constraint: { type: 'SCALE', value: 0.5 },
    });

    // 5KBを超える場合は警告
    const MAX_IMAGE_SIZE_LIMIT = 1024 * 1024; // 1MB
    if (imageBytes.byteLength > MAX_IMAGE_SIZE_LIMIT) {
      console.warn('⚠️ Screenshot size exceeds 1MB:', imageBytes.byteLength, 'bytes');
      return null;
    }

    // Uint8ArrayをBase64に変換
    const base64 = arrayBufferToBase64(imageBytes);
    const dataUrl = `data:image/png;base64,${base64}`;

    const screenshotData: ScreenshotData = {
      imageData: dataUrl,
      nodeName: node.name,
      nodeId: node.id,
      byteSize: imageBytes.byteLength,
    };

    console.log(`✅ Screenshot captured: ${(imageBytes.byteLength / 1024).toFixed(2)} KB`);

    return screenshotData;
  } catch (error) {
    console.error('❌ Failed to capture screenshot');
    console.error('   Error details:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
    console.error('   Node type:', node.type);
    console.error('   Node name:', node.name);
    // エラーでも評価は継続するため、nullを返す
    return null;
  }
}
