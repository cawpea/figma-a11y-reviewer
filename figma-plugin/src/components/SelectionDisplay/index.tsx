import type { SelectionState } from '@shared/types';
import { h } from 'preact';

import Heading from '../Heading';

interface SelectionDisplayProps {
  selectionState: SelectionState;
}

export default function SelectionDisplay({ selectionState }: SelectionDisplayProps) {
  // エラー表示(ErrorDisplayと統一したスタイル)
  if (!selectionState.isValid && selectionState.errorMessage) {
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-[11px] mb-4"
        role="alert"
        aria-live="assertive"
      >
        <div className="font-semibold mb-1">レビュー対象の選択エラー</div>
        <div>{selectionState.errorMessage}</div>
      </div>
    );
  }

  // 空状態
  if (selectionState.layers.length === 0) {
    return (
      <div className="mb-3" aria-live="polite">
        <Heading>レビュー対象</Heading>
        <div className="text-[11px] text-gray-500">
          フレーム、コンポーネント、またはインスタンスを選択してください
        </div>
      </div>
    );
  }

  // 有効な選択を表示
  return (
    <div className="mb-3" aria-live="polite">
      <Heading>レビュー対象</Heading>
      <div className="space-y-1">
        {selectionState.layers.map((layer) => (
          <div key={layer.id} className="text-[11px] text-gray-800 truncate">
            {layer.name}
          </div>
        ))}
      </div>
    </div>
  );
}
