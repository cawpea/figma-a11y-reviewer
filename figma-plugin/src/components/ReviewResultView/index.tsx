import { Button } from '@create-figma-plugin/ui';
import type { CategoryResult, EvaluationResult, Issue, SelectedLayer } from '@shared/types';
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import { categoryLabels } from '../../constants/agents';
import CategorySection from '../CategorySection';
import Heading from '../Heading';
import MetadataDisplay from '../MetadataDisplay';

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
    <div className="font-inter text-xs p-4 text-gray-800 bg-white h-full flex flex-col gap-5">
      {/* 閉じるボタン */}
      <header>
        <Button onClick={onClose} secondary>
          ← 閉じる
        </Button>
      </header>

      {/* レビュー対象 */}
      <section>
        <Heading>レビュー対象</Heading>
        <div className="space-y-1">
          {initialLayersRef.current.map((layer) => (
            <div key={layer.id} className="text-xs text-gray-800 truncate">
              {layer.name}
            </div>
          ))}
        </div>
      </section>

      {/* 詳細と提案 */}
      <section>
        <Heading>レビュー結果</Heading>
        <div>
          {Object.entries(result.categories).map(([key, category]: [string, CategoryResult]) => (
            <CategorySection
              key={key}
              categoryKey={key}
              category={category}
              categoryLabel={categoryLabels[key] || key}
              rootNodeId={result.metadata.rootNodeId}
              onIssueClick={onIssueClick}
            />
          ))}

          <MetadataDisplay metadata={result.metadata} />
        </div>
      </section>
    </div>
  );
}
