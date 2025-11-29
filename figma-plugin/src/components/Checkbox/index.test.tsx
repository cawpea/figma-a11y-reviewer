import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { h } from 'preact';

import Checkbox from './index';

describe('Checkbox', () => {
  it('指定されたidでチェックボックスをレンダリングする', () => {
    render(<Checkbox id="test-checkbox" checked={false} onChange={() => {}} />);

    const input = screen.getByRole('checkbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'test-checkbox');
  });

  it('checkedプロパティがtrueのときにチェックされる', () => {
    render(<Checkbox id="test" checked={true} onChange={() => {}} />);

    const input = screen.getByRole('checkbox');
    expect(input).toBeChecked();
  });

  it('checkedプロパティがfalseのときにチェックが外れる', () => {
    render(<Checkbox id="test" checked={false} onChange={() => {}} />);

    const input = screen.getByRole('checkbox');
    expect(input).not.toBeChecked();
  });

  it('未チェック状態でクリックされたときtrueでonChangeを呼び出す', async () => {
    const handleChange = jest.fn();
    render(<Checkbox id="test" checked={false} onChange={handleChange} />);

    const input = screen.getByRole('checkbox');
    await userEvent.click(input);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('チェック状態でクリックされたときfalseでonChangeを呼び出す', async () => {
    const handleChange = jest.fn();
    render(<Checkbox id="test" checked={true} onChange={handleChange} />);

    const input = screen.getByRole('checkbox');
    await userEvent.click(input);

    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('チェック時にチェックマークアイコンを表示する', () => {
    const { container } = render(<Checkbox id="test" checked={true} onChange={() => {}} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('未チェック時にチェックマークアイコンを表示しない', () => {
    const { container } = render(<Checkbox id="test" checked={false} onChange={() => {}} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('labelにカスタムclassNameを適用する', () => {
    const { container } = render(
      <Checkbox id="test" checked={false} onChange={() => {}} className="custom-class" />
    );

    const label = container.querySelector('label');
    expect(label).toHaveClass('custom-class');
  });

  it('適切なスタイルクラスを持つ', () => {
    const { container } = render(<Checkbox id="test" checked={false} onChange={() => {}} />);

    const label = container.querySelector('label');
    expect(label).toHaveClass('w-4');
    expect(label).toHaveClass('h-4');
    expect(label).toHaveClass('cursor-pointer');
  });

  it('チェック時にスタイルが変わる', () => {
    const { container, rerender } = render(
      <Checkbox id="test" checked={false} onChange={() => {}} />
    );

    let label = container.querySelector('label');
    expect(label).toHaveClass('bg-white');

    rerender(<Checkbox id="test" checked={true} onChange={() => {}} />);

    label = container.querySelector('label');
    expect(label).toHaveClass('bg-blue-500');
    expect(label).toHaveClass('border-blue-500');
  });

  it('indeterminateがtrueのときにinput要素のindeterminateプロパティが設定される', () => {
    render(<Checkbox id="test" checked={false} onChange={() => {}} indeterminate={true} />);

    const input = screen.getByRole('checkbox') as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
  });

  it('indeterminateがfalseのときにinput要素のindeterminateプロパティが設定されない', () => {
    render(<Checkbox id="test" checked={false} onChange={() => {}} indeterminate={false} />);

    const input = screen.getByRole('checkbox') as HTMLInputElement;
    expect(input.indeterminate).toBe(false);
  });

  it('indeterminateが未指定のときにinput要素のindeterminateプロパティがfalseになる', () => {
    render(<Checkbox id="test" checked={false} onChange={() => {}} />);

    const input = screen.getByRole('checkbox') as HTMLInputElement;
    expect(input.indeterminate).toBe(false);
  });

  it('indeterminate時に横線アイコンを表示する', () => {
    const { container } = render(
      <Checkbox id="test" checked={false} onChange={() => {}} indeterminate={true} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // 横線のパスが含まれることを確認
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('d', 'M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z');
  });

  it('indeterminate時にチェックマークアイコンを表示しない', () => {
    const { container } = render(
      <Checkbox id="test" checked={true} onChange={() => {}} indeterminate={true} />
    );

    const paths = container.querySelectorAll('path');
    // 横線のパスのみが存在することを確認
    expect(paths).toHaveLength(1);
    expect(paths[0]).toHaveAttribute('d', 'M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z');
  });

  it('indeterminate時に適切なスタイルが適用される', () => {
    const { container } = render(
      <Checkbox id="test" checked={false} onChange={() => {}} indeterminate={true} />
    );

    const label = container.querySelector('label');
    expect(label).toHaveClass('bg-blue-500');
    expect(label).toHaveClass('border-blue-500');
  });

  it('indeterminateからcheckedに変更されたときにアイコンが切り替わる', () => {
    const { container, rerender } = render(
      <Checkbox id="test" checked={false} onChange={() => {}} indeterminate={true} />
    );

    let paths = container.querySelectorAll('path');
    // 横線のパスが表示されていることを確認
    expect(paths[0]).toHaveAttribute('d', 'M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z');

    rerender(<Checkbox id="test" checked={true} onChange={() => {}} indeterminate={false} />);

    paths = container.querySelectorAll('path');
    // チェックマークのパスに切り替わっていることを確認
    expect(paths[0]).toHaveAttribute(
      'd',
      'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
    );
  });
});
