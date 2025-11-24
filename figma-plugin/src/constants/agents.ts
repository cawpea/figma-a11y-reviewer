export const STORAGE_KEY = 'figma-ui-reviewer-selected-agents';
export const PLATFORM_STORAGE_KEY = 'figma-ui-reviewer-selected-platform';
export const AGENT_TIME_ESTIMATE = 30; // seconds per agent

export interface AgentOption {
  id: string;
  label: string;
  description: string;
}

export const agentOptions: AgentOption[] = [
  {
    id: 'usability',
    label: 'ユーザビリティ',
    description: "Nielsen's 10原則に基づき、使いやすさと直感性を評価",
  },
  {
    id: 'accessibility',
    label: 'アクセシビリティ',
    description: 'WCAG 2.2 AA準拠、色のコントラスト、タッチターゲットサイズを評価',
  },
  {
    id: 'styleConsistency',
    label: 'スタイルの一貫性',
    description: 'カラー、テキスト、エフェクトスタイル、命名規則の一貫性を評価',
  },
  {
    id: 'platformCompliance',
    label: 'プラットフォーム準拠',
    description: 'iOS (HIG) または Android (Material Design) のガイドラインに準拠',
  },
];

export const categoryLabels: Record<string, string> = {
  accessibility: 'アクセシビリティ',
  styleConsistency: 'スタイルの一貫性',
  usability: 'ユーザビリティ',
  platformCompliance: 'プラットフォーム準拠',
  layout: 'レイアウト',
  naming: '命名規則',
};
