import { FitScore } from '../types';
import { clsx } from 'clsx';

interface Props {
  fitScore: FitScore;
  size?: 'sm' | 'md' | 'lg';
}

export function FitScoreBadge({ fitScore, size = 'md' }: Props) {
  const score = fitScore.total;

  const color = !fitScore.isEligible
    ? 'bg-red-100 text-red-700 border-red-200'
    : score >= 75
    ? 'bg-green-100 text-green-700 border-green-200'
    : score >= 50
    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';

  const label = !fitScore.isEligible
    ? 'Ineligible'
    : score >= 75
    ? 'Great Match'
    : score >= 50
    ? 'Good Match'
    : 'Low Match';

  return (
    <div className={clsx('inline-flex flex-col items-center border rounded-lg px-2 py-1', color, {
      'text-xs': size === 'sm',
      'text-sm': size === 'md',
      'text-base': size === 'lg',
    })}>
      <span className="font-bold">{fitScore.isEligible ? `${score}%` : '✗'}</span>
      <span className={clsx('font-medium', { 'text-xs': size !== 'sm' })}>{label}</span>
    </div>
  );
}
