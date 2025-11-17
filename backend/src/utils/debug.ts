import { join } from 'path';
import { existsSync, readdirSync, unlinkSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { MODEL_CONFIG } from '../config/anthropic';
import Anthropic from '@anthropic-ai/sdk';

const logsDir = join(__dirname, '../logs');

/**
 * デバッグ用: ノードデータをファイルに保存
 */
export function saveDebugData(nodeData: any) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    
    // logsディレクトリが存在しない場合は作成
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
      console.log('📁 Created logs directory:', logsDir);
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
    console.log(`✅ Debug data saved to: logs/${filename}`);
    console.log(`   Children count: ${debugData.childrenCount}`);
  } catch (error) {
    console.error('❌ Failed to save debug file:', error);
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
    files.forEach(file => {
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
      console.log(`🗑️  Cleaned up ${deletedCount} old debug files`);
    }
  } catch (error) {
    console.error('Failed to cleanup old debug files:', error);
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
      response: response ? {
        model: response.model,
        stopReason: response.stop_reason,
        usage: response.usage,
        content: response.content,
      } : null,
    };

    writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`📋 Prompt JSON saved to: logs/prompts/${filename}`);
  } catch (error) {
    console.error('Failed to save prompt JSON:', error);
  }
}