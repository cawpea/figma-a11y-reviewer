import { h } from 'preact';

import type { Issue } from '../../../../shared/src/types';
import Badge from '../Badge';

interface IssueItemProps {
  issue: Issue;
  rootNodeId?: string;
  onIssueClick: (issue: Issue, rootNodeId?: string) => void;
}

export default function IssueItem({ issue, rootNodeId, onIssueClick }: IssueItemProps) {
  const isClickable = issue.nodeId || rootNodeId;

  const severityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500',
  } as const;

  return (
    <button
      onClick={() => isClickable && onIssueClick(issue, rootNodeId)}
      disabled={!isClickable}
      className={`
        w-full text-left border-l-4 ${severityColors[issue.severity]}
        p-2 mb-1.5 text-[11px] rounded-r bg-white
        ${isClickable ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-200' : 'cursor-default'}
        border-none font-inherit color-inherit leading-inherit
      `}
    >
      <Badge severity={issue.severity} className="mr-1.5" />
      {issue.message}
      {issue.suggestion && (
        <div className="text-gray-600 mt-1 text-[10px]">💡 {issue.suggestion}</div>
      )}
    </button>
  );
}
