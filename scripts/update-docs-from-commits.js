#!/usr/bin/env node

/**
 * コミットログをもとにドキュメントを更新するスクリプト
 *
 * 使用方法:
 *   node scripts/update-docs-from-commits.js
 *   node scripts/update-docs-from-commits.js --base=main
 *   node scripts/update-docs-from-commits.js --dry-run
 *   node scripts/update-docs-from-commits.js --auto-apply
 *   node scripts/update-docs-from-commits.js --output=update-log.md
 *
 * オプション:
 *   --base=<branch>     比較元のブランチ（デフォルト: main）
 *   --dry-run           実際の更新は行わず、変更内容のみ表示
 *   --auto-apply        確認なしで自動的に更新を適用
 *   --output=<file>     更新内容をファイルに出力
 *   --verbose, -v       詳細なログを表示
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 設定
const PROJECT_ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const CLAUDE_MD = path.join(PROJECT_ROOT, 'CLAUDE.md');

// コマンドライン引数のパース
const args = process.argv.slice(2);
const options = {
  base: 'main',
  dryRun: false,
  autoApply: false,
  output: null,
  verbose: false,
};

for (const arg of args) {
  if (arg.startsWith('--base=')) {
    options.base = arg.split('=')[1];
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--auto-apply') {
    options.autoApply = true;
  } else if (arg.startsWith('--output=')) {
    options.output = arg.split('=')[1];
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  }
}

/**
 * Gitコマンドを実行
 */
