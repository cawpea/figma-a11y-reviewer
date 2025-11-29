import { on } from '@create-figma-plugin/utilities';
import type { SelectionState } from '@shared/types';
import { useEffect, useState } from 'preact/hooks';

export function useSelectionState() {
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

  return selectionState;
}
