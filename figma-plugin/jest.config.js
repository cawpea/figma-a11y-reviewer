/** @type {import('jest').Config} */
module.exports = {
  // TypeScript変換にts-jestを使用
  preset: 'ts-jest',

  // DOM環境でテスト（Preactコンポーネント用）
  testEnvironment: 'jsdom',

  // ルートディレクトリ
  rootDir: '.',

  // テストファイルのパターン
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],

  // カバレッジ対象
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.ts', // Figma Plugin APIに依存するため除外
    '!src/ui.tsx', // エントリーポイント
    '!src/output.css',
    '!src/input.css',
    '!src/test-setup.ts',
  ],

  // カバレッジ設定
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // カバレッジ閾値
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // パスエイリアスとPreact aliasing
  moduleNameMapper: {
    // Preact aliasing (重要: PreactをReactとして扱う)
    '^react$': 'preact/compat',
    '^react-dom/test-utils$': 'preact/test-utils',
    '^react-dom$': 'preact/compat',
    '^react/jsx-runtime$': 'preact/jsx-runtime',
    // 共有型定義
    '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
    // CSS/TailwindCSSのモック
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // ESMモジュールの変換設定
  transformIgnorePatterns: ['node_modules/(?!(@testing-library|preact|@create-figma-plugin)/)'],

  // TypeScript変換設定
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
    '^.+\\.(js|jsx|mjs)$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
      },
    ],
  },

  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],

  // タイムアウト
  testTimeout: 5000,

  // 詳細な出力
  verbose: true,

  // 並列実行の制御
  maxWorkers: '50%',

  // Figma APIのグローバル変数
  globals: {
    figma: true,
  },
};
