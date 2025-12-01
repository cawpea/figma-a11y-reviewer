import { Disclosure } from '@create-figma-plugin/ui';
import { h } from 'preact';
import { useState } from 'preact/hooks';

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
  const [open, setOpen] = useState(true);

  return (
    <Disclosure open={open} onClick={() => setOpen(!open)} title={categoryLabel}>
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
    </Disclosure>
  );
}
