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

  it('適切なデフォルトスタイルクラスを持つ', () => {
    render(<Heading>タイトル</Heading>);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveClass('text-sm');
    expect(heading).toHaveClass('font-semibold');
    expect(heading).toHaveClass('text-gray-800');
    expect(heading).toHaveClass('mb-1.5');
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
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('justify-between');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('mb-3');
  });

  it('rightContentが指定された場合に右側にコンテンツを表示する', () => {
    render(<Heading rightContent={<button>ボタン</button>}>タイトル</Heading>);

    const heading = screen.getByRole('heading', { level: 3 });
    const button = screen.getByRole('button');

    expect(heading).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('ボタン');
  });

  it('rightContentありの場合とない場合でmarginが異なる', () => {
    const { container: container1 } = render(<Heading>タイトル1</Heading>);
    const { container: container2 } = render(
      <Heading rightContent={<span>右側</span>}>タイトル2</Heading>
    );

    const heading1 = container1.querySelector('h3');
    const wrapper2 = container2.querySelector('div');

    expect(heading1).toHaveClass('mb-1.5');
    expect(wrapper2).toHaveClass('mb-3');
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
