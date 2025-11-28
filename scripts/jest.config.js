/** @type {import('jest').Config} */
module.exports = {
  // TypeScript変換にts-jestを使用
  preset: 'ts-jest',
  testEnvironment: 'node',

  // ルートディレクトリ
  rootDir: '.',

  // テストファイルのパターン
  testMatch: ['**/*.test.ts'],

  // カバレッジ対象
  collectCoverageFrom: ['utils/**/*.ts', '!utils/**/*.d.ts', '!**/*.test.ts'],

  // カバレッジディレクトリ
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // カバレッジ閾値
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // タイムアウト設定
  testTimeout: 5000,

  // 詳細な出力
  verbose: true,

  // 並列実行の制御
  maxWorkers: '50%',

  // TypeScript変換設定
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
};
