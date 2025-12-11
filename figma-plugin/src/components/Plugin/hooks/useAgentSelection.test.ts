import { act, renderHook, waitFor } from '@testing-library/preact';

import type { AgentOption } from '../../../constants/agents';

import { useAgentSelection } from './useAgentSelection';

// メッセージングのモック
let messageHandlers: Record<string, (data: any) => void> = {};

const mockEmit = jest.fn((event: string, _data?: any) => {
  // LOAD_AGENT_SELECTIONが呼ばれたら即座にAGENT_SELECTION_LOADEDを発火
  if (event === 'LOAD_AGENT_SELECTION') {
    setTimeout(() => {
      if (messageHandlers['AGENT_SELECTION_LOADED']) {
        messageHandlers['AGENT_SELECTION_LOADED']({
          selectedAgents: null,
        });
      }
    }, 0);
  }
});

const mockOn = jest.fn((event: string, handler: (data: any) => void) => {
  messageHandlers[event] = handler;
});

jest.mock('@create-figma-plugin/utilities', () => ({
  emit: (event: string, data?: any) => mockEmit(event, data),
  on: (event: string, handler: (data: any) => void) => mockOn(event, handler),
}));

describe('useAgentSelection', () => {
  const mockAgentOptions: AgentOption[] = [
    { id: 'accessibility', label: 'Accessibility', description: 'Test' },
  ];

  beforeEach(() => {
    messageHandlers = {};
    mockEmit.mockClear();
    mockOn.mockClear();
  });

  it('保存された選択状態がない場合はすべて選択される', async () => {
    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    // 初期状態は空配列
    expect(result.current.selectedAgents).toEqual([]);

    // メッセージの送信を確認
    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith('LOAD_AGENT_SELECTION', undefined);
    });

    // AGENT_SELECTION_LOADEDが発火されるとすべて選択される
    await waitFor(() => {
      expect(result.current.selectedAgents).toEqual(['accessibility']);
    });
  });

  it('保存された選択を読み込む', async () => {
    // モックを設定して保存済みデータを返すようにする
    mockEmit.mockImplementation((event: string, _data?: any) => {
      if (event === 'LOAD_AGENT_SELECTION') {
        setTimeout(() => {
          if (messageHandlers['AGENT_SELECTION_LOADED']) {
            messageHandlers['AGENT_SELECTION_LOADED']({
              selectedAgents: ['accessibility'],
            });
          }
        }, 0);
      }
    });

    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    await waitFor(() => {
      expect(result.current.selectedAgents).toEqual(['accessibility']);
    });
  });

  it('空の配列が保存されている場合も空として復元される', async () => {
    // モックを設定して空の配列を返すようにする
    mockEmit.mockImplementation((event: string, _data?: any) => {
      if (event === 'LOAD_AGENT_SELECTION') {
        setTimeout(() => {
          if (messageHandlers['AGENT_SELECTION_LOADED']) {
            messageHandlers['AGENT_SELECTION_LOADED']({
              selectedAgents: [],
            });
          }
        }, 0);
      }
    });

    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    // 初期状態は空配列
    expect(result.current.selectedAgents).toEqual([]);

    // 空の配列が保存されている場合もそのまま復元される
    await waitFor(() => {
      expect(result.current.selectedAgents).toEqual([]);
    });
  });

  it('無効なデータを適切に処理する', async () => {
    // モックを設定して無効なデータを返すようにする
    mockEmit.mockImplementation((event: string, _data?: any) => {
      if (event === 'LOAD_AGENT_SELECTION') {
        setTimeout(() => {
          if (messageHandlers['AGENT_SELECTION_LOADED']) {
            messageHandlers['AGENT_SELECTION_LOADED']({
              selectedAgents: 'invalid data', // 配列でない
            });
          }
        }, 0);
      }
    });

    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    // デフォルト値にフォールバック（すべて選択）
    await waitFor(() => {
      expect(result.current.selectedAgents).toEqual(['accessibility']);
    });
  });

  describe('handleAgentChange', () => {
    it('checkedがtrueのときにエージェントを追加する', async () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      // データがロードされるまで待つ
      await waitFor(() => {
        expect(result.current.selectedAgents).toEqual(['accessibility']);
      });

      act(() => {
        // Remove one first
        result.current.handleAgentChange('accessibility', false);
      });

      expect(result.current.selectedAgents).not.toContain('accessibility');

      act(() => {
        // Add it back
        result.current.handleAgentChange('accessibility', true);
      });

      expect(result.current.selectedAgents).toContain('accessibility');
    });

    it('checkedがfalseのときにエージェントを削除する', async () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      // データがロードされるまで待つ
      await waitFor(() => {
        expect(result.current.selectedAgents).toEqual(['accessibility']);
      });

      act(() => {
        result.current.handleAgentChange('accessibility', false);
      });

      expect(result.current.selectedAgents).not.toContain('accessibility');
      expect(result.current.selectedAgents).toEqual([]);
    });
    it('選択を保存する', async () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      // データがロードされるまで待つ
      await waitFor(() => {
        expect(result.current.selectedAgents).toEqual(['accessibility']);
      });

      act(() => {
        result.current.handleAgentChange('accessibility', false);
      });

      expect(mockEmit).toHaveBeenCalledWith('SAVE_AGENT_SELECTION', []);
    });

    it('複数の変更を処理する', async () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      // データがロードされるまで待つ
      await waitFor(() => {
        expect(result.current.selectedAgents).toEqual(['accessibility']);
      });

      act(() => {
        result.current.handleAgentChange('accessibility', false);
      });

      act(() => {
        result.current.handleAgentChange('accessibility', true);
      });

      expect(result.current.selectedAgents).toEqual(['accessibility']);
    });
  });

  describe('handleSelectAll', () => {
    it('利用可能なすべてのエージェントを選択する', async () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      // データがロードされるまで待つ
      await waitFor(() => {
        expect(result.current.selectedAgents).toEqual(['accessibility']);
      });

      // First deselect all
      act(() => {
        result.current.handleDeselectAll();
      });

      expect(result.current.selectedAgents).toEqual([]);

      // Then select all
      act(() => {
        result.current.handleSelectAll();
      });

      expect(result.current.selectedAgents).toEqual(['accessibility']);
    });
    it('選択されたすべてのエージェントを保存する', async () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      // データがロードされるまで待つ
      await waitFor(() => {
        expect(result.current.selectedAgents).toEqual(['accessibility']);
      });

      act(() => {
        result.current.handleSelectAll();
      });

      expect(mockEmit).toHaveBeenCalledWith('SAVE_AGENT_SELECTION', ['accessibility']);
    });
  });

  describe('handleDeselectAll', () => {
    it('すべてのエージェントの選択を解除する', async () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      // データがロードされるまで待つ
      await waitFor(() => {
        expect(result.current.selectedAgents).toEqual(['accessibility']);
      });

      act(() => {
        result.current.handleDeselectAll();
      });

      expect(result.current.selectedAgents).toEqual([]);
    });

    it('空の選択を保存する', async () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      // データがロードされるまで待つ
      await waitFor(() => {
        expect(result.current.selectedAgents).toEqual(['accessibility']);
      });

      act(() => {
        result.current.handleDeselectAll();
      });

      expect(mockEmit).toHaveBeenCalledWith('SAVE_AGENT_SELECTION', []);
    });
  });

  it('複数の操作を通じて選択状態を維持する', async () => {
    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    // データがロードされるまで待つ
    await waitFor(() => {
      expect(result.current.selectedAgents).toEqual(['accessibility']);
    });

    act(() => {
      result.current.handleDeselectAll();
    });

    expect(result.current.selectedAgents).toEqual([]);

    act(() => {
      result.current.handleAgentChange('accessibility', true);
    });

    expect(result.current.selectedAgents).toEqual(['accessibility']);

    act(() => {
      result.current.handleAgentChange('accessibility', false);
    });

    expect(result.current.selectedAgents).toEqual([]);
  });
});
