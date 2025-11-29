import type { EvaluationResult, Issue } from '@shared/types';
import { h } from 'preact';
import { useEffect } from 'preact/hooks';

import Button from '../Button';
import Heading from '../Heading';
import ResultView from '../ResultView';

interface ReviewResultViewProps {
  selectedNodeName: string;
  result: EvaluationResult;
  onClose: () => void;
  onIssueClick: (issue: Issue, rootNodeId?: string) => void;
}

export default function ReviewResultView({
  selectedNodeName,
  result,
  onClose,
  onIssueClick,
}: ReviewResultViewProps) {
  // ページ表示時にスクロール位置をトップにリセット
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-inter text-xs p-4 text-gray-800 bg-white h-full">
      {/* 閉じるボタン */}
      <div className="mb-4">
        <Button onClick={onClose} variant="secondary" className="w-auto">
          ← 閉じる
        </Button>
      </div>

      {/* レビュー対象 */}
      <div className="mb-3">
        <Heading>レビュー対象</Heading>
        <div className="text-[11px] text-gray-800">{selectedNodeName}</div>
      </div>

      {/* 詳細と提案 */}
      <div className="mb-3">
        <Heading>詳細と提案</Heading>
      </div>

      {/* 評価結果 */}
      <ResultView result={result} onIssueClick={onIssueClick} />
    </div>
  );
}
