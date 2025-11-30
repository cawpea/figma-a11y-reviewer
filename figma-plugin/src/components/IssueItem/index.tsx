import { h } from 'preact';

import type { Issue } from '../../../../shared/src/types';
import Badge from '../Badge';
import Button from '../Button';

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
    <div
      className={`
        w-full text-left border-l-4 ${severityColors[issue.severity]}
        p-2 pr-16 mb-1.5 text-[11px] rounded-r bg-white
        relative
        transition-colors duration-200
      `}
    >
      <Badge severity={issue.severity} className="mr-1.5" />
      {issue.message}
      {issue.suggestion && (
        <div className="text-gray-600 mt-1 text-[10px]">💡 {issue.suggestion}</div>
      )}
      <Button
        onClick={() => isClickable && onIssueClick(issue, rootNodeId)}
        disabled={!isClickable}
        variant="secondary"
        className="absolute top-1 right-1 text-[10px] px-2 py-1"
      >
        選択
      </Button>
    </div>
  );
}
