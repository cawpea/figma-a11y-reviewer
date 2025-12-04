import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/preact';
import { h } from 'preact';

import Heading from './index';

describe('Heading', () => {
  it('子要素をh3要素内にレンダリングする', () => {
    render(<Heading>テストタイトル</Heading>);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('テストタイトル');
  });

  it('カスタムclassNameを適用する', () => {
    render(<Heading className="custom-class">タイトル</Heading>);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveClass('custom-class');
  });

  it('rightContentが指定されていない場合はh3要素のみをレンダリングする', () => {
    const { container } = render(<Heading>タイトル</Heading>);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();

    // div要素でラップされていないことを確認
    expect(container.firstChild).toBe(heading);
  });

  it('rightContentが指定された場合はdiv要素でラップする', () => {
    const { container } = render(
      <Heading rightContent={<button>ボタン</button>}>タイトル</Heading>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
  });

  it('rightContentが指定された場合に右側にコンテンツを表示する', () => {
    render(<Heading rightContent={<button>ボタン</button>}>タイトル</Heading>);

    const heading = screen.getByRole('heading', { level: 3 });
    const button = screen.getByRole('button');

    expect(heading).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('ボタン');
  });

  it('rightContentが指定された場合もカスタムclassNameを適用する', () => {
    const { container } = render(
      <Heading rightContent={<span>右側</span>} className="custom-wrapper">
        タイトル
      </Heading>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-wrapper');
  });

  it('複雑なrightContentを正しくレンダリングする', () => {
    render(
      <Heading
        rightContent={
          <div>
            <button>編集</button>
            <button>削除</button>
          </div>
        }
      >
        タイトル
      </Heading>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('編集');
    expect(buttons[1]).toHaveTextContent('削除');
  });

  it('複数の子要素を含むことができる', () => {
    render(
      <Heading>
        <span>パート1</span>
        <span>パート2</span>
      </Heading>
    );

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('パート1パート2');
  });
});
