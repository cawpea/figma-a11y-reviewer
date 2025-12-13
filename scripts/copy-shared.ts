#!/usr/bin/env tsx

/**
 * shared/src/ を backend/src/shared/ または figma-plugin/src/shared/ にコピーするスクリプト
 *
 * 使用方法:
 *   tsx scripts/copy-shared.ts backend
 *   tsx scripts/copy-shared.ts figma-plugin
 *   npm run copy:shared backend
 *   npm run copy:shared figma-plugin
 */

import * as fs from 'fs';
import * as path from 'path';

// 設定
const PROJECT_ROOT = path.join(__dirname, '..');
const SHARED_SRC = path.join(PROJECT_ROOT, 'shared', 'src');

const TARGET_PROJECTS = ['backend', 'figma-plugin'] as const;
type TargetProject = (typeof TARGET_PROJECTS)[number];

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
 * メイン処理
 */
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('\n❌ Error: Please specify a target project');
    console.error('\nUsage:');
    console.error('  tsx scripts/copy-shared.ts backend');
    console.error('  tsx scripts/copy-shared.ts figma-plugin');
    process.exit(1);
  }

  const project = args[0];

  if (!TARGET_PROJECTS.includes(project as TargetProject)) {
    console.error(`\n❌ Error: Invalid project "${project}"`);
    console.error(`\nValid projects: ${TARGET_PROJECTS.join(', ')}`);
    process.exit(1);
  }

  try {
    copySharedToProject(project as TargetProject);
    console.log('\n✨ Done!\n');
  } catch (error) {
    console.error('\n❌ Copy failed\n');
    process.exit(1);
  }
}

// スクリプトとして実行された場合のみメイン処理を実行
if (require.main === module) {
  main();
}
