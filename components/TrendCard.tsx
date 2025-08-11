'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface TrendCardProps {
  trend: {
    id: string;
    keyword: string;
    score: number;
    velocity: number;
    acceleration: number;
    agreement: number;
    freshness: number;
    novelty: number;
    sources: string[];
    angles: { [platform: string]: string[] };
    hooks: { [platform: string]: string[] };
    keywords: string[];
    timestamp: string;
  };
  platforms: string[];
}

export function TrendCard({ trend, platforms }: TrendCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  return (
    <Card className="bg-card border-gray-800 hover:border-golden/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              {trend.keyword}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getScoreBadgeColor(trend.score)}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend.score.toFixed(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(trend.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Velocity:</span>
            <span className={getScoreColor(trend.velocity)}>{trend.velocity.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Acceleration:</span>
            <span className={getScoreColor(trend.acceleration)}>{trend.acceleration.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Agreement:</span>
            <span className={getScoreColor(trend.agreement)}>{trend.agreement.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Freshness:</span>
            <span className={getScoreColor(trend.freshness)}>{trend.freshness.toFixed(1)}</span>
          </div>
        </div>

        {/* Sources */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Sources</h4>
          <div className="flex flex-wrap gap-1">
            {trend.sources.map((source) => (
              <Badge key={source} variant="outline" className="text-xs">
                {source}
              </Badge>
            ))}
          </div>
        </div>

        <Separator className="bg-gray-800" />

        {/* Platform Content */}
        {platforms.map((platform) => (
          <div key={platform} className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">{platform}</h4>
            
            {/* Angles */}
            {trend.angles[platform] && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2">Angles</h5>
                <div className="space-y-2">
                  {trend.angles[platform].map((angle, index) => (
                    <div key={index} className="flex items-start justify-between gap-2 p-2 bg-secondary rounded-lg">
                      <p className="text-sm text-foreground flex-1">{angle}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(angle, 'Angle')}
                        className="h-6 w-6 p-0 text-golden hover:text-golden/80"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hooks */}
            {trend.hooks[platform] && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2">Hooks</h5>
                <div className="space-y-2">
                  {trend.hooks[platform].map((hook, index) => (
                    <div key={index} className="flex items-start justify-between gap-2 p-2 bg-secondary rounded-lg">
                      <p className="text-sm text-foreground flex-1">{hook}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(hook, 'Hook')}
                        className="h-6 w-6 p-0 text-golden hover:text-golden/80"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Keywords */}
        {trend.keywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Related Keywords</h4>
            <div className="flex flex-wrap gap-1">
              {trend.keywords.slice(0, 6).map((keyword) => (
                <Badge key={keyword} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

