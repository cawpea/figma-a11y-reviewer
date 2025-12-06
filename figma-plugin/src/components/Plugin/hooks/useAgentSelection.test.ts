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
          selectedPlatform: null,
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
    { id: 'styleConsistency', label: 'Style Consistency', description: 'Test' },
    { id: 'usability', label: 'Usability', description: 'Test' },
  ];

  beforeEach(() => {
    messageHandlers = {};
    mockEmit.mockClear();
    mockOn.mockClear();
  });

  it('デフォルトで選択されたエージェントで初期化される', async () => {
    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    // メッセージの送信を確認
    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith('LOAD_AGENT_SELECTION', undefined);
    });

    expect(result.current.selectedAgents).toEqual([
      'accessibility',
      'styleConsistency',
      'usability',
    ]);
  });

  it('保存された選択を読み込む', async () => {
    // モックを設定して保存済みデータを返すようにする
    mockEmit.mockImplementation((event: string, _data?: any) => {
      if (event === 'LOAD_AGENT_SELECTION') {
        setTimeout(() => {
          if (messageHandlers['AGENT_SELECTION_LOADED']) {
            messageHandlers['AGENT_SELECTION_LOADED']({
              selectedAgents: ['accessibility'],
              selectedPlatform: 'android',
            });
          }
        }, 0);
      }
    });

    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    await waitFor(() => {
      expect(result.current.selectedAgents).toEqual(['accessibility']);
    });

    expect(result.current.selectedPlatform).toBe('android');
  });

  it('無効なデータを適切に処理する', async () => {
    // モックを設定して無効なデータを返すようにする
    mockEmit.mockImplementation((event: string, _data?: any) => {
      if (event === 'LOAD_AGENT_SELECTION') {
        setTimeout(() => {
          if (messageHandlers['AGENT_SELECTION_LOADED']) {
            messageHandlers['AGENT_SELECTION_LOADED']({
              selectedAgents: 'invalid data', // 配列でない
              selectedPlatform: null,
            });
          }
        }, 0);
      }
    });

    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    // デフォルト値にフォールバック
    expect(result.current.selectedAgents).toEqual([
      'accessibility',
      'styleConsistency',
      'usability',
    ]);
  });

  describe('handleAgentChange', () => {
    it('checkedがtrueのときにエージェントを追加する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

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

    it('checkedがfalseのときにエージェントを削除する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleAgentChange('accessibility', false);
      });

      expect(result.current.selectedAgents).not.toContain('accessibility');
      expect(result.current.selectedAgents).toContain('styleConsistency');
      expect(result.current.selectedAgents).toContain('usability');
    });
    it('選択を保存する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleAgentChange('styleConsistency', false);
      });

      expect(mockEmit).toHaveBeenCalledWith('SAVE_AGENT_SELECTION', ['accessibility', 'usability']);
    });

    it('複数の変更を処理する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleAgentChange('accessibility', false);
      });

      act(() => {
        result.current.handleAgentChange('styleConsistency', false);
      });

      expect(result.current.selectedAgents).toEqual(['usability']);
    });
  });

  describe('handleSelectAll', () => {
    it('利用可能なすべてのエージェントを選択する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      // First deselect all
      act(() => {
        result.current.handleDeselectAll();
      });

      expect(result.current.selectedAgents).toEqual([]);

      // Then select all
      act(() => {
        result.current.handleSelectAll();
      });

      expect(result.current.selectedAgents).toEqual([
        'accessibility',
        'styleConsistency',
        'usability',
      ]);
    });
    it('選択されたすべてのエージェントを保存する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleSelectAll();
      });

      expect(mockEmit).toHaveBeenCalledWith('SAVE_AGENT_SELECTION', [
        'accessibility',
        'styleConsistency',
        'usability',
      ]);
    });
  });

  describe('handleDeselectAll', () => {
    it('すべてのエージェントの選択を解除する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleDeselectAll();
      });

      expect(result.current.selectedAgents).toEqual([]);
    });

    it('空の選択を保存する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleDeselectAll();
      });

      expect(mockEmit).toHaveBeenCalledWith('SAVE_AGENT_SELECTION', []);
    });
  });

  it('複数の操作を通じて選択状態を維持する', () => {
    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    act(() => {
      result.current.handleDeselectAll();
    });

    act(() => {
      result.current.handleAgentChange('accessibility', true);
    });

    act(() => {
      result.current.handleAgentChange('usability', true);
    });

    act(() => {
      result.current.handleAgentChange('accessibility', false);
    });

    expect(result.current.selectedAgents).toEqual(['usability']);
  });
});
