/**
 * Jest グローバルセットアップファイル
 * すべてのテストファイルで実行される前に読み込まれる
 */

import '@testing-library/jest-dom';

// Figma APIのモック
global.figma = {
  ui: {
    onmessage: null,
    postMessage: jest.fn(),
    resize: jest.fn(),
    close: jest.fn(),
  },
  currentPage: {
    selection: [],
  },
  notify: jest.fn(),
  closePlugin: jest.fn(),
  showUI: jest.fn(),
  command: '',
  viewport: {
    center: { x: 0, y: 0 },
    zoom: 1,
  },
  root: {
    children: [],
  } as any,
} as any;

// @create-figma-plugin/utilities のモック
jest.mock('@create-figma-plugin/utilities', () => ({
  emit: jest.fn(),
  on: jest.fn(() => jest.fn()), // unsubscribe function
  once: jest.fn(),
  showUI: jest.fn(),
}));

// コンソール出力の抑制（テスト結果を見やすくするため）
global.console = {
  ...console,
  log: jest.fn(), // console.logは抑制
  debug: jest.fn(), // console.debugも抑制
  // エラーと警告は表示
  error: console.error,
  warn: console.warn,
};
