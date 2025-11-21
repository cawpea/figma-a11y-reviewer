import { h } from 'preact';

interface ScoreCardProps {
  score: number;
}

export default function ScoreCard({ score }: ScoreCardProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-lg mb-5 text-center">
      <div className="text-5xl font-bold mb-1">{score}</div>
      <div className="text-[11px] opacity-90">総合スコア</div>
    </div>
  );
}
