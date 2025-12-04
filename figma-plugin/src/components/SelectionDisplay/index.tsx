import type { SelectionState } from '@shared/types';
import { h } from 'preact';

import Heading from '../Heading';

interface SelectionDisplayProps {
  selectionState: SelectionState;
}

export default function SelectionDisplay({ selectionState }: SelectionDisplayProps) {
  // 空状態またはエラー状態
  if (selectionState.layers.length === 0) {
    return (
      <section aria-live="polite">
        <Heading>レビュー対象</Heading>
        <div className="text-xs text-gray-500">
          フレーム、コンポーネント、インスタンスを選択してください
        </div>
      </section>
    );
  }

  // 有効な選択を表示
  return (
    <section aria-live="polite">
      <Heading>レビュー対象</Heading>
      <div className="space-y-1">
        {selectionState.layers.map((layer) => (
          <div key={layer.id} className="text-xs text-gray-800 truncate">
            {layer.name}
          </div>
        ))}
      </div>
    </section>
  );
}
