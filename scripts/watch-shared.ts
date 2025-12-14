#!/usr/bin/env tsx

/**
 * shared/src/ の変更を監視して figma-plugin/src/shared/ に自動コピーするスクリプト
 *
 * 使用方法:
 *   tsx scripts/watch-shared.ts
 *   npm run watch:shared
 *
 * 注意: このスクリプトは figma-plugin のウォッチモード専用です
 */

import * as fs from 'fs';
import * as path from 'path';

import { copySharedToProject } from './copy-shared';

// 設定
const PROJECT_ROOT = path.join(__dirname, '..');
const SHARED_SRC = path.join(PROJECT_ROOT, 'shared', 'src');
const TARGET_PROJECT = 'figma-plugin';

// Debounce設定
const DEBOUNCE_DELAY = 500; // ms
let debounceTimer: NodeJS.Timeout | null = null;

/**
 * Debounce処理を使ってコピーを実行
 */
function debouncedCopy(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    console.log('\n🔄 Detected changes in shared/src/...');
    try {
      copySharedToProject(TARGET_PROJECT);
    } catch (error) {
      console.error('❌ Auto-copy failed:', error);
    }
  }, DEBOUNCE_DELAY);
}

/**
 * メイン処理
 */
function main(): void {
  console.log('👀 Watching shared/src/ for changes...');
  console.log(`   Source: ${SHARED_SRC}`);
  console.log(`   Target: ${TARGET_PROJECT}/src/shared/`);
  console.log('\n   Press Ctrl+C to stop\n');

  // shared/src/ が存在するかチェック
  if (!fs.existsSync(SHARED_SRC)) {
    console.error(`\n❌ Error: Source directory not found: ${SHARED_SRC}`);
    process.exit(1);
  }

  // 初回コピー
  try {
    copySharedToProject(TARGET_PROJECT);
  } catch (error) {
    console.error('❌ Initial copy failed:', error);
    process.exit(1);
  }

  // ファイル変更を監視
  try {
    fs.watch(SHARED_SRC, { recursive: true }, (eventType: string, filename: string | null) => {
      if (filename) {
        console.log(`   📝 ${eventType}: ${filename}`);
        debouncedCopy();
      }
    });
  } catch (error) {
    console.error('\n❌ Error setting up file watcher:', error);
    process.exit(1);
  }

  // プロセス終了時のクリーンアップ
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping watcher...\n');
    process.exit(0);
  });
}

// スクリプトとして実行された場合のみメイン処理を実行
if (require.main === module) {
  main();
}
