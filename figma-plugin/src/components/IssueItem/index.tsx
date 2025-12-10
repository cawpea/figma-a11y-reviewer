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
  // nodeIds優先、なければnodeId、なければrootNodeId
  const hasNodes = issue.nodeIds ? issue.nodeIds.length > 0 : !!issue.nodeId;
  const isClickable = hasNodes || rootNodeId;
  const nodeCount = issue.nodeIds ? issue.nodeIds.length : issue.nodeId ? 1 : 0;

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
        <div className="flex items-center gap-2">
          <Badge severity={issue.severity} className="mr-1.5" />
          {/* ノード数バッジ（複数の場合のみ表示） */}
          {nodeCount > 1 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
              {nodeCount}個のノード
            </span>
          )}
        </div>
        <Button
          onClick={() => isClickable && onIssueClick(issue, rootNodeId)}
          disabled={!isClickable}
          secondary
        >
          選択
        </Button>
      </header>
      <p className="font-medium text-[12px] leading-5">{issue.message}</p>
      {issue.suggestion && (
        <p className="text-yellow-900 mt-1 text-[11px] bg-yellow-50 p-2 rounded relative">
          <span className="absolute">💡</span>
          <span className="leading-4 ml-[1rem] inline-block">{issue.suggestion}</span>
        </p>
      )}
    </article>
  );
}
