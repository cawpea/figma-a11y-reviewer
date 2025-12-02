import { beforeEach, describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/preact';
import { h } from 'preact';

import { FeatureFlagProvider } from '../../contexts/FeatureFlagContext';

import FeatureTogglePanel from './index';

// process.envのモック
const mockProcessEnv = (nodeEnv: string) => {
  Object.defineProperty(process, 'env', {
    value: { NODE_ENV: nodeEnv },
    writable: true,
    configurable: true,
  });
};

describe('FeatureTogglePanel', () => {
  beforeEach(() => {
    // デフォルトは開発環境
    mockProcessEnv('development');
  });

  it('開発環境でボタンが表示される', () => {
    mockProcessEnv('development');

    render(
      <FeatureFlagProvider>
        <FeatureTogglePanel />
      </FeatureFlagProvider>
    );

    const button = screen.getByRole('button', { name: /機能トグル設定を開く/ });
    expect(button).toBeTruthy();
  });

  it('本番環境でボタンが表示されない', () => {
    mockProcessEnv('production');

    const { container } = render(
      <FeatureFlagProvider>
        <FeatureTogglePanel />
      </FeatureFlagProvider>
    );

    // ボタンが存在しないことを確認
    const button = screen.queryByRole('button', { name: /機能トグル設定を開く/ });
    expect(button).toBeNull();

    // コンテナが空であることを確認
    expect(container.firstChild).toBeNull();
  });
});
