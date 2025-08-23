'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trend, SaveButtonProps, SaveButtonState } from '@/types/trends';

export default function SaveButton({
  trend,
  size = 'default',
  className,
  showLabel = true,
  onSaveChange,
  disabled = false
}: SaveButtonProps) {
  const [state, setState] = useState<SaveButtonState>({
    isSaved: false,
    isLoading: true,
    error: null
  });

  // Check initial saved status
  useEffect(() => {
    checkSavedStatus();
  }, [trend.id]);

  const checkSavedStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if trend is saved by looking through saved trends
      const response = await fetch('/api/saved');
      const data = await response.json();
      
      if (data.success && data.data?.trends) {
        const isSaved = data.data.trends.some((savedTrend: any) => 
          savedTrend.trend_id === trend.id
        );
        
        setState({
          isSaved,
          isLoading: false,
          error: null
        });
      } else {
        throw new Error(data.error || 'Failed to check saved status');
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
      setState({
        isSaved: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleSaveToggle = async () => {
    if (disabled || state.isLoading) return;

    const newSavedState = !state.isSaved;
    
    // Optimistic update
    setState(prev => ({ ...prev, isSaved: newSavedState, isLoading: true }));
    onSaveChange?.(newSavedState);

    try {
      if (newSavedState) {
        // Save trend using existing API structure
        const response = await fetch('/api/saved', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trend_id: trend.id,
            trend_source: 'demo',
            trend_topic: trend.title,
            trend_title: trend.title,
            trend_score: trend.score,
            trend_velocity: 0,
            trend_acceleration: 0,
            trend_region: 'US',
            trend_tags: [],
            trend_observed_at: new Date().toISOString()
          }),
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to save trend');
        }
      } else {
        // Unsave trend
        const response = await fetch(`/api/saved/${trend.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to unsave trend');
        }
      }

      setState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      console.error('Error toggling save status:', error);
      
      // Revert optimistic update
      setState(prev => ({ 
        ...prev, 
        isSaved: !newSavedState, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      onSaveChange?.(!newSavedState);
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'h-8 px-2 text-xs',
      icon: 'w-3 h-3',
      label: 'text-xs'
    },
    default: {
      button: 'h-9 px-3 text-sm',
      icon: 'w-4 h-4',
      label: 'text-sm'
    },
    lg: {
      button: 'h-10 px-4 text-base',
      icon: 'w-5 h-5',
      label: 'text-base'
    },
    icon: {
      button: 'h-9 w-9 p-0',
      icon: 'w-4 h-4',
      label: 'sr-only'
    }
  };

  const config = sizeConfig[size];

  // Button content
  const buttonContent = (
    <>
      {state.isLoading ? (
        <Loader2 className={cn(config.icon, 'animate-spin')} />
      ) : (
        <Heart 
          className={cn(
            config.icon,
            state.isSaved 
              ? 'fill-red-500 text-red-500' 
              : 'text-gray-400 hover:text-red-500'
          )} 
        />
      )}
      {showLabel && size !== 'icon' && (
        <span className={cn('ml-2', config.label)}>
          {state.isSaved ? 'Saved' : 'Save'}
        </span>
      )}
    </>
  );

  // Tooltip content
  const tooltipContent = state.isSaved 
    ? 'Remove from saved trends' 
    : 'Save this trend';

  // Error state
  if (state.error && !state.isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'text-red-500 border-red-200 hover:bg-red-50',
          config.button,
          className
        )}
        onClick={checkSavedStatus}
        disabled={disabled}
        aria-label="Retry save operation"
      >
        <Loader2 className={cn(config.icon, 'mr-2')} />
        Retry
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={state.isSaved ? "default" : "outline"}
            className={cn(
              config.button,
              state.isSaved && 'bg-red-500 hover:bg-red-600 border-red-500',
              state.isLoading && 'opacity-75 cursor-not-allowed',
              className
            )}
            onClick={handleSaveToggle}
            disabled={disabled || state.isLoading}
            aria-label={tooltipContent}
            aria-pressed={state.isSaved}
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
