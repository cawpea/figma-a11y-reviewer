import type { FeatureFlag } from '../../constants/featureFlags';

export interface FeatureFlagContextValue {
  flags: Record<FeatureFlag, boolean>;
  isEnabled: (flag: FeatureFlag) => boolean;
  toggleFlag: (flag: FeatureFlag) => void;
  setFlag: (flag: FeatureFlag, enabled: boolean) => void;
}
