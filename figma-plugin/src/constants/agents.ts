export const STORAGE_KEY = 'figma-ui-reviewer-selected-agents';
export const AGENT_TIME_ESTIMATE = 30; // seconds per agent

export interface AgentOption {
  id: string;
  label: string;
  description: string;
}

export const agentOptions: AgentOption[] = [
  {
    id: 'accessibility',
    label: 'アクセシビリティ',
    description: 'WCAG 2.2 AA準拠、色のコントラスト、タッチターゲットサイズを評価',
  },
  {
    id: 'styleConsistency',
    label: 'スタイルや命名の一貫性',
    description: 'カラー、テキスト、エフェクトスタイル、命名規則の一貫性を評価',
  },
  {
    id: 'usability',
    label: 'ユーザビリティ',
    description: "Nielsen's 10原則に基づき、使いやすさと直感性を評価",
  },
];

export const categoryLabels: Record<string, string> = {
  accessibility: 'アクセシビリティ',
  styleConsistency: 'スタイルや命名の一貫性',
  usability: 'ユーザビリティ',
  layout: 'レイアウト',
  naming: '命名規則',
};
