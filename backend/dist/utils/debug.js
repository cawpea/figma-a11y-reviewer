"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
exports.saveDebugData = saveDebugData;
exports.cleanupOldDebugFiles = cleanupOldDebugFiles;
exports.savePromptAndResponse = savePromptAndResponse;
const fs_1 = require("fs");
const path_1 = require("path");
const anthropic_1 = require("../config/anthropic");
const logsDir = (0, path_1.join)(__dirname, '../../logs');
const isDebug = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
/**
 * 統合ログ関数: 開発環境ではdebug/infoを出力、warn/errorは常に出力
 * @param level - ログレベル ('debug' | 'info' | 'warn' | 'error')
 * @param message - ログメッセージ
 * @param prefix - オプショナルなプレフィックス（例: '[Sibling Search]'）
 * @param args - 追加の引数（console.logと同様）
 */
function log(level, message, prefix, ...args) {
    // debug/infoは開発環境でのみ出力
    if ((level === 'debug' || level === 'info') && process.env.NODE_ENV !== 'development') {
        return;
    }
    const formattedMessage = prefix ? `${prefix} ${message}` : message;
    switch (level) {
        case 'debug':
            if (isDebug)
                console.debug(formattedMessage, ...args);
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
function saveDebugData(nodeData) {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }
    try {
        // logsディレクトリが存在しない場合は作成
        if (!(0, fs_1.existsSync)(logsDir)) {
            (0, fs_1.mkdirSync)(logsDir, { recursive: true });
            log('info', `📁 Created logs directory: ${logsDir}`);
        }
        // タイムスタンプ付きファイル名
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        const nodeName = nodeData.name.replace(/[^a-zA-Z0-9]/g, '_'); // 安全なファイル名に変換
        const filename = `debug-${nodeName}-${timestamp}.json`;
        const filepath = (0, path_1.join)(logsDir, filename);
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
        (0, fs_1.writeFileSync)(filepath, JSON.stringify(debugData, null, 2));
        log('info', `✅ Debug data saved to: logs/${filename}`);
        log('info', `   Children count: ${debugData.childrenCount}`);
    }
    catch (error) {
        log('error', '❌ Failed to save debug file:', undefined, error);
    }
}
/**
 * 古いデバッグファイルを削除（7日以上前のファイル）
 */
function cleanupOldDebugFiles() {
    try {
        if (!(0, fs_1.existsSync)(logsDir))
            return;
        const files = (0, fs_1.readdirSync)(logsDir);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7日
        let deletedCount = 0;
        files.forEach((file) => {
            if (!file.startsWith('debug-'))
                return;
            const filepath = (0, path_1.join)(logsDir, file);
            const stats = (0, fs_1.statSync)(filepath);
            const age = now - stats.mtimeMs;
            if (age > maxAge) {
                (0, fs_1.unlinkSync)(filepath);
                deletedCount++;
            }
        });
        if (deletedCount > 0) {
            log('info', `🗑️  Cleaned up ${deletedCount} old debug files`);
        }
    }
    catch (error) {
        log('error', 'Failed to cleanup old debug files:', undefined, error);
    }
}
/**
 * プロンプトをファイルに保存
 */
/**
 * プロンプトとレスポンスをファイルに保存
 */
function savePromptAndResponse(systemPrompt, userPrompt, category, response) {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }
    try {
        const promptsDir = (0, path_1.join)(logsDir, 'prompts');
        if (!(0, fs_1.existsSync)(promptsDir)) {
            (0, fs_1.mkdirSync)(promptsDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        const filename = `prompt-${category}-${timestamp}.json`;
        const filepath = (0, path_1.join)(promptsDir, filename);
        const data = {
            timestamp: new Date().toISOString(),
            category: category,
            model: anthropic_1.MODEL_CONFIG.default,
            maxTokens: anthropic_1.MODEL_CONFIG.maxTokens,
            temperature: anthropic_1.MODEL_CONFIG.temperature,
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
        (0, fs_1.writeFileSync)(filepath, JSON.stringify(data, null, 2));
        log('info', `📋 Prompt JSON saved to: logs/prompts/${filename}`);
    }
    catch (error) {
        log('error', 'Failed to save prompt JSON:', undefined, error);
    }
}
