"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_CONFIG = void 0;
exports.createAnthropicClient = createAnthropicClient;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
/**
 * ユーザー提供のAPI Keyから動的にAnthropicクライアントを生成
 * @param apiKey - ユーザーから提供されたClaude API Key（必須）
 * @returns Anthropicクライアントインスタンス
 * @throws API Keyが提供されていない場合はエラー
 */
function createAnthropicClient(apiKey) {
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is required');
    }
    return new sdk_1.default({
        apiKey,
    });
}
exports.MODEL_CONFIG = {
    default: 'claude-sonnet-4-20250514',
    maxTokens: 8000, // Claude Sonnet 4.5の最大出力トークン数は8192
    temperature: 0, // 一貫性のある評価のため低めに設定
};
