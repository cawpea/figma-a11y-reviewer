import { describe, expect, it } from '@jest/globals';
import { renderHook } from '@testing-library/preact';

import { useFeatureFlags } from './useFeatureFlags';

describe('useFeatureFlags', () => {
  it('Provider外で使用するとエラーをスローする', () => {
    // console.errorをモック
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useFeatureFlags());
    }).toThrow('useFeatureFlags must be used within FeatureFlagProvider');

    consoleErrorSpy.mockRestore();
  });
});
