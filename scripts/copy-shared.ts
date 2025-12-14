#!/usr/bin/env tsx

/**
 * shared/src/ を backend/src/shared/ または figma-plugin/src/shared/ にコピーするスクリプト
 *
 * 使用方法:
 *   # 単発コピー
 *   tsx scripts/copy-shared.ts backend
 *   tsx scripts/copy-shared.ts figma-plugin
 *   npm run copy:shared backend
 *   npm run copy:shared figma-plugin
 *
 *   # ウォッチモード（変更を監視して自動コピー）
 *   tsx scripts/copy-shared.ts figma-plugin --watch
 *   npm run watch:shared
 */

import * as fs from 'fs';
import * as path from 'path';

// 設定
const PROJECT_ROOT = path.join(__dirname, '..');
const SHARED_SRC = path.join(PROJECT_ROOT, 'shared', 'src');

const TARGET_PROJECTS = ['backend', 'figma-plugin'] as const;
type TargetProject = (typeof TARGET_PROJECTS)[number];

// Debounce設定（ウォッチモード用）
const DEBOUNCE_DELAY = 500; // ms
let debounceTimer: NodeJS.Timeout | null = null;

/**
 * shared/src/ を指定プロジェクトにコピー
 */
export function copySharedToProject(project: TargetProject): void {
  const targetDir = path.join(PROJECT_ROOT, project, 'src', 'shared');

  console.log(`\n📦 Copying shared/ to ${project}/src/shared/...`);
  console.log(`   Source: ${SHARED_SRC}`);
  console.log(`   Target: ${targetDir}`);

  try {
    // shared/src/ が存在するかチェック
    if (!fs.existsSync(SHARED_SRC)) {
      throw new Error(`Source directory not found: ${SHARED_SRC}`);
    }

    // ターゲットディレクトリの親ディレクトリを作成（存在しない場合）
    const targetParent = path.dirname(targetDir);
    if (!fs.existsSync(targetParent)) {
      fs.mkdirSync(targetParent, { recursive: true });
    }

    // コピー実行（上書き）
    fs.cpSync(SHARED_SRC, targetDir, {
      recursive: true,
      force: true, // 上書き
    });

    console.log(`   ✅ Successfully copied to ${project}/src/shared/`);
  } catch (error) {
    console.error(`   ❌ Error copying shared/ to ${project}:`, error);
    throw error;
  }
}

/**
 * Debounce処理を使ってコピーを実行
 */
function debouncedCopy(project: TargetProject): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    console.log('\n🔄 Detected changes in shared/src/...');
    try {
      copySharedToProject(project);
    } catch (error) {
      console.error('❌ Auto-copy failed:', error);
    }
  }, DEBOUNCE_DELAY);
}

/**
 * ウォッチモードを開始
 */
function startWatchMode(project: TargetProject): void {
  console.log('\n👀 Watching shared/src/ for changes...');
  console.log(`   Source: ${SHARED_SRC}`);
  console.log(`   Target: ${project}/src/shared/`);
  console.log('\n   Press Ctrl+C to stop\n');

  // shared/src/ が存在するかチェック
  if (!fs.existsSync(SHARED_SRC)) {
    console.error(`\n❌ Error: Source directory not found: ${SHARED_SRC}`);
    process.exit(1);
  }

  // 初回コピー
  try {
    copySharedToProject(project);
  } catch (error) {
    console.error('❌ Initial copy failed:', error);
    process.exit(1);
  }

  // ファイル変更を監視
  try {
    fs.watch(SHARED_SRC, { recursive: true }, (eventType: string, filename: string | null) => {
      if (filename) {
        console.log(`   📝 ${eventType}: ${filename}`);
        debouncedCopy(project);
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

/**
 * メイン処理
 */
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('\n❌ Error: Please specify a target project');
    console.error('\nUsage:');
    console.error('  # Single copy');
    console.error('  tsx scripts/copy-shared.ts backend');
    console.error('  tsx scripts/copy-shared.ts figma-plugin');
    console.error('');
    console.error('  # Watch mode');
    console.error('  tsx scripts/copy-shared.ts figma-plugin --watch');
    process.exit(1);
  }

  const project = args[0];
  const watchMode = args.includes('--watch') || args.includes('-w');

  if (!TARGET_PROJECTS.includes(project as TargetProject)) {
    console.error(`\n❌ Error: Invalid project "${project}"`);
    console.error(`\nValid projects: ${TARGET_PROJECTS.join(', ')}`);
    process.exit(1);
  }

  if (watchMode) {
    // ウォッチモードで実行
    startWatchMode(project as TargetProject);
  } else {
    // 単発コピー
    try {
      copySharedToProject(project as TargetProject);
      console.log('\n✨ Done!\n');
    } catch {
      console.error('\n❌ Copy failed\n');
      process.exit(1);
    }
  }
}

// スクリプトとして実行された場合のみメイン処理を実行
if (require.main === module) {
  main();
}
