import { h } from 'preact';
import type { CategoryResult, EvaluationResult, Issue } from '../../../../shared/src/types';
import { categoryLabels } from '../../constants/agents';
import CategorySection from '../CategorySection';
import MetadataDisplay from '../MetadataDisplay';
import ScoreCard from '../ScoreCard';

interface ResultViewProps {
  result: EvaluationResult;
  onIssueClick: (issue: Issue, rootNodeId?: string) => void;
}

export default function ResultView({ result, onIssueClick }: ResultViewProps) {
  return (
    <div>
      <ScoreCard score={result.overallScore} />

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
  );
}
