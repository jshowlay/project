'use client';

import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScorePillProps {
  score: number;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ScorePill({ score, label, showIcon = true, size = 'md' }: ScorePillProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-3 w-3" />;
    if (score >= 60) return <Minus className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-base px-4 py-2';
      default:
        return 'text-sm px-3 py-1.5';
    }
  };

  return (
    <Badge className={`${getScoreColor(score)} ${getSizeClasses()} border`}>
      {showIcon && <span className="mr-1">{getScoreIcon(score)}</span>}
      {label && <span className="mr-1">{label}:</span>}
      {score.toFixed(1)}
    </Badge>
  );
}

