'use client';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface ScorePillProps {
  score: number;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScorePill({ 
  score, 
  className, 
  showTooltip = true, 
  size = 'md' 
}: ScorePillProps) {
  // Validate and clamp score to 0-100 range
  const validScore = Math.max(0, Math.min(100, score));
  const displayScore = validScore.toFixed(1);

  // Determine color based on score ranges
  const getColorClasses = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 60) return 'bg-lime-100 text-lime-800 border-lime-200';
    if (score >= 40) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (score >= 20) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const pillContent = (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-semibold',
        getColorClasses(validScore),
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={`Score: ${displayScore} out of 100`}
    >
      {displayScore}
    </div>
  );

  if (!showTooltip) {
    return pillContent;
  }

  // Get score description for tooltip
  const getScoreDescription = (score: number) => {
    if (score >= 80) return 'Excellent - High trending momentum';
    if (score >= 60) return 'Good - Strong trending activity';
    if (score >= 40) return 'Moderate - Steady trending';
    if (score >= 20) return 'Low - Minimal trending';
    return 'Poor - Very low trending activity';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {pillContent}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            <span className="font-semibold">{displayScore}/100</span>
            <br />
            {getScoreDescription(validScore)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
