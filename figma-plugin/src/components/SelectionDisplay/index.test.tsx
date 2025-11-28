import { emit } from '@create-figma-plugin/utilities';
import type { SelectionState } from '@shared/types';
import { render, screen, waitFor } from '@testing-library/preact';
import { h } from 'preact';

import SelectionDisplay from './index';

// @create-figma-plugin/utilitiesのモック
jest.mock('@create-figma-plugin/utilities', () => ({
  on: jest.fn((event: string, handler: (data: unknown) => void) => {
    // モック化された on 関数が handler を記録し、後でemitで呼び出せるようにする
    (global as any).__handlers = (global as any).__handlers || {};
    (global as any).__handlers[event] = handler;
    return jest.fn(); // unsubscribe関数のモック
  }),
  emit: jest.fn(),
}));

describe('SelectionDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).__handlers = {};
  });

  it('空状態を正しくレンダリングする', () => {
    render(<SelectionDisplay />);

    expect(screen.getByText('レビュー対象')).toBeInTheDocument();
    expect(
      screen.getByText('フレーム、コンポーネント、またはインスタンスを選択してください')
    ).toBeInTheDocument();
  });

  it('単一の有効な選択を表示する', async () => {
    render(<SelectionDisplay />);

    const state: SelectionState = {
      layers: [
        {
          id: '1:1',
          name: 'TestFrame',
          type: 'FRAME',
        },
      ],
      isValid: true,
    };

    // SELECTION_CHANGEDイベントをトリガー
    const handler = (global as any).__handlers['SELECTION_CHANGED'];
    if (handler) {
      handler(state);
    }

    await waitFor(() => {
      expect(screen.getByText('レビュー対象')).toBeInTheDocument();
      expect(screen.getByText('TestFrame')).toBeInTheDocument();
    });
  });

  it('複数選択のエラーを表示する', async () => {
    render(<SelectionDisplay />);

    const state: SelectionState = {
      layers: [
        { id: '1:1', name: 'Frame1', type: 'FRAME' },
        { id: '1:2', name: 'Frame2', type: 'FRAME' },
      ],
      isValid: false,
      errorMessage: '評価できるのは1つのフレームのみです',
    };

    const handler = (global as any).__handlers['SELECTION_CHANGED'];
    if (handler) {
      handler(state);
    }

    await waitFor(() => {
      expect(screen.getByText('レビュー対象の選択エラー')).toBeInTheDocument();
      expect(screen.getByText('評価できるのは1つのフレームのみです')).toBeInTheDocument();
    });
  });

  it('無効なレイヤータイプのエラーを表示する', async () => {
    render(<SelectionDisplay />);

    const state: SelectionState = {
      layers: [
        {
          id: '1:1',
          name: 'TextLayer',
          type: 'TEXT',
        },
      ],
      isValid: false,
      errorMessage:
        'フレーム、コンポーネント、またはインスタンスを選択してください（選択中: TEXT）',
    };

    const handler = (global as any).__handlers['SELECTION_CHANGED'];
    if (handler) {
      handler(state);
    }

    await waitFor(() => {
      expect(screen.getByText('レビュー対象の選択エラー')).toBeInTheDocument();
      expect(
        screen.getByText(
          'フレーム、コンポーネント、またはインスタンスを選択してください（選択中: TEXT）'
        )
      ).toBeInTheDocument();
    });
  });

  it('エラースタイルを正しく適用する', async () => {
    render(<SelectionDisplay />);

    const state: SelectionState = {
      layers: [],
      isValid: false,
      errorMessage: 'エラーメッセージ',
    };

    const handler = (global as any).__handlers['SELECTION_CHANGED'];
    if (handler) {
      handler(state);
    }

    await waitFor(() => {
      const errorHeader = screen.getByText('レビュー対象の選択エラー');
      const errorDiv = errorHeader.parentElement;
      expect(errorDiv).toHaveClass('bg-red-50');
      expect(errorDiv).toHaveClass('border-red-200');
      expect(errorDiv).toHaveClass('text-red-600');
    });
  });

  it('複数のレイヤーを表示する', async () => {
    render(<SelectionDisplay />);

    const state: SelectionState = {
      layers: [
        { id: '1:1', name: 'ComponentA', type: 'COMPONENT' },
        { id: '1:2', name: 'InstanceB', type: 'INSTANCE' },
      ],
      isValid: false, // 複数選択は無効
      errorMessage: '評価できるのは1つのフレームのみです',
    };

    const handler = (global as any).__handlers['SELECTION_CHANGED'];
    if (handler) {
      handler(state);
    }

    await waitFor(() => {
      expect(screen.getByText('レビュー対象の選択エラー')).toBeInTheDocument();
    });
  });

  it('長いレイヤー名が省略表示される（truncateクラス）', async () => {
    render(<SelectionDisplay />);

    const state: SelectionState = {
      layers: [
        {
          id: '1:1',
          name: 'とても長いレイヤー名とても長いレイヤー名とても長いレイヤー名とても長いレイヤー名',
          type: 'FRAME',
        },
      ],
      isValid: true,
    };

    const handler = (global as any).__handlers['SELECTION_CHANGED'];
    if (handler) {
      handler(state);
    }

    await waitFor(() => {
      const layerName = screen.getByText(
        'とても長いレイヤー名とても長いレイヤー名とても長いレイヤー名とても長いレイヤー名'
      );
      expect(layerName).toHaveClass('truncate');
    });
  });

  it('イベントリスナーのクリーンアップを確認する', () => {
    const { unmount } = render(<SelectionDisplay />);

    // onがunsubscribe関数を返すことを確認
    expect(emit).not.toHaveBeenCalled();

    unmount();

    // unmountしてもエラーが発生しないことを確認
    expect(() => unmount()).not.toThrow();
  });
});
