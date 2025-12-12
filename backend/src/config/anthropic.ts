import Anthropic from '@anthropic-ai/sdk';

/**
 * ユーザー提供のAPI Keyから動的にAnthropicクライアントを生成
 * @param apiKey - ユーザーから提供されたClaude API Key（必須）
 * @returns Anthropicクライアントインスタンス
 * @throws API Keyが提供されていない場合はエラー
 */
export function createAnthropicClient(apiKey: string): Anthropic {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }

  return new Anthropic({
    apiKey,
  });
}

export const MODEL_CONFIG = {
  default: 'claude-sonnet-4-20250514',
  maxTokens: 8000, // Claude Sonnet 4.5の最大出力トークン数は8192
  temperature: 0, // 一貫性のある評価のため低めに設定
} as const;
