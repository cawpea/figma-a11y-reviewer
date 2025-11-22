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
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // エントリーポイントは除外
    '!src/test-setup.ts',
  ],

  // カバレッジディレクトリ
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // カバレッジ閾値
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },

  // パスエイリアスの解決（tsconfig.jsonと同期）
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
  },

  // setup ファイル
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],

  // タイムアウト設定（API呼び出しを考慮）
  testTimeout: 10000,

  // 詳細な出力
  verbose: true,

  // 並列実行の制御
  maxWorkers: '50%',

  // TypeScript変換設定
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },
};
