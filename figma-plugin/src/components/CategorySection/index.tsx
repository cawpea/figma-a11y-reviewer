import { h } from 'preact';

import type { CategoryResult, Issue } from '../../../../shared/src/types';
import IssueItem from '../IssueItem';
import PositiveItem from '../PositiveItem';

interface CategorySectionProps {
  categoryKey: string;
  category: CategoryResult;
  categoryLabel: string;
  rootNodeId?: string;
  onIssueClick: (issue: Issue, rootNodeId?: string) => void;
}

export default function CategorySection({
  categoryKey: _categoryKey,
  category,
  categoryLabel,
  rootNodeId,
  onIssueClick,
}: CategorySectionProps) {
  return (
    <div className="bg-gray-50 rounded-md p-3 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-xs">{categoryLabel}</span>
        <span className="font-semibold text-xs text-blue-500">{category.score}点</span>
      </div>

      {/* Issues */}
      {category.issues.map((issue: Issue, index: number) => (
        <IssueItem key={index} issue={issue} rootNodeId={rootNodeId} onIssueClick={onIssueClick} />
      ))}

      {/* Positives */}
      {category.positives && category.positives.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          {category.positives.map((positive: string, index: number) => (
            <PositiveItem key={index} text={positive} />
          ))}
        </div>
      )}
    </div>
  );
}
