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
];

export const categoryLabels: Record<string, string> = {
  accessibility: 'アクセシビリティ',
  layout: 'レイアウト',
  naming: '命名規則',
};
