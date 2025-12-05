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

  return (
    <article
      className={`
        flex flex-col gap-2
        w-full text-left border border-gray-300 rounded-md
        p-3 mb-3 text-[12px]
        relative
        transition-colors duration-200
      `}
    >
      <header className="flex items-center justify-between gap-1">
        <Badge severity={issue.severity} className="mr-1.5" />
        <Button
          onClick={() => isClickable && onIssueClick(issue, rootNodeId)}
          disabled={!isClickable}
          secondary
        >
          選択
        </Button>
      </header>
      <h4 className="font-medium text-[12px] leading-5">{issue.message}</h4>
      {issue.suggestion && (
        <p className="text-yellow-900 mt-1 text-[11px] bg-yellow-50 p-2 rounded relative">
          <span className="absolute">💡</span>
          <span className="leading-4 ml-[1rem] inline-block">{issue.suggestion}</span>
        </p>
      )}
    </article>
  );
}
