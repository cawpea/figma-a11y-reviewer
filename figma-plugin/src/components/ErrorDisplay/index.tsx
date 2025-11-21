import { h } from 'preact';

interface ErrorDisplayProps {
  error: string;
}

export default function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-[11px] mb-4 max-h-48 overflow-y-auto">
      <div className="font-semibold mb-1">エラーが発生しました</div>
      <div>{error}</div>
    </div>
  );
}
