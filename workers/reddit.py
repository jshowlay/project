"""
Reddit Connector for Trender AI - Interface Stub

This module provides the interface and structure for Reddit trend data collection.
In production, would use PRAW or Reddit JSON API for hot/top posts analysis.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import random

@dataclass
class RedditPost:
    """Represents a Reddit post with trend-relevant data."""
    title: str
    subreddit: str
    score: int
    upvote_ratio: float
    num_comments: int
    created_utc: datetime
    permalink: str
    selftext: str
    author: str
    awards: int
    trending_keywords: List[str]

class RedditConnector:
    """
    Reddit trend data connector interface.
    
    In production, this would:
    - Use PRAW (Python Reddit API Wrapper) for authenticated access
    - Monitor specified subreddit lists for trending content
    - Analyze post engagement metrics (upvotes, comments, awards)
    - Extract trending topics using NLP analysis of post titles/content
    - Track keyword frequency across multiple subreddits
    """
    
    def __init__(self, client_id: Optional[str] = None, client_secret: Optional[str] = None):
        """
        Initialize Reddit connector.
        
        Args:
            client_id: Reddit API client ID
            client_secret: Reddit API client secret
        """
        self.client_id = client_id
        self.client_secret = client_secret
        
        # In production, initialize PRAW
        # import praw
        # self.reddit = praw.Reddit(
        #     client_id=client_id,
        #     client_secret=client_secret,
        #     user_agent='TrenderAI/1.0 by YourUsername'
        # )
        self.reddit = None  # Mock for demo
        
        # Subreddit lists for different niches
        self.subreddit_lists = {
            'technology': [
                'technology', 'programming', 'artificial', 'MachineLearning',
                'gadgets', 'startups', 'webdev', 'datascience'
            ],
            'fitness': [
                'fitness', 'bodybuilding', 'loseit', 'nutrition',
                'yoga', 'running', 'weightlifting', 'flexibility'
            ],
            'business': [
                'business', 'entrepreneur', 'marketing', 'investing',
                'finance', 'smallbusiness', 'startup', 'freelance'
            ],
            'entertainment': [
                'movies', 'television', 'music', 'gaming',
                'books', 'netflix', 'spotify', 'entertainment'
            ],
            'lifestyle': [
                'lifehacks', 'productivity', 'minimalism', 'personalfinance',
                'relationships', 'cooking', 'travel', 'fashion'
            ]
        }
    
    def get_trending_posts(self, 
                          niche: Optional[str] = None,
                          subreddits: Optional[List[str]] = None,
                          time_filter: str = 'day',
                          limit: int = 100) -> List[RedditPost]:
        """
        Get trending posts from specified subreddits.
        
        Args:
            niche: Niche category to use predefined subreddit list
            subreddits: Custom list of subreddit names
            time_filter: Time period ('hour', 'day', 'week', 'month', 'year', 'all')
            limit: Maximum number of posts to return
            
        Returns:
            List of RedditPost objects with trending content
        """
        if subreddits is None:
            if niche and niche in self.subreddit_lists:
                subreddits = self.subreddit_lists[niche]
            else:
                subreddits = ['all']  # Use r/all as fallback
        
        if self.reddit:
            # Production implementation with PRAW
            posts = []
            
            for subreddit_name in subreddits:
                try:
                    subreddit = self.reddit.subreddit(subreddit_name)
                    
                    # Get top posts from time period
                    for submission in subreddit.top(time_filter=time_filter, limit=limit//len(subreddits)):
                        # Extract trending keywords from title and content
                        trending_keywords = self._extract_keywords(submission.title + ' ' + submission.selftext)
                        
                        posts.append(RedditPost(
                            title=submission.title,
                            subreddit=subreddit_name,
                            score=submission.score,
                            upvote_ratio=submission.upvote_ratio,
                            num_comments=submission.num_comments,
                            created_utc=datetime.fromtimestamp(submission.created_utc),
                            permalink=submission.permalink,
                            selftext=submission.selftext[:500],  # Truncate long text
                            author=str(submission.author),
                            awards=submission.total_awards_received,
                            trending_keywords=trending_keywords
                        ))
                        
                except Exception as e:
                    print(f"Error fetching from r/{subreddit_name}: {e}")
                    continue
            
            # Sort by engagement score (combination of upvotes, comments, awards)
            posts.sort(key=self._calculate_engagement_score, reverse=True)
            return posts[:limit]
        
        # Mock data for development
        return self._get_mock_posts(subreddits, limit)
    
    def get_rising_keywords(self, 
                           niche: Optional[str] = None,
                           time_window_hours: int = 24,
                           min_mentions: int = 3) -> List[Dict[str, Any]]:
        """
        Extract rising keywords from recent Reddit activity.
        
        Args:
            niche: Niche category for focused analysis
            time_window_hours: Time window for trend analysis
            min_mentions: Minimum mentions required for keyword inclusion
            
        Returns:
            List of dictionaries with keyword trend data
        """
        cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
        posts = self.get_trending_posts(niche=niche, time_filter='day')
        
        # Filter posts within time window
        recent_posts = [post for post in posts if post.created_utc >= cutoff_time]
        
        # Count keyword frequency with engagement weighting
        keyword_scores = {}
        
        for post in recent_posts:
            engagement_weight = self._calculate_engagement_score(post)
            
            for keyword in post.trending_keywords:
                if keyword not in keyword_scores:
                    keyword_scores[keyword] = {
                        'keyword': keyword,
                        'mentions': 0,
                        'total_score': 0,
                        'posts': []
                    }
                
                keyword_scores[keyword]['mentions'] += 1
                keyword_scores[keyword]['total_score'] += engagement_weight
                keyword_scores[keyword]['posts'].append({
                    'title': post.title,
                    'subreddit': post.subreddit,
                    'score': post.score,
                    'url': f"https://reddit.com{post.permalink}"
                })
        
        # Filter by minimum mentions and calculate trend score
        rising_keywords = []
        for keyword_data in keyword_scores.values():
            if keyword_data['mentions'] >= min_mentions:
                avg_score = keyword_data['total_score'] / keyword_data['mentions']
                
                rising_keywords.append({
                    'keyword': keyword_data['keyword'],
                    'mentions': keyword_data['mentions'],
                    'avg_engagement': avg_score,
                    'trend_score': avg_score * keyword_data['mentions'],  # Combined metric
                    'sample_posts': keyword_data['posts'][:3]  # Top 3 posts
                })
        
        # Sort by trend score
        rising_keywords.sort(key=lambda x: x['trend_score'], reverse=True)
        return rising_keywords
    
    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extract trending keywords from post content.
        
        In production, would use:
        - spaCy or NLTK for NLP processing
        - TF-IDF analysis for keyword importance
        - Named entity recognition
        - Custom trend keyword detection
        """
        if not text:
            return []
        
        # Simple keyword extraction for demo
        words = text.lower().split()
        
        # Filter out common words and short words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'}
        
        keywords = []
        for word in words:
            cleaned_word = ''.join(c for c in word if c.isalnum())
            if (len(cleaned_word) > 3 and 
                cleaned_word not in stop_words and
                not cleaned_word.isdigit()):
                keywords.append(cleaned_word)
        
        # Return unique keywords, limit to avoid noise
        return list(set(keywords))[:10]
    
    def _calculate_engagement_score(self, post: RedditPost) -> float:
        """Calculate engagement score for ranking posts."""
        # Weighted engagement score
        base_score = post.score * 0.6
        comment_score = post.num_comments * 0.3
        award_score = post.awards * 0.1
        ratio_bonus = post.upvote_ratio * 10  # Bonus for high upvote ratio
        
        return base_score + comment_score + award_score + ratio_bonus
    
    def _get_mock_posts(self, subreddits: List[str], limit: int) -> List[RedditPost]:
        """Generate mock Reddit posts for development."""
        mock_posts = []
        
        mock_titles = [
            "New AI tool revolutionizes content creation",
            "This fitness app changed my life in 30 days",
            "Remote work productivity tips that actually work", 
            "Sustainable fashion brands worth supporting",
            "Mental health apps comparison - honest review",
            "Electric vehicle charging infrastructure update",
            "Home automation setup guide for beginners",
            "Cryptocurrency market analysis for 2024",
            "Plant-based meat taste test results",
            "VR fitness games that don't feel like exercise",
            "Social media privacy settings everyone should know",
            "Online learning platforms ranked by value",
            "Food delivery apps environmental impact study",
            "Digital nomad lifestyle reality check",
            "Climate change solutions gaining traction"
        ]
        
        for i, title in enumerate(mock_titles[:limit]):
            subreddit = random.choice(subreddits) if subreddits else 'technology'
            
            mock_posts.append(RedditPost(
                title=title,
                subreddit=subreddit,
                score=random.randint(50, 2000),
                upvote_ratio=random.uniform(0.75, 0.98),
                num_comments=random.randint(10, 500),
                created_utc=datetime.now() - timedelta(hours=random.randint(1, 24)),
                permalink=f"/r/{subreddit}/comments/mock{i}/",
                selftext="Mock post content for development purposes...",
                author=f"user_{random.randint(1000, 9999)}",
                awards=random.randint(0, 10),
                trending_keywords=self._extract_keywords(title)
            ))
        
        return mock_posts

# Example usage
if __name__ == "__main__":
    # Initialize connector (without credentials for demo)
    connector = RedditConnector()
    
    # Test trending posts
    print("=== Trending Technology Posts ===")
    posts = connector.get_trending_posts(niche='technology', limit=5)
    for post in posts:
        print(f"r/{post.subreddit}: {post.title}")
        print(f"  Score: {post.score}, Comments: {post.num_comments}, Ratio: {post.upvote_ratio:.2f}")
        print(f"  Keywords: {', '.join(post.trending_keywords[:5])}")
        print()
    
    # Test rising keywords
    print("=== Rising Keywords in Technology ===")
    keywords = connector.get_rising_keywords(niche='technology', time_window_hours=24)
    for keyword_data in keywords[:5]:
        print(f"{keyword_data['keyword']}: {keyword_data['mentions']} mentions, score {keyword_data['trend_score']:.1f}")