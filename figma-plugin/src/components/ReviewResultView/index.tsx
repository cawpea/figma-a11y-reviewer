import { Button } from '@create-figma-plugin/ui';
import type { EvaluationResult, Issue, SelectedLayer } from '@shared/types';
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import Heading from '../Heading';
import ResultView from '../ResultView';

interface ReviewResultViewProps {
  result: EvaluationResult;
  selectedLayers: SelectedLayer[];
  onClose: () => void;
  onIssueClick: (issue: Issue, rootNodeId?: string) => void;
}

export default function ReviewResultView({
  result,
  selectedLayers,
  onClose,
  onIssueClick,
}: ReviewResultViewProps) {
  // 初回表示時のレイヤー情報を保持（変更されないようにする）
  const initialLayersRef = useRef<SelectedLayer[]>(selectedLayers);

  // ページ表示時にスクロール位置をトップにリセット
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-inter text-xs p-4 text-gray-800 bg-white h-full">
      {/* 閉じるボタン */}
      <div className="mb-4">
        <Button onClick={onClose} secondary>
          ← 閉じる
        </Button>
      </div>

      {/* レビュー対象 */}
      <div className="mb-3">
        <Heading>レビュー対象</Heading>
        <div className="space-y-1">
          {initialLayersRef.current.map((layer) => (
            <div key={layer.id} className="text-[11px] text-gray-800 truncate">
              {layer.name}
            </div>
          ))}
        </div>
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
