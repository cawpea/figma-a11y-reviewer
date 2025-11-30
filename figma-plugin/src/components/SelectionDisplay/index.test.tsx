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
      screen.getByText('フレーム、コンポーネント、またはインスタンスを選択してください')
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

  it('複数選択のエラーを表示する', () => {
    const state: SelectionState = {
      layers: [
        { id: '1:1', name: 'Frame1', type: 'FRAME' },
        { id: '1:2', name: 'Frame2', type: 'FRAME' },
      ],
      isValid: false,
      errorMessage: '評価できるのは1つのフレームのみです',
    };

    render(<SelectionDisplay selectionState={state} />);

    expect(screen.getByText('レビュー対象の選択エラー')).toBeInTheDocument();
    expect(screen.getByText('評価できるのは1つのフレームのみです')).toBeInTheDocument();
  });

  it('無効なレイヤータイプのエラーを表示する', () => {
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

    render(<SelectionDisplay selectionState={state} />);

    expect(screen.getByText('レビュー対象の選択エラー')).toBeInTheDocument();
    expect(
      screen.getByText(
        'フレーム、コンポーネント、またはインスタンスを選択してください（選択中: TEXT）'
      )
    ).toBeInTheDocument();
  });

  it('エラースタイルを正しく適用する', () => {
    const state: SelectionState = {
      layers: [],
      isValid: false,
      errorMessage: 'エラーメッセージ',
    };

    render(<SelectionDisplay selectionState={state} />);

    const errorHeader = screen.getByText('レビュー対象の選択エラー');
    const errorDiv = errorHeader.parentElement;
    expect(errorDiv).toHaveClass('bg-red-50');
    expect(errorDiv).toHaveClass('border-red-200');
    expect(errorDiv).toHaveClass('text-red-600');
  });

  it('複数のレイヤーを表示する', () => {
    const state: SelectionState = {
      layers: [
        { id: '1:1', name: 'ComponentA', type: 'COMPONENT' },
        { id: '1:2', name: 'InstanceB', type: 'INSTANCE' },
      ],
      isValid: false,
      errorMessage: '評価できるのは1つのフレームのみです',
    };

    render(<SelectionDisplay selectionState={state} />);

    expect(screen.getByText('レビュー対象の選択エラー')).toBeInTheDocument();
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
