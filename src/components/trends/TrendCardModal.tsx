'use client';

import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ScorePill from './ScorePill';
import Sparkline, { SparklineData } from './Sparkline';
import SaveButton from './SaveButton';
import { Trend } from '@/types/trends';

export interface TrendCardModalProps {
  trend: Trend;
  trigger?: ReactNode;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export default function TrendCardModal({
  trend,
  trigger,
  className,
  onOpenChange,
  defaultOpen = false
}: TrendCardModalProps) {
  const [open, setOpen] = useState(defaultOpen);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  // Default trigger button if none provided
  const defaultTrigger = (
    <Button variant="outline" className="w-full justify-between">
      <span className="truncate">{trend.title}</span>
      <ScorePill score={trend.score} size="sm" showTooltip={false} />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-left leading-tight">
              {trend.title}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <ScorePill score={trend.score} size="lg" />
              <SaveButton 
                trend={trend} 
                size="icon" 
                showLabel={false}
                className="ml-2"
              />
            </div>
          </div>
        </DialogHeader>
        
        <Separator />
        
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Trend Progression
                </h4>
                <Sparkline 
                  data={trend.sparkData} 
                  height={80}
                  strokeColor="#3b82f6"
                  strokeWidth={3}
                />
              </div>
              
              <div className="text-xs text-gray-500">
                <p>
                  <strong>Score:</strong> {trend.score.toFixed(1)}/100
                </p>
                <p>
                  <strong>Data Points:</strong> {trend.sparkData.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
