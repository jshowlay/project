"""
YouTube Connector for Trender AI - Stub with Interface

This module provides the interface for YouTube trend data collection.
Currently feature-flagged. In production, would use YouTube Data API v3.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import random

@dataclass
class YouTubeVideo:
    """Represents a YouTube video with trend-relevant data."""
    video_id: str
    title: str
    channel_title: str
    description: str
    published_at: datetime
    view_count: int
    like_count: int
    comment_count: int
    duration: str
    tags: List[str]
    category_id: str
    trending_keywords: List[str]
    thumbnail_url: str

class YouTubeConnector:
    """
    YouTube trend data connector interface (STUB - FEATURE FLAGGED).
    
    In production, this would:
    - Use YouTube Data API v3 for video and search data
    - Monitor trending videos across regions
    - Analyze search trends and rising video topics
    - Track engagement metrics (views, likes, comments)
    - Extract trending hashtags and keywords from descriptions
    - Monitor channel growth and viral content patterns
    
    IMPORTANT: This connector is currently stubbed and feature-flagged.
    Enable only after obtaining proper YouTube API credentials and quotas.
    """
    
    def __init__(self, api_key: Optional[str] = None, enabled: bool = False):
        """
        Initialize YouTube connector.
        
        Args:
            api_key: YouTube Data API v3 key
            enabled: Feature flag to enable YouTube data collection
        """
        self.api_key = api_key
        self.enabled = enabled
        
        if not self.enabled:
            print("WARNING: YouTube connector is feature-flagged and disabled")
            print("Enable only with proper API credentials and quota management")
            return
        
        # In production, initialize YouTube API client
        # from googleapiclient.discovery import build
        # self.youtube = build('youtube', 'v3', developerKey=api_key)
        self.youtube = None
        
        # API quota management
        self.daily_quota = 10000  # YouTube API default quota
        self.quota_used = 0
        self.quota_reset = datetime.now().replace(hour=0, minute=0, second=0) + timedelta(days=1)
    
    def get_trending_videos(self, 
                           region_code: str = 'US',
                           category_id: Optional[str] = None,
                           max_results: int = 50) -> List[YouTubeVideo]:
        """
        Get trending videos from YouTube.
        
        Args:
            region_code: Geographic region code
            category_id: Video category filter (optional)
            max_results: Maximum number of videos to return
            
        Returns:
            List of YouTubeVideo objects with trending content
        """
        if not self.enabled:
            print("YouTube connector is disabled (feature-flagged)")
            return self._get_mock_videos(max_results)
        
        if not self._check_quota(1):  # videos().list costs 1 quota unit
            print("YouTube API quota exceeded")
            return []
        
        if self.youtube:
            # Production implementation
            try:
                request = self.youtube.videos().list(
                    part='snippet,statistics,contentDetails',
                    chart='mostPopular',
                    regionCode=region_code,
                    maxResults=max_results,
                    videoCategoryId=category_id
                )
                response = request.execute()
                
                videos = []
                for item in response.get('items', []):
                    snippet = item['snippet']
                    statistics = item['statistics']
                    content_details = item['contentDetails']
                    
                    # Extract keywords from title and description
                    keywords = self._extract_keywords(
                        snippet.get('title', '') + ' ' + snippet.get('description', '')
                    )
                    
                    videos.append(YouTubeVideo(
                        video_id=item['id'],
                        title=snippet.get('title', ''),
                        channel_title=snippet.get('channelTitle', ''),
                        description=snippet.get('description', '')[:500],
                        published_at=datetime.fromisoformat(snippet.get('publishedAt', '').replace('Z', '+00:00')),
                        view_count=int(statistics.get('viewCount', 0)),
                        like_count=int(statistics.get('likeCount', 0)),
                        comment_count=int(statistics.get('commentCount', 0)),
                        duration=content_details.get('duration', ''),
                        tags=snippet.get('tags', []),
                        category_id=snippet.get('categoryId', ''),
                        trending_keywords=keywords,
                        thumbnail_url=snippet.get('thumbnails', {}).get('high', {}).get('url', '')
                    ))
                
                self._update_quota_usage(1)
                return videos
                
            except Exception as e:
                print(f"Error fetching trending videos: {e}")
                return self._get_mock_videos(max_results)
        
        return self._get_mock_videos(max_results)
    
    def search_trending_topics(self, 
                              query: str,
                              published_after: Optional[datetime] = None,
                              order: str = 'relevance',
                              max_results: int = 25) -> List[YouTubeVideo]:
        """
        Search for videos related to trending topics.
        
        Args:
            query: Search query string
            published_after: Filter videos published after this date
            order: Sort order ('relevance', 'date', 'rating', 'viewCount')
            max_results: Maximum number of results
            
        Returns:
            List of YouTubeVideo objects matching the search
        """
        if not self.enabled:
            print("YouTube connector is disabled (feature-flagged)")
            return self._get_mock_search_results(query, max_results)
        
        if not self._check_quota(100):  # search().list costs 100 quota units
            print("YouTube API quota exceeded for search operation")
            return []
        
        if self.youtube:
            # Production implementation
            try:
                # Build search request
                search_request = self.youtube.search().list(
                    part='snippet',
                    q=query,
                    type='video',
                    order=order,
                    maxResults=max_results,
                    publishedAfter=published_after.isoformat() if published_after else None
                )
                search_response = search_request.execute()
                
                # Get video IDs for detailed statistics
                video_ids = [item['id']['videoId'] for item in search_response.get('items', [])]
                
                if not video_ids:
                    return []
                
                # Get video statistics
                videos_request = self.youtube.videos().list(
                    part='snippet,statistics,contentDetails',
                    id=','.join(video_ids)
                )
                videos_response = videos_request.execute()
                
                videos = []
                for item in videos_response.get('items', []):
                    snippet = item['snippet']
                    statistics = item['statistics']
                    content_details = item['contentDetails']
                    
                    keywords = self._extract_keywords(
                        snippet.get('title', '') + ' ' + snippet.get('description', '')
                    )
                    
                    videos.append(YouTubeVideo(
                        video_id=item['id'],
                        title=snippet.get('title', ''),
                        channel_title=snippet.get('channelTitle', ''),
                        description=snippet.get('description', '')[:500],
                        published_at=datetime.fromisoformat(snippet.get('publishedAt', '').replace('Z', '+00:00')),
                        view_count=int(statistics.get('viewCount', 0)),
                        like_count=int(statistics.get('likeCount', 0)),
                        comment_count=int(statistics.get('commentCount', 0)),
                        duration=content_details.get('duration', ''),
                        tags=snippet.get('tags', []),
                        category_id=snippet.get('categoryId', ''),
                        trending_keywords=keywords,
                        thumbnail_url=snippet.get('thumbnails', {}).get('high', {}).get('url', '')
                    ))
                
                self._update_quota_usage(101)  # 100 for search + 1 for videos
                return videos
                
            except Exception as e:
                print(f"Error searching videos: {e}")
                return self._get_mock_search_results(query, max_results)
        
        return self._get_mock_search_results(query, max_results)
    
    def get_video_analytics(self, video_ids: List[str]) -> Dict[str, Dict]:
        """
        Get detailed analytics for specific videos.
        
        Args:
            video_ids: List of YouTube video IDs
            
        Returns:
            Dictionary with video analytics data
        """
        if not self.enabled:
            print("YouTube connector is disabled (feature-flagged)")
            return {}
        
        # This would require YouTube Analytics API (separate from Data API)
        # and channel ownership or proper permissions
        print("Video analytics requires YouTube Analytics API access")
        return {}
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract trending keywords from video content."""
        if not text:
            return []
        
        # Simple keyword extraction (would use NLP in production)
        words = text.lower().split()
        
        # Filter common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'this', 'that', 'these', 'those', 'i', 'you', 'we', 'they', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can'}
        
        keywords = []
        for word in words:
            cleaned_word = ''.join(c for c in word if c.isalnum())
            if (len(cleaned_word) > 3 and 
                cleaned_word not in stop_words and
                not cleaned_word.isdigit()):
                keywords.append(cleaned_word)
        
        return list(set(keywords))[:10]
    
    def _check_quota(self, cost: int) -> bool:
        """Check if operation is within quota limits."""
        if datetime.now() >= self.quota_reset:
            self.quota_used = 0
            self.quota_reset += timedelta(days=1)
        
        return self.quota_used + cost <= self.daily_quota
    
    def _update_quota_usage(self, cost: int):
        """Update quota usage tracking."""
        self.quota_used += cost
    
    def _get_mock_videos(self, limit: int) -> List[YouTubeVideo]:
        """Generate mock video data for development."""
        mock_videos = []
        
        mock_titles = [
            "AI Art Tutorial - Create Stunning Images in Minutes",
            "Vertical Farming Setup - Growing Food at Home",
            "Remote Work Productivity Hacks That Actually Work",
            "Sustainable Fashion Haul - Eco-Friendly Brands Review",
            "Mental Health Apps Tested - Which Ones Work?",
            "Electric Vehicle Road Trip - Real World Experience",
            "Smart Home Automation - Complete Beginner's Guide",
            "Cryptocurrency Explained - Investment Strategies 2024",
            "Plant-Based Meat Taste Test - Honest Review",
            "VR Fitness Games - Best Workouts at Home",
            "Social Media Privacy Guide - Protect Your Data",
            "Online Learning Platforms - Honest Comparison",
            "Food Delivery Apps - Cost vs Convenience Analysis",
            "Digital Nomad Life - 6 Months of Remote Work Travel",
            "Climate Solutions That Actually Make a Difference"
        ]
        
        channels = [
            "TechReviewPro", "LifestyleGuru", "FitnessMentor", "BusinessInsider",
            "CreativeStudio", "HealthWellness", "GadgetExpert", "TrendAnalyst",
            "InnovationHub", "SustainableLiving"
        ]
        
        for i, title in enumerate(mock_titles[:limit]):
            mock_videos.append(YouTubeVideo(
                video_id=f"mock_video_{i}",
                title=title,
                channel_title=random.choice(channels),
                description=f"Mock description for {title}. This video covers trending topics and provides valuable insights...",
                published_at=datetime.now() - timedelta(days=random.randint(0, 30)),
                view_count=random.randint(1000, 1000000),
                like_count=random.randint(50, 50000),
                comment_count=random.randint(10, 5000),
                duration="PT5M30S",  # ISO 8601 duration format
                tags=["trending", "tutorial", "review", "2024"],
                category_id="22",  # People & Blogs
                trending_keywords=self._extract_keywords(title),
                thumbnail_url="https://img.youtube.com/vi/mock/maxresdefault.jpg"
            ))
        
        return mock_videos
    
    def _get_mock_search_results(self, query: str, limit: int) -> List[YouTubeVideo]:
        """Generate mock search results."""
        # Create query-specific mock results
        base_videos = self._get_mock_videos(limit)
        
        # Modify titles to include search query
        for video in base_videos:
            video.title = f"{query} - {video.title}"
            video.trending_keywords.append(query.lower())
        
        return base_videos

# Example usage (feature-flagged)
if __name__ == "__main__":
    print("YouTube Connector - FEATURE FLAGGED")
    print("This connector is currently disabled for production safety")
    print("Enable only with proper API credentials and quota management")
    
    # Initialize with feature flag disabled
    connector = YouTubeConnector(enabled=False)
    
    # Test with mock data
    print("\n=== Mock Trending Videos ===")
    videos = connector.get_trending_videos(max_results=3)
    for video in videos:
        print(f"{video.title}")
        print(f"  Channel: {video.channel_title}")
        print(f"  Views: {video.view_count:,}, Likes: {video.like_count:,}")
        print(f"  Keywords: {', '.join(video.trending_keywords[:5])}")
        print()
    
    print("\n=== Mock Search Results ===")
    search_results = connector.search_trending_topics("AI technology", max_results=2)
    for video in search_results:
        print(f"{video.title}")
        print(f"  Published: {video.published_at.strftime('%Y-%m-%d')}")
        print()