import { Text } from '@create-figma-plugin/ui';
import { h } from 'preact';

import type { EvaluationResult } from '../../../../shared/src/types';
import Heading from '../Heading';

interface MetadataDisplayProps {
  metadata: EvaluationResult['metadata'];
}

export default function MetadataDisplay({ metadata }: MetadataDisplayProps) {
  return (
    <div className="flex flex-col gap-5">
      <section>
        <Heading>レビュー日時</Heading>
        <Text>{new Date(metadata.evaluatedAt).toLocaleString('ja-JP')}</Text>
      </section>
      {metadata.usage && (
        <section>
          <Heading>API情報</Heading>
          <p>
            <span>
              トークン使用量: {metadata.usage.totalInputTokens.toLocaleString()} 入力 /{' '}
              {metadata.usage.totalOutputTokens.toLocaleString()} 出力
              {metadata.usage.totalCachedTokens > 0 &&
                ` / ${metadata.usage.totalCachedTokens.toLocaleString()} キャッシュ`}
            </span>
            <span className="inline-block ml-2">
              (推定費用: ${metadata.usage.estimatedCost.toFixed(4)})
            </span>
          </p>
        </section>
      )}
    </div>
  );
}
