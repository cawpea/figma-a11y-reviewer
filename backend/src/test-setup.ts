/**
 * Jest グローバルセットアップファイル
 * すべてのテストファイルで実行される前に読み込まれる
 */

// 環境変数のモック
process.env.ANTHROPIC_API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';

// Claude API (@anthropic-ai/sdk) のモック
jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    id: 'msg_test123',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          score: 85,
          issues: [],
          positives: ['Good design'],
        }),
      },
    ],
    model: 'claude-sonnet-4-20250514',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 100,
      output_tokens: 50,
    },
  });

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: mockCreate,
      },
    })),
  };
});

// ファイルシステム操作のモック（debug.ts用）
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue([]),
  unlink: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({
    mtime: new Date(),
  }),
}));

// コンソール出力の抑制（テスト結果を見やすくするため）
global.console = {
  ...console,
  log: jest.fn(), // console.logは抑制
  debug: jest.fn(), // console.debugも抑制
  info: jest.fn(), // console.infoも抑制
  // エラーと警告は表示
  error: console.error,
  warn: console.warn,
};
