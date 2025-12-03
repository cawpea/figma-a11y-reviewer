import { emit, on } from '@create-figma-plugin/utilities';
import { type ComponentChildren, createContext, h } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { type FeatureFlag, featureFlagConfigs } from '../../constants/featureFlags';

import type { FeatureFlagContextValue } from './types';

export const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

interface FeatureFlagProviderProps {
  children: ComponentChildren;
}

export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  // デフォルト値の初期化
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    featureFlagConfigs.forEach((config) => {
      defaults[config.key] = config.defaultEnabled;
    });
    return defaults as Record<FeatureFlag, boolean>;
  });

  // マウント時にmain.tsから読み込み
  useEffect(() => {
    // main.tsへ読み込みリクエスト
    emit('LOAD_FEATURE_FLAGS');

    // main.tsからの読み込み結果を受信
    return on('FEATURE_FLAGS_LOADED', (loadedFlags: Record<string, boolean>) => {
      setFlags((prev) => ({ ...prev, ...loadedFlags }));
    });
  }, []);

  // main.tsへ保存リクエスト
  const saveFlags = useCallback((newFlags: Record<FeatureFlag, boolean>) => {
    emit('SAVE_FEATURE_FLAGS', newFlags);
  }, []);

  // トグル処理
  const toggleFlag = useCallback(
    (flag: FeatureFlag) => {
      setFlags((prev) => {
        const updated = { ...prev, [flag]: !prev[flag] };
        saveFlags(updated);
        return updated;
      });
    },
    [saveFlags]
  );

  // セッター処理
  const setFlag = useCallback(
    (flag: FeatureFlag, enabled: boolean) => {
      setFlags((prev) => {
        const updated = { ...prev, [flag]: enabled };
        saveFlags(updated);
        return updated;
      });
    },
    [saveFlags]
  );

  // 有効チェック
  const isEnabled = useCallback(
    (flag: FeatureFlag) => {
      return flags[flag] ?? false;
    },
    [flags]
  );

  const value: FeatureFlagContextValue = {
    flags,
    isEnabled,
    toggleFlag,
    setFlag,
  };

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}
