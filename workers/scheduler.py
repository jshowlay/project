"""
Background Worker Scheduler for Trender AI

This module manages the background processes for:
- Trend data collection from various sources
- Trend scoring and analysis
- Database maintenance and cleanup
- Periodic cache refreshing
"""

import asyncio
import schedule
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any
import sys
import signal

# Import worker modules
from workers.google_trends import GoogleTrendsConnector
from workers.reddit import RedditConnector
from workers.youtube import YouTubeConnector
from workers.news import NewsConnector
from workers.scoring import TrendScorer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TrendWorkerScheduler:
    """
    Main scheduler for background trend analysis workers.
    """
    
    def __init__(self, development_mode: bool = False):
        self.development_mode = development_mode
        self.running = False
        
        # Initialize connectors
        self.google_trends = GoogleTrendsConnector()
        self.reddit = RedditConnector()
        self.youtube = YouTubeConnector(enabled=False)  # Feature flagged
        self.news = NewsConnector()
        self.scorer = TrendScorer()
        
        # Track last execution times for rate limiting
        self.last_executions = {}
        
        logger.info(f"TrendWorkerScheduler initialized (dev_mode={development_mode})")
    
    def start(self):
        """Start the worker scheduler."""
        logger.info("Starting Trender AI background workers...")
        self.running = True
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        # Schedule jobs based on environment
        if self.development_mode:
            self._schedule_development_jobs()
        else:
            self._schedule_production_jobs()
        
        # Run scheduler loop
        self._run_scheduler_loop()
    
    def stop(self):
        """Stop the worker scheduler."""
        logger.info("Stopping background workers...")
        self.running = False
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals."""
        logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.stop()
        sys.exit(0)
    
    def _schedule_development_jobs(self):
        """Schedule jobs for development environment (more frequent for testing)."""
        logger.info("Scheduling development jobs...")
        
        # More frequent runs for development
        schedule.every(5).minutes.do(self._collect_google_trends_job, niche="technology")
        schedule.every(10).minutes.do(self._collect_reddit_trends_job, niche="technology")
        schedule.every(15).minutes.do(self._score_trends_job)
        schedule.every(30).minutes.do(self._cleanup_old_data_job)
        
        # Health check every minute
        schedule.every(1).minute.do(self._health_check_job)
    
    def _schedule_production_jobs(self):
        """Schedule jobs for production environment."""
        logger.info("Scheduling production jobs...")
        
        # Google Trends - every 30 minutes (respects rate limits)
        schedule.every(30).minutes.do(self._collect_google_trends_job, niche="technology")
        schedule.every(35).minutes.do(self._collect_google_trends_job, niche="business")
        schedule.every(40).minutes.do(self._collect_google_trends_job, niche="health")
        
        # Reddit - every hour (less frequent to avoid hitting API limits)
        schedule.every().hour.at(":05").do(self._collect_reddit_trends_job, niche="technology")
        schedule.every().hour.at(":15").do(self._collect_reddit_trends_job, niche="business")
        schedule.every().hour.at(":25").do(self._collect_reddit_trends_job, niche="fitness")
        
        # News - every 2 hours
        schedule.every(2).hours.do(self._collect_news_trends_job, category="technology")
        
        # Scoring - every 20 minutes
        schedule.every(20).minutes.do(self._score_trends_job)
        
        # Cleanup - daily at 2 AM
        schedule.every().day.at("02:00").do(self._cleanup_old_data_job)
        
        # Health checks - every 5 minutes
        schedule.every(5).minutes.do(self._health_check_job)
    
    def _run_scheduler_loop(self):
        """Run the main scheduler loop."""
        logger.info("Worker scheduler started. Press Ctrl+C to stop.")
        
        try:
            while self.running:
                schedule.run_pending()
                time.sleep(10)  # Check every 10 seconds
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received")
        finally:
            self.stop()
    
    def _collect_google_trends_job(self, niche: str = "technology"):
        """Job to collect Google Trends data."""
        job_name = f"google_trends_{niche}"
        
        if not self._should_run_job(job_name, min_interval_minutes=25):
            return
        
        try:
            logger.info(f"Starting Google Trends collection for niche: {niche}")
            
            # Get trending searches
            trending = self.google_trends.get_trending_searches(geo='US', limit=20)
            logger.info(f"Found {len(trending)} trending searches")
            
            # Get rising queries for the niche
            rising = self.google_trends.get_rising_queries(niche, geo='US')
            logger.info(f"Found {len(rising)} rising queries for {niche}")
            
            # Store in database (would be implemented)
            # self._store_trend_events(trending + rising, source='google_trends')
            
            # Mock storage for now
            for trend in (trending + rising)[:5]:  # Limit for demo
                logger.info(f"Trend: {trend.keyword} (score: {trend.value})")
            
            self.last_executions[job_name] = datetime.now()
            logger.info(f"Google Trends collection completed for {niche}")
            
        except Exception as e:
            logger.error(f"Error in Google Trends collection: {e}")
    
    def _collect_reddit_trends_job(self, niche: str = "technology"):
        """Job to collect Reddit trend data."""
        job_name = f"reddit_{niche}"
        
        if not self._should_run_job(job_name, min_interval_minutes=55):
            return
        
        try:
            logger.info(f"Starting Reddit trend collection for niche: {niche}")
            
            # Get trending posts
            posts = self.reddit.get_trending_posts(niche=niche, limit=50)
            logger.info(f"Found {len(posts)} trending posts")
            
            # Get rising keywords
            keywords = self.reddit.get_rising_keywords(niche=niche, time_window_hours=24)
            logger.info(f"Found {len(keywords)} rising keywords")
            
            # Store in database (would be implemented)
            # self._store_trend_events(posts, source='reddit')
            
            # Mock logging
            for post in posts[:3]:
                logger.info(f"Post: {post.title[:60]}... (score: {post.score})")
            
            self.last_executions[job_name] = datetime.now()
            logger.info(f"Reddit trend collection completed for {niche}")
            
        except Exception as e:
            logger.error(f"Error in Reddit trend collection: {e}")
    
    def _collect_news_trends_job(self, category: str = "technology"):
        """Job to collect news trend data."""
        job_name = f"news_{category}"
        
        if not self._should_run_job(job_name, min_interval_minutes=115):
            return
        
        try:
            logger.info(f"Starting news trend collection for category: {category}")
            
            # Get trending headlines
            articles = self.news.get_trending_headlines(category=category)
            logger.info(f"Found {len(articles)} trending articles")
            
            # Get trending keywords from news
            keywords = self.news.get_trending_keywords_from_news(
                category=category, 
                time_window_hours=24
            )
            logger.info(f"Found {len(keywords)} trending keywords from news")
            
            # Mock logging
            for article in articles[:2]:
                logger.info(f"Article: {article.title} (engagement: {article.engagement_score:.1f})")
            
            self.last_executions[job_name] = datetime.now()
            logger.info(f"News trend collection completed for {category}")
            
        except Exception as e:
            logger.error(f"Error in news trend collection: {e}")
    
    def _score_trends_job(self):
        """Job to calculate trend scores."""
        job_name = "score_trends"
        
        if not self._should_run_job(job_name, min_interval_minutes=18):
            return
        
        try:
            logger.info("Starting trend scoring job")
            
            # In production, would fetch unscored trend events from database
            # For now, create mock events for demonstration
            from workers.scoring import TrendEvent
            
            mock_events = [
                TrendEvent(
                    keyword="AI Art Generators",
                    source="google_trends",
                    timestamp=datetime.now() - timedelta(hours=1),
                    raw_data={"interest_over_time": [{"value": 89}]}
                ),
                TrendEvent(
                    keyword="Vertical Farming",
                    source="reddit",
                    timestamp=datetime.now() - timedelta(hours=2),
                    raw_data={"score": 245, "comments": 67}
                )
            ]
            
            # Score the trends
            scored_trends = self.scorer.score_trends(mock_events, time_window_hours=24)
            logger.info(f"Scored {len(scored_trends)} trends")
            
            # Log top trends
            for trend in scored_trends[:3]:
                logger.info(f"Scored trend: {trend.keyword} (score: {trend.score:.1f})")
            
            # Store scores in database (would be implemented)
            # self._store_trend_scores(scored_trends)
            
            self.last_executions[job_name] = datetime.now()
            logger.info("Trend scoring job completed")
            
        except Exception as e:
            logger.error(f"Error in trend scoring: {e}")
    
    def _cleanup_old_data_job(self):
        """Job to clean up old data from database."""
        job_name = "cleanup_old_data"
        
        try:
            logger.info("Starting database cleanup job")
            
            # Define retention periods
            retention_periods = {
                'trend_events': 30,  # days
                'trend_scores': 60,  # days
                'briefs': 90,  # days
            }
            
            for table, retention_days in retention_periods.items():
                cutoff_date = datetime.now() - timedelta(days=retention_days)
                logger.info(f"Cleaning {table} older than {retention_days} days")
                
                # In production, would execute DELETE queries
                # deleted_count = self._delete_old_records(table, cutoff_date)
                # logger.info(f"Deleted {deleted_count} old records from {table}")
            
            self.last_executions[job_name] = datetime.now()
            logger.info("Database cleanup job completed")
            
        except Exception as e:
            logger.error(f"Error in database cleanup: {e}")
    
    def _health_check_job(self):
        """Job to perform health checks on all systems."""
        try:
            # Check database connection
            # db_healthy = self._check_database_health()
            db_healthy = True  # Mock for now
            
            # Check API connectivity
            # api_healthy = self._check_api_health()
            api_healthy = True  # Mock for now
            
            # Check worker memory usage
            import psutil
            memory_percent = psutil.virtual_memory().percent
            memory_healthy = memory_percent < 80  # Less than 80% memory usage
            
            if all([db_healthy, api_healthy, memory_healthy]):
                logger.debug("Health check passed")
            else:
                logger.warning(f"Health check issues: DB={db_healthy}, API={api_healthy}, Memory={memory_healthy} ({memory_percent:.1f}%)")
            
        except Exception as e:
            logger.error(f"Error in health check: {e}")
    
    def _should_run_job(self, job_name: str, min_interval_minutes: int) -> bool:
        """Check if enough time has passed since last job execution."""
        if job_name not in self.last_executions:
            return True
        
        last_run = self.last_executions[job_name]
        time_since_last = datetime.now() - last_run
        min_interval = timedelta(minutes=min_interval_minutes)
        
        if time_since_last < min_interval:
            logger.debug(f"Skipping {job_name}, last run {time_since_last.total_seconds():.0f}s ago")
            return False
        
        return True

def main():
    """Main entry point for the worker scheduler."""
    # Check for development mode
    dev_mode = '--dev' in sys.argv or '--development' in sys.argv
    
    # Initialize and start scheduler
    scheduler = TrendWorkerScheduler(development_mode=dev_mode)
    
    try:
        scheduler.start()
    except KeyboardInterrupt:
        logger.info("Scheduler interrupted by user")
    except Exception as e:
        logger.error(f"Scheduler error: {e}")
    finally:
        scheduler.stop()

if __name__ == "__main__":
    main()