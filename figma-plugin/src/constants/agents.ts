export const AGENT_TIME_ESTIMATE = 30; // seconds per agent

export interface AgentOption {
  id: string;
  label: string;
  description: string;
}

export const agentOptions: AgentOption[] = [
  {
    id: 'accessibility-a',
    label: 'WCAG 2.2 A基準',
    description: 'コントラスト比 3:1以上（大テキスト 1.5:1）',
  },
  {
    id: 'accessibility-aa',
    label: 'WCAG 2.2 AA基準',
    description: 'コントラスト比 4.5:1以上（大テキスト 3:1）',
  },
  {
    id: 'accessibility-aaa',
    label: 'WCAG 2.2 AAA基準',
    description: 'コントラスト比 7:1以上（大テキスト 4.5:1）',
  },
];

export const categoryLabels: Record<string, string> = {
  'accessibility-a': 'アクセシビリティ (A)',
  'accessibility-aa': 'アクセシビリティ (AA)',
  'accessibility-aaa': 'アクセシビリティ (AAA)',
  layout: 'レイアウト',
  naming: '命名規則',
};
