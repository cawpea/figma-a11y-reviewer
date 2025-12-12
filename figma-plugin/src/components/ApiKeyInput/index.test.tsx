import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { h } from 'preact';

import { ApiKeyInput } from './index';

describe('ApiKeyInput', () => {
  const mockOnChange = jest.fn();
  const mockIsValid = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockIsValid.mockClear();
  });

  it('コンポーネントが正しくレンダリングされる', () => {
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput value="" onChange={mockOnChange} isValid={mockIsValid} />
    );

    expect(screen.getByText('API Key (Claude)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('sk-ant-api03-...')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'API Keyを取得' })).toHaveAttribute(
      'href',
      'https://console.anthropic.com/settings/keys'
    );
  });

  it('入力値が正しく表示される', () => {
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput
        value="sk-ant-api03-test"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    const input = screen.getByPlaceholderText(
      'sk-ant-api03-...'
    ) as HTMLInputElement;
    expect(input.value).toBe('sk-ant-api03-test');
  });

  it('入力時にonChangeが呼ばれる', async () => {
    const user = userEvent.setup();
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput value="" onChange={mockOnChange} isValid={mockIsValid} />
    );

    const input = screen.getByPlaceholderText('sk-ant-api03-...');
    await user.type(input, 'sk-ant-api03-test');

    // 各文字入力ごとにonChangeが呼ばれるため、複数回呼ばれる
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('デフォルトではパスワードが非表示になる', () => {
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput
        value="sk-ant-api03-test"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    const input = screen.getByPlaceholderText(
      'sk-ant-api03-...'
    ) as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('表示切替ボタンをクリックするとパスワードが表示される', async () => {
    const user = userEvent.setup();
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput
        value="sk-ant-api03-test"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    const toggleButton = screen.getByRole('button', {
      name: 'API Keyを表示',
    });
    await user.click(toggleButton);

    const input = screen.getByPlaceholderText(
      'sk-ant-api03-...'
    ) as HTMLInputElement;
    expect(input.type).toBe('text');
  });

  it('表示切替ボタンを2回クリックすると元に戻る', async () => {
    const user = userEvent.setup();
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput
        value="sk-ant-api03-test"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    const toggleButton = screen.getByRole('button', {
      name: 'API Keyを表示',
    });
    await user.click(toggleButton);
    await user.click(toggleButton);

    const input = screen.getByPlaceholderText(
      'sk-ant-api03-...'
    ) as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('表示切替後はaria-labelが変わる', async () => {
    const user = userEvent.setup();
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput
        value="sk-ant-api03-test"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    const toggleButton = screen.getByRole('button', {
      name: 'API Keyを表示',
    });
    await user.click(toggleButton);

    expect(
      screen.getByRole('button', { name: 'API Keyを非表示' })
    ).toBeInTheDocument();
  });

  it('空の値の場合はバリデーションエラーが表示されない', () => {
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput value="" onChange={mockOnChange} isValid={mockIsValid} />
    );

    expect(
      screen.queryByText('API Keyは "sk-ant-api03-" で始まる必要があります')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('このAPI Keyはデバイスにローカルに保存されます')
    ).toBeInTheDocument();
  });

  it('値が空でない場合でisValidがfalseの場合はエラーが表示される', () => {
    mockIsValid.mockReturnValue(false);
    render(
      <ApiKeyInput
        value="invalid-key"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    expect(
      screen.getByText('API Keyは "sk-ant-api03-" で始まる必要があります')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('このAPI Keyはデバイスにローカルに保存されます')
    ).not.toBeInTheDocument();
  });

  it('値が空でない場合でisValidがtrueの場合は説明文が表示される', () => {
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput
        value="sk-ant-api03-test"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    expect(
      screen.queryByText('API Keyは "sk-ant-api03-" で始まる必要があります')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('このAPI Keyはデバイスにローカルに保存されます')
    ).toBeInTheDocument();
  });

  it('バリデーションエラー時にaria-invalidがtrueになる', () => {
    mockIsValid.mockReturnValue(false);
    render(
      <ApiKeyInput
        value="invalid-key"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    const input = screen.getByPlaceholderText('sk-ant-api03-...');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('バリデーション成功時にaria-invalidがfalseになる', () => {
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput
        value="sk-ant-api03-test"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    const input = screen.getByPlaceholderText('sk-ant-api03-...');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('エラーメッセージがrole="alert"を持つ', () => {
    mockIsValid.mockReturnValue(false);
    render(
      <ApiKeyInput
        value="invalid-key"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    const errorMessage = screen.getByText(
      'API Keyは "sk-ant-api03-" で始まる必要があります'
    );
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  it('API Key取得リンクが正しい属性を持つ', () => {
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput value="" onChange={mockOnChange} isValid={mockIsValid} />
    );

    const link = screen.getByRole('link', { name: 'API Keyを取得' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('入力フィールドが適切なaria属性を持つ', () => {
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput
        value="sk-ant-api03-test"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    const input = screen.getByPlaceholderText('sk-ant-api03-...');
    expect(input).toHaveAttribute('aria-labelledby');
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('表示切替ボタンがaria-controlsを持つ', () => {
    mockIsValid.mockReturnValue(true);
    render(
      <ApiKeyInput
        value="sk-ant-api03-test"
        onChange={mockOnChange}
        isValid={mockIsValid}
      />
    );

    const toggleButton = screen.getByRole('button', {
      name: 'API Keyを表示',
    });
    expect(toggleButton).toHaveAttribute('aria-controls');
  });
});