function execGit(command) {
  try {
    return execSync(`git ${command}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim();
  } catch (error) {
    console.error(`❌ Gitコマンドの実行に失敗: ${command}`);
    throw error;
  }
}

/**
 * 現在のブランチ名を取得
 */
function getCurrentBranch() {
  return execGit('rev-parse --abbrev-ref HEAD');
}

/**
 * コミットログを取得
 */
function getCommitLogs(baseBranch, currentBranch) {
  const format = '%H|%s|%b|%an|%ae|%ad|%P';
  const logs = execGit(`log ${baseBranch}..${currentBranch} --format="${format}" --date=iso`);

  if (!logs) {
    return [];
  }

  const commits = [];
  const logLines = logs.split('\n');

  for (const line of logLines) {
    if (!line) continue;

    const [hash, subject, body, author, email, date, parents] = line.split('|');

    commits.push({
      hash: hash.substring(0, 7),
      fullHash: hash,
      subject: subject.trim(),
      body: body.trim(),
      author: author.trim(),
      email: email.trim(),
      date: new Date(date),
      parents: parents ? parents.split(' ') : [],
    });
  }

  return commits;
}

/**
 * コミットの変更ファイルを取得
 */
function getChangedFiles(commitHash) {
  const output = execGit(`show --name-status --format="" ${commitHash}`);

  if (!output) {
    return [];
  }

  const files = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (!line) continue;

    const [status, ...pathParts] = line.split('\t');
    const filePath = pathParts.join('\t');

    files.push({
      status: status.trim(),
      path: filePath.trim(),
    });
  }

  return files;
}

/**
 * ファイルの差分を取得
 */
function getFileDiff(commitHash, filePath) {
  try {
    return execGit(`show ${commitHash}:${filePath}`);
  } catch {
    return null;
  }
}

/**
 * コミットメッセージからカテゴリを抽出
 */
function categorizeCommit(commit) {
  const subject = commit.subject.toLowerCase();

  // Conventional Commits形式のプレフィックスを検出
  if (subject.includes('feat:') || subject.includes(':sparkles:')) {
    return 'feature';
  }
  if (subject.includes('fix:') || subject.includes(':bug:')) {
    return 'bugfix';
  }
  if (subject.includes('docs:') || subject.includes(':memo:') || subject.includes(':recycle:')) {
    return 'docs';
  }
  if (subject.includes('refactor:') || subject.includes(':recycle:') || subject.includes(':art:')) {
    return 'refactor';
  }
  if (subject.includes('test:') || subject.includes(':white_check_mark:')) {
    return 'test';
  }
  if (subject.includes('chore:') || subject.includes(':wrench:')) {
    return 'chore';
  }
  if (subject.includes('perf:') || subject.includes(':zap:')) {
    return 'performance';
  }

  return 'other';
}

/**
 * 変更されたファイルからドキュメント更新が必要な領域を特定
 */
function identifyDocumentationAreas(changedFiles) {
  const areas = new Set();

  for (const file of changedFiles) {
    const filePath = file.path.toLowerCase();

    if (filePath.startsWith('backend/')) {
      areas.add('backend');
      if (filePath.includes('agent')) {
        areas.add('agents');
      }
      if (filePath.includes('api') || filePath.includes('routes')) {
        areas.add('api');
      }
      if (filePath.includes('service')) {
        areas.add('services');
      }
      if (filePath.includes('middleware')) {
        areas.add('middleware');
      }
    }

    if (filePath.startsWith('figma-plugin/')) {
      areas.add('figma-plugin');
      if (filePath.includes('component')) {
        areas.add('components');
      }
      if (filePath.includes('hook')) {
        areas.add('hooks');
      }
    }

    if (filePath.startsWith('shared/')) {
      areas.add('shared');
      if (filePath.includes('types')) {
        areas.add('types');
      }
    }

    if (
      filePath.includes('package.json') ||
      filePath.includes('tsconfig') ||
      filePath.includes('jest.config')
    ) {
      areas.add('configuration');
    }

    if (filePath.includes('.md')) {
      areas.add('documentation');
    }
  }

  return Array.from(areas);
}

/**
 * ドキュメント更新提案を生成
 */
function generateDocumentationUpdates(commits, baseBranch, currentBranch) {
  const updates = {
    claudeMd: {
      sections: [],
      changelog: [],
    },
    docs: {},
  };

  // カテゴリ別にコミットを分類
  const commitsByCategory = {
    feature: [],
    bugfix: [],
    docs: [],
    refactor: [],
    test: [],
    performance: [],
    chore: [],
    other: [],
  };

  const allChangedFiles = [];

  for (const commit of commits) {
    const category = categorizeCommit(commit);
    commitsByCategory[category].push(commit);

    const changedFiles = getChangedFiles(commit.fullHash);
    allChangedFiles.push(...changedFiles);
  }

  // 影響を受ける領域を特定
  const affectedAreas = identifyDocumentationAreas(allChangedFiles);

  // CLAUDE.mdの更新提案
  if (commits.length > 0) {
    updates.claudeMd.changelog.push({
      branch: currentBranch,
      baseBranch: baseBranch,
      date: new Date().toISOString().split('T')[0],
      commits: commits.map((c) => ({
        hash: c.hash,
        subject: c.subject,
        author: c.author,
        date: c.date.toISOString().split('T')[0],
      })),
      affectedAreas,
    });
  }

  // 各カテゴリのコミットに基づいて更新提案を生成
  for (const [category, categoryCommits] of Object.entries(commitsByCategory)) {
    if (categoryCommits.length === 0) continue;

    // ドキュメント更新の提案
    if (category === 'feature') {
      updates.docs['new-features'] = categoryCommits.map((c) => ({
        commit: c.hash,
        subject: c.subject,
        description: c.body || '詳細はコミットログを参照',
        files: getChangedFiles(c.fullHash),
      }));
    }

    if (category === 'bugfix') {
      updates.docs['bug-fixes'] = categoryCommits.map((c) => ({
        commit: c.hash,
        subject: c.subject,
        description: c.body || '詳細はコミットログを参照',
        files: getChangedFiles(c.fullHash),
      }));
    }

    if (category === 'refactor') {
      updates.docs['refactoring'] = categoryCommits.map((c) => ({
        commit: c.hash,
        subject: c.subject,
        description: c.body || '詳細はコミットログを参照',
        files: getChangedFiles(c.fullHash),
      }));
    }
  }

  return updates;
}

/**
 * Markdownフォーマットで更新レポートを生成
 */
function generateUpdateReport(updates, baseBranch, currentBranch, commits) {
  const lines = [];

  lines.push(`# ドキュメント更新レポート`);
  lines.push('');
  lines.push(`**ブランチ**: \`${currentBranch}\``);
  lines.push(`**比較元**: \`${baseBranch}\``);
  lines.push(`**生成日時**: ${new Date().toLocaleString('ja-JP')}`);
  lines.push('');

  // コミットサマリー
  lines.push(`## コミットサマリー`);
  lines.push('');
  lines.push(`合計 **${commits.length}** 件のコミット`);
  lines.push('');

  if (commits.length > 0) {
    lines.push('| コミット | 日付 | 件名 | 作成者 |');
    lines.push('|----------|------|------|--------|');

    for (const commit of commits) {
      const date = commit.date.toISOString().split('T')[0];
      lines.push(`| \`${commit.hash}\` | ${date} | ${commit.subject} | ${commit.author} |`);
    }

    lines.push('');
  }

  // 影響を受ける領域
  if (updates.claudeMd.changelog.length > 0) {
    const changelog = updates.claudeMd.changelog[0];

    if (changelog.affectedAreas.length > 0) {
      lines.push(`## 影響を受ける領域`);
      lines.push('');

      for (const area of changelog.affectedAreas) {
        lines.push(`- ${area}`);
      }

      lines.push('');
    }
  }

  // 新機能
  if (updates.docs['new-features']) {
    lines.push(`## 新機能`);
    lines.push('');

    for (const feature of updates.docs['new-features']) {
      lines.push(`### ${feature.subject} (\`${feature.commit}\`)`);
      lines.push('');

      if (feature.description) {
        lines.push(feature.description);
        lines.push('');
      }

      if (feature.files.length > 0) {
        lines.push('**変更されたファイル:**');
        lines.push('');

        for (const file of feature.files) {
          lines.push(`- \`${file.path}\` (${file.status})`);
        }

        lines.push('');
      }
    }
  }

  // バグフィックス
  if (updates.docs['bug-fixes']) {
    lines.push(`## バグフィックス`);
    lines.push('');

    for (const fix of updates.docs['bug-fixes']) {
      lines.push(`### ${fix.subject} (\`${fix.commit}\`)`);
      lines.push('');

      if (fix.description) {
        lines.push(fix.description);
        lines.push('');
      }

      if (fix.files.length > 0) {
        lines.push('**変更されたファイル:**');
        lines.push('');

        for (const file of fix.files) {
          lines.push(`- \`${file.path}\` (${file.status})`);
        }

        lines.push('');
      }
    }
  }

  // リファクタリング
  if (updates.docs['refactoring']) {
    lines.push(`## リファクタリング`);
    lines.push('');

    for (const refactor of updates.docs['refactoring']) {
      lines.push(`### ${refactor.subject} (\`${refactor.commit}\`)`);
      lines.push('');

      if (refactor.description) {
        lines.push(refactor.description);
        lines.push('');
      }

      if (refactor.files.length > 0) {
        lines.push('**変更されたファイル:**');
        lines.push('');

        for (const file of refactor.files) {
          lines.push(`- \`${file.path}\` (${file.status})`);
        }

        lines.push('');
      }
    }
  }

  // 推奨される更新
  lines.push(`## 推奨されるドキュメント更新`);
  lines.push('');

  if (updates.claudeMd.changelog.length > 0) {
    const changelog = updates.claudeMd.changelog[0];

    lines.push(`### CLAUDE.md`);
    lines.push('');
    lines.push(`ブランチ \`${changelog.branch}\` の変更をCLAUDE.mdに反映することを推奨します。`);
    lines.push('');

    if (changelog.affectedAreas.length > 0) {
      lines.push('**更新が必要なセクション:**');
      lines.push('');

      const sectionMap = {
        backend: 'バックエンド',
        'figma-plugin': 'Figmaプラグイン',
        api: 'API',
        agents: '評価エージェント',
        components: 'コンポーネント',
        configuration: '設定',
        documentation: 'ドキュメント',
      };

      for (const area of changelog.affectedAreas) {
        const sectionName = sectionMap[area] || area;
        lines.push(`- ${sectionName}`);
      }

      lines.push('');
    }
  }

  // docsディレクトリの更新提案
  lines.push(`### docsディレクトリ`);
  lines.push('');

  const docUpdates = [];

  if (updates.docs['new-features']) {
    docUpdates.push('- 新機能の説明を追加（該当する場合）');
  }

  if (updates.docs['bug-fixes']) {
    docUpdates.push('- 修正されたバグの記録を追加');
  }

  if (updates.docs['refactoring']) {
    docUpdates.push('- リファクタリングによる変更点を反映');
  }

  if (docUpdates.length > 0) {
    for (const update of docUpdates) {
      lines.push(update);
    }
  } else {
    lines.push('- 特に更新は不要と思われます');
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * ユーザーに確認を求める
 */
function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * CLAUDE.mdを更新
 */
function updateClaudeMd(updates) {
  if (!fs.existsSync(CLAUDE_MD)) {
    console.warn('⚠️  CLAUDE.mdが見つかりません。スキップします。');
    return false;
  }

  const content = fs.readFileSync(CLAUDE_MD, 'utf-8');

  // 変更履歴セクションを追加または更新
  const changelog = updates.claudeMd.changelog[0];

  if (!changelog) {
    return false;
  }

  const changelogEntry = [
    '',
    `## 変更履歴 (${changelog.date})`,
    '',
    `**ブランチ**: \`${changelog.branch}\``,
    '',
    `### コミット`,
    '',
  ];

  for (const commit of changelog.commits) {
    changelogEntry.push(`- \`${commit.hash}\`: ${commit.subject}`);
  }

  changelogEntry.push('');

  // CLAUDE.mdの末尾に追加
  const updatedContent = content + '\n' + changelogEntry.join('\n');

  fs.writeFileSync(CLAUDE_MD, updatedContent, 'utf-8');

  return true;
}

/**
 * メイン処理
 */
async function main() {
  console.log('📝 ドキュメント更新スクリプトを開始します\n');

  // 現在のブランチを取得
  const currentBranch = getCurrentBranch();
  console.log(`📌 現在のブランチ: ${currentBranch}`);
  console.log(`📌 比較元ブランチ: ${options.base}\n`);

  // コミットログを取得
  const commits = getCommitLogs(options.base, currentBranch);

  if (commits.length === 0) {
    console.log('ℹ️  新しいコミットがありません。更新は不要です。');
    process.exit(0);
  }

  console.log(`📊 ${commits.length} 件のコミットを検出しました\n`);

  if (options.verbose) {
    for (const commit of commits) {
      console.log(`  ${commit.hash}: ${commit.subject} (${commit.author})`);
    }
    console.log('');
  }

  // ドキュメント更新提案を生成
  const updates = generateDocumentationUpdates(commits, options.base, currentBranch);

  // 更新レポートを生成
  const report = generateUpdateReport(updates, options.base, currentBranch, commits);

  // レポートを表示
  console.log('='.repeat(80));
  console.log(report);
  console.log('='.repeat(80));
  console.log('');

  // ファイルに出力
  if (options.output) {
    const outputPath = path.join(PROJECT_ROOT, options.output);
    fs.writeFileSync(outputPath, report, 'utf-8');
    console.log(`✅ レポートを ${options.output} に保存しました\n`);
  }

  // dry-runモードの場合はここで終了
  if (options.dryRun) {
    console.log('ℹ️  --dry-run モードのため、実際の更新は行いません');
    process.exit(0);
  }

  // 確認
  if (!options.autoApply) {
    const shouldApply = await promptUser('CLAUDE.mdを更新しますか? (y/n): ');

    if (!shouldApply) {
      console.log('ℹ️  更新をキャンセルしました');
      process.exit(0);
    }
  }

  // CLAUDE.mdを更新
  const claudeUpdated = updateClaudeMd(updates);

  if (claudeUpdated) {
    console.log('✅ CLAUDE.mdを更新しました');
  }

  console.log('\n✨ ドキュメント更新が完了しました！');
}

// 実行
main().catch((error) => {
  console.error('❌ エラーが発生しました:', error.message);
  process.exit(1);
});
