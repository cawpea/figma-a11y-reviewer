import { on } from '@create-figma-plugin/utilities';
import type { SelectionState } from '@shared/types';
import { act, renderHook, waitFor } from '@testing-library/preact';

import { useSelectionState } from './useSelectionState';

jest.mock('@create-figma-plugin/utilities');

const mockOn = on as jest.MockedFunction<typeof on>;

describe('useSelectionState', () => {
  let selectionChangedHandler: ((state: SelectionState) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();

    // onモックのセットアップ
    mockOn.mockImplementation((event: string, handler: any) => {
      if (event === 'SELECTION_CHANGED') {
        selectionChangedHandler = handler;
      }
      return jest.fn(); // unsubscribe function
    });
  });

  afterEach(() => {
    selectionChangedHandler = null;
  });

  it('デフォルト値で初期化される', () => {
    const { result } = renderHook(() => useSelectionState());

    expect(result.current.layers).toEqual([]);
    expect(result.current.isValid).toBe(true);
    expect(result.current.errorMessage).toBeUndefined();
  });

  it('マウント時にSELECTION_CHANGEDイベントリスナーを設定する', () => {
    renderHook(() => useSelectionState());

    expect(mockOn).toHaveBeenCalledWith('SELECTION_CHANGED', expect.any(Function));
    expect(mockOn).toHaveBeenCalledTimes(1);
  });

  it('SELECTION_CHANGEDイベントで選択状態を更新する', async () => {
    const { result } = renderHook(() => useSelectionState());

    const newState: SelectionState = {
      layers: [
        {
          id: '1:1',
          name: 'Test Frame',
          type: 'FRAME',
        },
      ],
      isValid: true,
      errorMessage: undefined,
    };

    act(() => {
      if (selectionChangedHandler) selectionChangedHandler(newState);
    });

    await waitFor(() => {
      expect(result.current.layers).toEqual(newState.layers);
      expect(result.current.isValid).toBe(true);
      expect(result.current.errorMessage).toBeUndefined();
    });
  });

  it('複数のレイヤーが選択されたときに状態を更新する', async () => {
    const { result } = renderHook(() => useSelectionState());

    const newState: SelectionState = {
      layers: [
        {
          id: '1:1',
          name: 'Frame 1',
          type: 'FRAME',
        },
        {
          id: '1:2',
          name: 'Frame 2',
          type: 'FRAME',
        },
      ],
      isValid: true,
      errorMessage: undefined,
    };

    act(() => {
      if (selectionChangedHandler) selectionChangedHandler(newState);
    });

    await waitFor(() => {
      expect(result.current.layers).toHaveLength(2);
      expect(result.current.layers[0].name).toBe('Frame 1');
      expect(result.current.layers[1].name).toBe('Frame 2');
    });
  });

  it('エラー状態を処理する', async () => {
    const { result } = renderHook(() => useSelectionState());

    const errorState: SelectionState = {
      layers: [],
      isValid: false,
      errorMessage: '無効な選択です',
    };

    act(() => {
      if (selectionChangedHandler) selectionChangedHandler(errorState);
    });

    await waitFor(() => {
      expect(result.current.layers).toEqual([]);
      expect(result.current.isValid).toBe(false);
      expect(result.current.errorMessage).toBe('無効な選択です');
    });
  });

  it('空の選択状態を処理する', async () => {
    const { result } = renderHook(() => useSelectionState());

    const emptyState: SelectionState = {
      layers: [],
      isValid: true,
      errorMessage: undefined,
    };

    act(() => {
      if (selectionChangedHandler) selectionChangedHandler(emptyState);
    });

    await waitFor(() => {
      expect(result.current.layers).toEqual([]);
      expect(result.current.isValid).toBe(true);
      expect(result.current.errorMessage).toBeUndefined();
    });
  });

  it('異なるレイヤータイプ(COMPONENT, INSTANCE)を処理する', async () => {
    const { result } = renderHook(() => useSelectionState());

    const newState: SelectionState = {
      layers: [
        {
          id: '1:1',
          name: 'Button Component',
          type: 'COMPONENT',
        },
        {
          id: '1:2',
          name: 'Button Instance',
          type: 'INSTANCE',
        },
      ],
      isValid: true,
      errorMessage: undefined,
    };

    act(() => {
      if (selectionChangedHandler) selectionChangedHandler(newState);
    });

    await waitFor(() => {
      expect(result.current.layers).toHaveLength(2);
      expect(result.current.layers[0].type).toBe('COMPONENT');
      expect(result.current.layers[1].type).toBe('INSTANCE');
    });
  });

  it('アンマウント時にイベントリスナーをクリーンアップする', () => {
    const unsubscribeMock = jest.fn();
    mockOn.mockReturnValue(unsubscribeMock);

    const { unmount } = renderHook(() => useSelectionState());

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
