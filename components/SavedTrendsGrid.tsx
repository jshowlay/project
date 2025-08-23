'use client';

import { useState, useEffect } from 'react';
import { SavedTrend } from '../lib/saved-trends';
import SaveButton from './SaveButton';
import CardImage from '../src/components/CardImage';
import ShareButtons from '../src/components/ShareButtons';
import TrendSparkline from '../src/components/TrendSparkline';

interface SavedTrendsGridProps {
  trends: SavedTrend[];
  currentPage: number;
  totalPages: number;
}

export default function SavedTrendsGrid({ 
  trends, 
  currentPage, 
  totalPages 
}: SavedTrendsGridProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (trends.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">
          No saved trends yet
        </div>
        <p className="text-gray-500 mb-6">
          Start saving trends you find interesting to see them here
        </p>
        <a 
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Browse Trends
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {trends.map((trend) => (
          <SavedTrendCard key={`${trend.trend_source}:${trend.trend_id}`} trend={trend} isClient={isClient} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <a
                key={page}
                href={`/saved?page=${page}`}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  page === currentPage
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                }`}
              >
                {page}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SavedTrendCardProps {
  trend: SavedTrend;
  isClient: boolean;
}

function SavedTrendCard({ trend, isClient }: SavedTrendCardProps) {
  const deriveTermAndGeo = (topic: string, region?: string) => {
    let t = topic || '';
    // remove region suffix like "Topic [US]"
    t = t.replace(/\s\[[A-Z]{2}\]$/, '');
    // remove suffix added by timeseries snapshot
    t = t.replace(/\s—\sinterest over time$/i, '');
    // trim quotes
    t = t.replace(/^"(.*)"$/, '$1').trim();
    const geo = (region && region.trim()) || 'US';
    return { term: t, geo };
  };

  const { term, geo } = deriveTermAndGeo(trend.trend_topic, trend.trend_region);

  return (
    <div className="rounded-2xl border border-[#1b1b1b] bg-[#0f0f0f] p-4 hover:border-gray-600 transition-colors">
      {/* Image */}
      {trend.trend_image_url && (
        <CardImage remoteUrl={trend.trend_image_url} alt={trend.trend_topic} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm uppercase tracking-wide text-blue-400">
          {trend.trend_source}
        </span>
        <span className="text-sm text-gray-400">
          Score: {Math.round(trend.trend_score)}
        </span>
      </div>

      {/* Title */}
      <div className="text-lg font-medium text-white mb-2">
        {trend.trend_title || trend.trend_topic}
      </div>

      {/* Metadata */}
      <div className="space-y-1 mb-3">
        <div className="text-sm text-gray-400">
          Saved: {new Date(trend.created_at).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-400">
          Observed: {new Date(trend.trend_observed_at).toLocaleDateString()}
        </div>
        {trend.trend_velocity > 0 && (
          <div className="text-sm text-blue-400">
            Velocity: {Math.round(trend.trend_velocity)}
          </div>
        )}
        {trend.trend_acceleration !== 0 && (
          <div className="text-sm text-purple-400">
            Acceleration: {Math.round(trend.trend_acceleration)}
          </div>
        )}
      </div>

      {/* Sparkline for Google Trends */}
      {trend.trend_source === 'google_trends' && (
        <div className="mb-3">
          <TrendSparkline term={term} geo={geo} width={160} height={36} />
        </div>
      )}

      {/* Tags */}
      {trend.trend_tags && trend.trend_tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {trend.trend_tags.slice(0, 5).map((tag) => (
            <span 
              key={tag} 
              className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {isClient && (
            <SaveButton
              trendId={trend.trend_id}
              trendSource={trend.trend_source}
              trendTopic={trend.trend_topic}
              trendTitle={trend.trend_title}
              trendUrl={trend.trend_url}
              trendImageUrl={trend.trend_image_url}
              trendScore={trend.trend_score}
              trendVelocity={trend.trend_velocity}
              trendAcceleration={trend.trend_acceleration}
              trendRegion={trend.trend_region}
              trendTags={trend.trend_tags}
              trendObservedAt={trend.trend_observed_at}
              size="sm"
              variant="icon"
            />
          )}
          
          <ShareButtons 
            title={trend.trend_topic} 
            url={trend.trend_url} 
            source={trend.trend_source} 
            tags={trend.trend_tags}
          />
        </div>

        {trend.trend_url && (
          <a 
            href={trend.trend_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Open
          </a>
        )}
      </div>
    </div>
  );
}
