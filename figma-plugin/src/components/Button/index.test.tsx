import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { h } from 'preact';

import Button from './index';

describe('Button', () => {
  it('childrenを正しくレンダリングする', () => {
    render(<Button onClick={() => {}}>Click me</Button>);

    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('クリック時にonClickを呼び出す', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByText('Click me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabledプロパティがtrueのときに無効化される', () => {
    render(
      <Button onClick={() => {}} disabled>
        Click me
      </Button>
    );

    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('無効状態ではonClickを呼び出さない', async () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );

    await userEvent.click(screen.getByText('Click me'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('デフォルトでprimaryバリアントクラスを適用する', () => {
    render(<Button onClick={() => {}}>Primary</Button>);

    const button = screen.getByText('Primary');
    expect(button).toHaveClass('bg-blue-500');
  });

  it('secondaryバリアントクラスを適用する', () => {
    render(
      <Button onClick={() => {}} variant="secondary">
        Secondary
      </Button>
    );

    const button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-gray-100');
  });

  it('iconバリアントクラスを適用する', () => {
    render(
      <Button onClick={() => {}} variant="icon">
        Icon
      </Button>
    );

    const button = screen.getByText('Icon');
    expect(button).toHaveClass('w-10');
  });

  it('カスタムclassNameを適用する', () => {
    render(
      <Button onClick={() => {}} className="custom-class">
        Custom
      </Button>
    );

    const button = screen.getByText('Custom');
    expect(button).toHaveClass('custom-class');
  });

  it('title属性を適用する', () => {
    render(
      <Button onClick={() => {}} title="Button title">
        Button
      </Button>
    );

    const button = screen.getByText('Button');
    expect(button).toHaveAttribute('title', 'Button title');
  });

  it('複雑なchildrenをレンダリングする', () => {
    render(
      <Button onClick={() => {}}>
        <span>Icon</span> Text
      </Button>
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText(/Text/)).toBeInTheDocument();
  });
});
