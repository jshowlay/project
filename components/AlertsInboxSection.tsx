'use client';

import { useState } from 'react';
import { Check, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { AlertEvent, PaginatedAlertEvents } from '../lib/alerts';

interface AlertsInboxSectionProps {
  initialEvents: PaginatedAlertEvents;
}

export default function AlertsInboxSection({ initialEvents }: AlertsInboxSectionProps) {
  const [events, setEvents] = useState<PaginatedAlertEvents>(initialEvents);
  const [showAll, setShowAll] = useState(false);

  const handleMarkAsRead = async (eventId: string) => {
    try {
      const response = await fetch('/api/alerts/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          eventId: eventId,
        }),
      });

      if (response.ok) {
        setEvents(prev => ({
          ...prev,
          events: prev.events.map(event => 
            event.id === eventId ? { ...event, is_read: true, read_at: new Date() } : event
          ),
        }));
      }
    } catch (error) {
      console.error('Error marking event as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/alerts/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read',
          confirm: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setEvents(prev => ({
          ...prev,
          events: prev.events.map(event => ({ ...event, is_read: true, read_at: new Date() })),
        }));
      }
    } catch (error) {
      console.error('Error marking all events as read:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const formatSignalValues = (event: AlertEvent) => {
    const signals = [];
    
    if (event.trend_score !== undefined) {
      signals.push(`Score: ${event.trend_score.toFixed(1)}`);
    }
    if (event.trend_velocity !== undefined) {
      signals.push(`Velocity: ${event.trend_velocity.toFixed(1)}`);
    }
    if (event.trend_acceleration !== undefined) {
      signals.push(`Acceleration: ${event.trend_acceleration.toFixed(1)}`);
    }
    
    return signals.join(' • ');
  };

  const getSourceIcon = (source: string) => {
    const icons: Record<string, string> = {
      youtube: '📺',
      reddit: '🤖',
      nyt: '📰',
      google_trends: '📈',
      twitter: '🐦',
      tiktok: '🎵',
    };
    return icons[source] || '📊';
  };

  const filteredEvents = showAll ? events.events : events.events.filter(event => !event.is_read);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Alert Inbox</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            {showAll ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showAll ? 'Show Unread' : 'Show All'}
          </button>
          
          {events.events.some(event => !event.is_read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">
              {showAll ? 'No alert events yet' : 'No unread alerts'}
            </div>
            <div className="text-sm text-gray-400">
              {showAll 
                ? 'Create alert rules to start receiving notifications'
                : 'All alerts have been read'
              }
            </div>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`p-4 border rounded-lg ${
                event.is_read 
                  ? 'border-gray-200 bg-gray-50' 
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getSourceIcon(event.trend_source)}</span>
                    <span className="text-sm font-medium text-gray-600 uppercase">
                      {event.trend_source}
                    </span>
                    {!event.is_read && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-1">
                    {event.trend_topic}
                  </h3>
                  
                  {event.trend_title && event.trend_title !== event.trend_topic && (
                    <p className="text-sm text-gray-600 mb-2">
                      {event.trend_title}
                    </p>
                  )}
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {formatSignalValues(event) && (
                      <div>📊 {formatSignalValues(event)}</div>
                    )}
                    
                    {event.trend_region && (
                      <div>🌍 {event.trend_region}</div>
                    )}
                    
                    {event.trend_tags && event.trend_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.trend_tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {event.trend_tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{event.trend_tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {formatTimeAgo(event.triggered_at)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {event.trend_url && (
                    <a
                      href={event.trend_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Open trend"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  
                  {!event.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(event.id)}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {events.total > events.events.length && (
        <div className="mt-6 text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Load more events
          </button>
        </div>
      )}
    </div>
  );
}
