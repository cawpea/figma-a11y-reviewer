export enum FeatureFlag {
  // 将来的に追加される機能フラグの例
  EXAMPLE_FEATURE = 'example_feature',
}

export interface FeatureFlagConfig {
  key: FeatureFlag;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

export const FEATURE_FLAG_STORAGE_KEY = 'figma-ui-reviewer-feature-flags';

export const featureFlagConfigs: FeatureFlagConfig[] = [
  {
    key: FeatureFlag.EXAMPLE_FEATURE,
    label: '例: 新機能',
    description: 'これは機能トグルのデモです',
    defaultEnabled: false,
  },
];
