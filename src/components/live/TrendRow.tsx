import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import DeltaBadge from './DeltaBadge';

interface TrendRowProps {
  trend: {
    id: string;
    title: string;
    description: string;
    source: string;
    momentum: number;
    volume: number;
    sentiment: number;
    growth_rate: number;
    engagement_rate: number;
    reach: number;
    mentions: number;
    hashtags: string[];
    related_topics: string[];
    created_at: string;
    updated_at: string;
  };
  rank: number;
  previousRank?: number;
  isNew?: boolean;
}

const sourceIcons: Record<string, string> = {
  twitter: '🐦',
  reddit: '🤖',
  instagram: '📷',
  tiktok: '🎵',
  youtube: '📺',
  linkedin: '💼',
  facebook: '📘',
  default: '🌐'
};

const sourceColors: Record<string, string> = {
  twitter: 'bg-blue-500',
  reddit: 'bg-orange-500',
  instagram: 'bg-pink-500',
  tiktok: 'bg-black',
  youtube: 'bg-red-500',
  linkedin: 'bg-blue-600',
  facebook: 'bg-blue-700',
  default: 'bg-gray-500'
};

export default function TrendRow({ trend, rank, previousRank, isNew = false }: TrendRowProps) {
  const rankDelta = previousRank ? previousRank - rank : 0;
  const sourceIcon = sourceIcons[trend.source] || sourceIcons.default;
  const sourceColor = sourceColors[trend.source] || sourceColors.default;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20',
        'hover:bg-white/15 transition-colors duration-200',
        isNew && 'ring-2 ring-green-400/50'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex flex-col items-center min-w-[60px]">
          <motion.div
            key={rank}
            initial={{ scale: 1.2, color: '#10b981' }}
            animate={{ scale: 1, color: '#ffffff' }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold text-white"
          >
            #{rank}
          </motion.div>
          {rankDelta !== 0 && (
            <DeltaBadge delta={rankDelta} />
          )}
        </div>

        {/* Source Icon */}
        <div className={clsx(
          'w-10 h-10 rounded-full flex items-center justify-center text-white text-lg',
          sourceColor
        )}>
          {sourceIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">
                {trend.title}
              </h3>
              <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                {trend.description}
              </p>
              
              {/* Hashtags */}
              {trend.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {trend.hashtags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="flex flex-col items-end gap-2 text-right">
              <div className="text-2xl font-bold text-white">
                {trend.momentum.toFixed(1)}
              </div>
              <div className="text-sm text-gray-300">
                Momentum
              </div>
              
              <div className="flex gap-4 text-xs text-gray-400">
                <div>
                  <div className="font-semibold text-white">{trend.volume}</div>
                  <div>Volume</div>
                </div>
                <div>
                  <div className="font-semibold text-white">{(trend.sentiment * 100).toFixed(0)}%</div>
                  <div>Sentiment</div>
                </div>
                <div>
                  <div className="font-semibold text-white">{trend.growth_rate.toFixed(1)}%</div>
                  <div>Growth</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New indicator */}
      {isNew && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium"
        >
          NEW
        </motion.div>
      )}
    </motion.div>
  );
}
