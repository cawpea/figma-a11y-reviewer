import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

import Anthropic from '@anthropic-ai/sdk';
import { FigmaNodeData } from '@shared/types';

import { MODEL_CONFIG } from '../config/anthropic';

const logsDir = join(__dirname, '../../logs');

const isDebug = false;

/**
 * 統合ログ関数: 開発環境ではdebug/infoを出力、warn/errorは常に出力
 * @param level - ログレベル ('debug' | 'info' | 'warn' | 'error')
 * @param message - ログメッセージ
 * @param prefix - オプショナルなプレフィックス（例: '[Sibling Search]'）
 * @param args - 追加の引数（console.logと同様）
 */
export function log(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  prefix?: string,
  ...args: unknown[]
): void {
  // debug/infoは開発環境でのみ出力
  if ((level === 'debug' || level === 'info') && process.env.NODE_ENV !== 'development') {
    return;
  }

  const formattedMessage = prefix ? `${prefix} ${message}` : message;

  switch (level) {
    case 'debug':
      if (isDebug) console.debug(formattedMessage, ...args);
      break;
    case 'info':
      console.info(formattedMessage, ...args);
      break;
    case 'warn':
      console.warn(formattedMessage, ...args);
      break;
    case 'error':
      console.error(formattedMessage, ...args);
      break;
  }
}

/**
 * デバッグ用: ノードデータをファイルに保存
 */
export function saveDebugData(nodeData: FigmaNodeData) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    // logsディレクトリが存在しない場合は作成
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
      log('info', `📁 Created logs directory: ${logsDir}`);
    }

    // タイムスタンプ付きファイル名
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const nodeName = nodeData.name.replace(/[^a-zA-Z0-9]/g, '_'); // 安全なファイル名に変換
    const filename = `debug-${nodeName}-${timestamp}.json`;
    const filepath = join(logsDir, filename);

    // データを整形して保存
    const debugData = {
      timestamp: new Date().toISOString(),
      nodeId: nodeData.id,
      nodeName: nodeData.name,
      nodeType: nodeData.type,
      childrenCount: nodeData.childrenCount || 0,
      summary: {
        hasChildren: !!nodeData.children,
        childrenCount: nodeData.children?.length || 0,
        hasLayoutMode: !!nodeData.layoutMode,
        hasFills: !!nodeData.fills,
      },
      fullData: nodeData,
    };

    writeFileSync(filepath, JSON.stringify(debugData, null, 2));
    log('info', `✅ Debug data saved to: logs/${filename}`);
    log('info', `   Children count: ${debugData.childrenCount}`);
  } catch (error) {
    log('error', '❌ Failed to save debug file:', undefined, error);
  }
}

/**
 * 古いデバッグファイルを削除（7日以上前のファイル）
 */
export function cleanupOldDebugFiles() {
  try {
    if (!existsSync(logsDir)) return;

    const files = readdirSync(logsDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7日

    let deletedCount = 0;
    files.forEach((file) => {
      if (!file.startsWith('debug-')) return;

      const filepath = join(logsDir, file);
      const stats = statSync(filepath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        unlinkSync(filepath);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      log('info', `🗑️  Cleaned up ${deletedCount} old debug files`);
    }
  } catch (error) {
    log('error', 'Failed to cleanup old debug files:', undefined, error);
  }
}

/**
 * プロンプトをファイルに保存
 */
/**
 * プロンプトとレスポンスをファイルに保存
 */
export function savePromptAndResponse(
  systemPrompt: string,
  userPrompt: string,
  category: string,
  response?: Anthropic.Message
) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const promptsDir = join(logsDir, 'prompts');

    if (!existsSync(promptsDir)) {
      mkdirSync(promptsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filename = `prompt-${category}-${timestamp}.json`;
    const filepath = join(promptsDir, filename);

    const data = {
      timestamp: new Date().toISOString(),
      category: category,
      model: MODEL_CONFIG.default,
      maxTokens: MODEL_CONFIG.maxTokens,
      temperature: MODEL_CONFIG.temperature,
      systemPrompt: systemPrompt,
      userPrompt: userPrompt,
      response: response
        ? {
            model: response.model,
            stopReason: response.stop_reason,
            usage: response.usage,
            content: response.content,
          }
        : null,
    };

    writeFileSync(filepath, JSON.stringify(data, null, 2));
    log('info', `📋 Prompt JSON saved to: logs/prompts/${filename}`);
  } catch (error) {
    log('error', 'Failed to save prompt JSON:', undefined, error);
  }
}
