'use client';

import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  MessageSquare, 
  Play, 
  Newspaper, 
  Twitter,
  Globe,
  BookOpen,
  Instagram
} from 'lucide-react';

interface SourceChipsProps {
  sources: string[];
  size?: 'sm' | 'md';
}

export function SourceChips({ sources, size = 'md' }: SourceChipsProps) {
  const getSourceIcon = (source: string) => {
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('google') || sourceLower.includes('trends')) {
      return <TrendingUp className="h-3 w-3" />;
    }
    if (sourceLower.includes('reddit')) {
      return <MessageSquare className="h-3 w-3" />;
    }
    if (sourceLower.includes('youtube') || sourceLower.includes('video')) {
      return <Play className="h-3 w-3" />;
    }
    if (sourceLower.includes('news') || sourceLower.includes('article')) {
      return <Newspaper className="h-3 w-3" />;
    }
    if (sourceLower.includes('twitter') || sourceLower.includes('x')) {
      return <Twitter className="h-3 w-3" />;
    }
    if (sourceLower.includes('nytimes') || sourceLower.includes('nyt')) {
      return <BookOpen className="h-3 w-3" />;
    }
    if (sourceLower.includes('instagram') || sourceLower.includes('ig')) {
      return <Instagram className="h-3 w-3" />;
    }
    return <Globe className="h-3 w-3" />;
  };

  const getSourceColor = (source: string) => {
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('google') || sourceLower.includes('trends')) {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
    if (sourceLower.includes('reddit')) {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
    if (sourceLower.includes('youtube')) {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    if (sourceLower.includes('news')) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    if (sourceLower.includes('twitter') || sourceLower.includes('x')) {
      return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
    }
    if (sourceLower.includes('nytimes') || sourceLower.includes('nyt')) {
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
    if (sourceLower.includes('instagram') || sourceLower.includes('ig')) {
      return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    }
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';

  return (
    <div className="flex flex-wrap gap-1">
      {sources.map((source) => (
        <Badge 
          key={source} 
          variant="outline" 
          className={`${getSourceColor(source)} ${sizeClasses} border`}
        >
          <span className="mr-1">{getSourceIcon(source)}</span>
          {source}
        </Badge>
      ))}
    </div>
  );
}

