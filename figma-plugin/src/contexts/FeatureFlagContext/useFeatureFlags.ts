import { useContext } from 'preact/hooks';

import { FeatureFlagContext } from './index';

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  }
  return context;
}
