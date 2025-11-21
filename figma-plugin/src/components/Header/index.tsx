import { h } from 'preact';

interface HeaderProps {
  description?: string;
}

export default function Header({
  description = 'フレームまたはコンポーネントを選択して、デザイン品質を評価します。',
}: HeaderProps) {
  return (
    <div className="mb-3">
      <p className="text-gray-600 text-[11px] leading-relaxed">{description}</p>
    </div>
  );
}
