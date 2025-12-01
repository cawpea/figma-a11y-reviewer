import { Button } from '@create-figma-plugin/ui';
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
      <div className="absolute top-1 right-1">
        <Button
          onClick={() => isClickable && onIssueClick(issue, rootNodeId)}
          disabled={!isClickable}
          secondary
        >
          選択
        </Button>
      </div>
    </div>
  );
}
