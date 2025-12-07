import { captureNodeScreenshot } from './screenshot';

describe('screenshot', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    // コンソール出力をスパイ
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // モックをリセット
    jest.clearAllMocks();
  });

  afterEach(() => {
    // コンソールスパイを復元
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('captureNodeScreenshot', () => {
    it('スクリーンショットを正常に取得する', async () => {
      // 小さな1x1ピクセルの透明PNG画像（67バイト）
      const mockImageBytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
        0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
        0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00,
        0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const mockNode = {
        id: '1:1',
        name: 'Test Button',
        type: 'FRAME',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).not.toBeNull();
      expect(result?.nodeName).toBe('Test Button');
      expect(result?.nodeId).toBe('1:1');
      expect(result?.byteSize).toBe(67);
      expect(result?.imageData).toContain('data:image/png;base64,');
      expect(mockNode.exportAsync).toHaveBeenCalledWith({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 0.5 },
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '📸 Capturing screenshot for node:',
        'Test Button'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Screenshot captured: 0.07 KB');
    });

    it('Base64エンコードが正しく動作する（3バイト境界）', async () => {
      // 3バイトのデータ（Base64で4文字になる）
      const mockImageBytes = new Uint8Array([0x61, 0x62, 0x63]); // "abc"

      const mockNode = {
        id: '1:1',
        name: 'Test Node',
        type: 'FRAME',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).not.toBeNull();
      // "abc" -> Base64: "YWJj"
      expect(result?.imageData).toBe('data:image/png;base64,YWJj');
      expect(result?.byteSize).toBe(3);
    });

    it('Base64エンコードが正しく動作する（残り1バイト、パディング==）', async () => {
      // 1バイトのデータ（Base64で2文字+パディング==）
      const mockImageBytes = new Uint8Array([0x61]); // "a"

      const mockNode = {
        id: '1:1',
        name: 'Test Node',
        type: 'FRAME',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).not.toBeNull();
      // "a" -> Base64: "YQ=="
      expect(result?.imageData).toBe('data:image/png;base64,YQ==');
      expect(result?.byteSize).toBe(1);
    });

    it('Base64エンコードが正しく動作する（残り2バイト、パディング=）', async () => {
      // 2バイトのデータ（Base64で3文字+パディング=）
      const mockImageBytes = new Uint8Array([0x61, 0x62]); // "ab"

      const mockNode = {
        id: '1:1',
        name: 'Test Node',
        type: 'FRAME',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).not.toBeNull();
      // "ab" -> Base64: "YWI="
      expect(result?.imageData).toBe('data:image/png;base64,YWI=');
      expect(result?.byteSize).toBe(2);
    });

    it('Base64エンコードが正しく動作する（長いデータ）', async () => {
      // 10バイトのデータ
      const mockImageBytes = new Uint8Array([
        0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x57, 0x6f, 0x72, 0x6c, 0x64,
      ]); // "HelloWorld"

      const mockNode = {
        id: '1:1',
        name: 'Test Node',
        type: 'FRAME',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).not.toBeNull();
      // "HelloWorld" -> Base64: "SGVsbG9Xb3JsZA=="
      expect(result?.imageData).toBe('data:image/png;base64,SGVsbG9Xb3JsZA==');
      expect(result?.byteSize).toBe(10);
    });

    it('空のバイト配列を処理する', async () => {
      const mockImageBytes = new Uint8Array([]);

      const mockNode = {
        id: '1:1',
        name: 'Empty Node',
        type: 'FRAME',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).not.toBeNull();
      expect(result?.imageData).toBe('data:image/png;base64,');
      expect(result?.byteSize).toBe(0);
    });

    it('1MB以下の画像は正常に処理する', async () => {
      // 1MB - 1バイト（1048575バイト）
      const mockImageBytes = new Uint8Array(1024 * 1024 - 1);
      mockImageBytes.fill(0xff);

      const mockNode = {
        id: '1:1',
        name: 'Large Image',
        type: 'FRAME',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).not.toBeNull();
      expect(result?.byteSize).toBe(1024 * 1024 - 1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('1MBを超える画像の場合はnullを返し警告を出す', async () => {
      // 1MB + 1バイト（1048577バイト）
      const mockImageBytes = new Uint8Array(1024 * 1024 + 1);
      mockImageBytes.fill(0xff);

      const mockNode = {
        id: '1:1',
        name: 'Too Large Image',
        type: 'FRAME',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Screenshot size exceeds 1MB:',
        1024 * 1024 + 1,
        'bytes'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '📸 Capturing screenshot for node:',
        'Too Large Image'
      );
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('✅ Screenshot captured')
      );
    });

    it('ちょうど1MBの画像の場合は正常に処理する', async () => {
      // ちょうど1MB（1048576バイト）- コードでは > を使用しているため、1MBちょうどは許容される
      const mockImageBytes = new Uint8Array(1024 * 1024);
      mockImageBytes.fill(0xff);

      const mockNode = {
        id: '1:1',
        name: 'Exactly 1MB Image',
        type: 'FRAME',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).not.toBeNull();
      expect(result?.byteSize).toBe(1024 * 1024);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Screenshot captured: 1024.00 KB');
    });

    it('exportAsyncでエラーが発生した場合はnullを返す', async () => {
      const error = new Error('Export failed');
      const mockNode = {
        id: '1:1',
        name: 'Error Node',
        type: 'FRAME',
        exportAsync: jest.fn().mockRejectedValue(error),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to capture screenshot');
      expect(consoleErrorSpy).toHaveBeenCalledWith('   Error details:', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('   Error message:', 'Export failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('   Error stack:', expect.any(String));
      expect(consoleErrorSpy).toHaveBeenCalledWith('   Node type:', 'FRAME');
      expect(consoleErrorSpy).toHaveBeenCalledWith('   Node name:', 'Error Node');
    });

    it('exportAsyncで非Errorオブジェクトがスローされた場合でも処理する', async () => {
      const errorMessage = 'String error';
      const mockNode = {
        id: '1:1',
        name: 'Error Node',
        type: 'FRAME',
        exportAsync: jest.fn().mockRejectedValue(errorMessage),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to capture screenshot');
      expect(consoleErrorSpy).toHaveBeenCalledWith('   Error details:', errorMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith('   Node type:', 'FRAME');
      expect(consoleErrorSpy).toHaveBeenCalledWith('   Node name:', 'Error Node');
      // Error message and stack should not be logged for non-Error objects
      expect(consoleErrorSpy).not.toHaveBeenCalledWith('   Error message:', expect.anything());
      expect(consoleErrorSpy).not.toHaveBeenCalledWith('   Error stack:', expect.anything());
    });

    it('ノード名とIDが正しくScreenshotDataに含まれる', async () => {
      const mockImageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

      const mockNode = {
        id: '123:456',
        name: 'My Custom Button',
        type: 'COMPONENT',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).not.toBeNull();
      expect(result?.nodeName).toBe('My Custom Button');
      expect(result?.nodeId).toBe('123:456');
      expect(result?.byteSize).toBe(4);
    });

    it('異なるノードタイプでも動作する', async () => {
      const mockImageBytes = new Uint8Array([0x00, 0x01, 0x02]);

      const mockNode = {
        id: '1:1',
        name: 'Test Rectangle',
        type: 'RECTANGLE',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).not.toBeNull();
      expect(result?.nodeName).toBe('Test Rectangle');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '📸 Capturing screenshot for node:',
        'Test Rectangle'
      );
    });

    it('Base64エンコードで特殊文字が正しく処理される', async () => {
      // すべてのBase64文字セットをカバーするデータ
      const mockImageBytes = new Uint8Array([
        0x00, 0x10, 0x83, 0x10, 0x51, 0x87, 0x20, 0x92, 0x8b, 0x30, 0xd3, 0x8f, 0x41, 0x14, 0x93,
        0x51, 0x55, 0x97, 0x61, 0x96, 0x9b, 0x71, 0xd7, 0x9f, 0x82, 0x18, 0xa3, 0x92, 0x59, 0xa7,
        0xa2, 0x9a, 0xab, 0xb2, 0xdb, 0xaf, 0xc3, 0x1c, 0xb3, 0xd3, 0x5d, 0xb7, 0xe3, 0x9e, 0xbb,
        0xf3, 0xdf, 0xbf,
      ]);

      const mockNode = {
        id: '1:1',
        name: 'Test Node',
        type: 'FRAME',
        exportAsync: jest.fn().mockResolvedValue(mockImageBytes),
      } as any;

      const result = await captureNodeScreenshot(mockNode);

      expect(result).not.toBeNull();
      expect(result?.imageData).toContain('data:image/png;base64,');
      // Base64文字セット（A-Z, a-z, 0-9, +, /）のみが含まれることを確認
      const base64Part = result?.imageData.split(',')[1] || '';
      expect(base64Part).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });
});
