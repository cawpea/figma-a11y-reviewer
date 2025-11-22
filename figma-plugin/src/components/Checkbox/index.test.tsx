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
});
