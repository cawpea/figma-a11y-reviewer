import { on } from '@create-figma-plugin/utilities';
import type { SelectionState } from '@shared/types';
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export default function SelectionDisplay() {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    layers: [],
    isValid: true,
    errorMessage: undefined,
  });

  useEffect(() => {
    const unsubscribe = on('SELECTION_CHANGED', (state: SelectionState) => {
      setSelectionState(state);
    });

    return unsubscribe;
  }, []);

  // エラー表示（ErrorDisplayと統一したスタイル）
  if (!selectionState.isValid && selectionState.errorMessage) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-[11px] mb-4">
        <div className="font-semibold mb-1">レビュー対象の選択エラー</div>
        <div>{selectionState.errorMessage}</div>
      </div>
    );
  }

  // 空状態
  if (selectionState.layers.length === 0) {
    return (
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-800 mb-1.5">レビュー対象</div>
        <div className="text-[11px] text-gray-500">
          フレーム、コンポーネント、またはインスタンスを選択してください
        </div>
      </div>
    );
  }

  // 有効な選択を表示
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-gray-800 mb-1.5">レビュー対象</div>
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
