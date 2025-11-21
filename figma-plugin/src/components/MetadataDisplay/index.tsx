import { h } from 'preact';
import type { EvaluationResult } from '../../types';

interface MetadataDisplayProps {
  metadata: EvaluationResult['metadata'];
}

export default function MetadataDisplay({ metadata }: MetadataDisplayProps) {
  return (
    <div>
      <div className="mt-4 pt-4 border-t border-gray-200 text-[10px] text-gray-600 text-center">
        評価完了: {new Date(metadata.evaluatedAt).toLocaleString('ja-JP')}
        <br />
        処理時間: {(metadata.duration / 1000).toFixed(1)}秒
        {metadata.usage && (
          <div>
            <br />
            トークン使用量: {metadata.usage.totalInputTokens.toLocaleString()} 入力 / {metadata.usage.totalOutputTokens.toLocaleString()} 出力
            {metadata.usage.totalCachedTokens > 0 && ` / ${metadata.usage.totalCachedTokens.toLocaleString()} キャッシュ`}
            <br />
            推定コスト: ${metadata.usage.estimatedCost.toFixed(4)}
          </div>
        )}
      </div>

      <div className="text-[10px] text-green-600 text-center mt-2 p-2 bg-green-50 rounded">
        ✓ API接続成功
      </div>
    </div>
  );
}
