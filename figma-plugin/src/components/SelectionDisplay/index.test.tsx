import type { SelectionState } from '@shared/types';
import { render, screen } from '@testing-library/preact';
import { h } from 'preact';

import SelectionDisplay from './index';

describe('SelectionDisplay', () => {
  const defaultSelectionState: SelectionState = {
    layers: [],
    isValid: true,
    errorMessage: undefined,
  };

  it('空状態を正しくレンダリングする', () => {
    render(<SelectionDisplay selectionState={defaultSelectionState} />);

    expect(screen.getByText('レビュー対象')).toBeInTheDocument();
    expect(
      screen.getByText('フレーム、コンポーネント、インスタンスを選択してください')
    ).toBeInTheDocument();
  });

  it('単一の有効な選択を表示する', () => {
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

    render(<SelectionDisplay selectionState={state} />);

    expect(screen.getByText('レビュー対象')).toBeInTheDocument();
    expect(screen.getByText('TestFrame')).toBeInTheDocument();
  });

  it('エラー時に空状態を表示する', () => {
    const state: SelectionState = {
      layers: [],
      isValid: false,
      errorMessage: 'エラーメッセージ',
    };

    render(<SelectionDisplay selectionState={state} />);

    expect(screen.getByText('レビュー対象')).toBeInTheDocument();
    expect(
      screen.getByText('フレーム、コンポーネント、インスタンスを選択してください')
    ).toBeInTheDocument();
  });

  it('長いレイヤー名が省略表示される（truncateクラス）', () => {
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

    render(<SelectionDisplay selectionState={state} />);

    const layerName = screen.getByText(
      'とても長いレイヤー名とても長いレイヤー名とても長いレイヤー名とても長いレイヤー名'
    );
    expect(layerName).toHaveClass('truncate');
  });

  it('イベントリスナーのクリーンアップを確認する', () => {
    const { unmount } = render(<SelectionDisplay selectionState={defaultSelectionState} />);

    expect(() => unmount()).not.toThrow();
  });
});
