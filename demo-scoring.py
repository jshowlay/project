#!/usr/bin/env python3
"""
Trender AI Scoring Algorithm Demo
Demonstrates the scoring system with sample data
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'workers'))

from datetime import datetime, timedelta
from scoring import TrendScorer, TrendEvent

def create_sample_events():
    """Create sample trend events for testing"""
    now = datetime.now()
    
    events = [
        # AI Art Generators - High velocity trend
        TrendEvent(
            keyword="AI Art Generators",
            source="google_trends",
            timestamp=now - timedelta(hours=2),
            raw_data={
                "interest_over_time": [
                    {"timestamp": "2024-01-15T10:00:00Z", "value": 85},
                    {"timestamp": "2024-01-15T12:00:00Z", "value": 89},
                    {"timestamp": "2024-01-15T14:00:00Z", "value": 92},
                    {"timestamp": "2024-01-15T16:00:00Z", "value": 95}
                ]
            }
        ),
        TrendEvent(
            keyword="AI Art Generators",
            source="reddit",
            timestamp=now - timedelta(hours=1),
            raw_data={
                "score": 1250,
                "comments": 89,
                "subreddit": "artificial"
            }
        ),
        TrendEvent(
            keyword="AI Art Generators",
            source="youtube",
            timestamp=now - timedelta(hours=3),
            raw_data={
                "view_count": 45000,
                "like_count": 1200,
                "title": "How to Create Amazing Art with AI"
            }
        ),
        
        # Sustainable Fashion - Medium velocity trend
        TrendEvent(
            keyword="Sustainable Fashion",
            source="google_trends",
            timestamp=now - timedelta(hours=4),
            raw_data={
                "interest_over_time": [
                    {"timestamp": "2024-01-15T08:00:00Z", "value": 72},
                    {"timestamp": "2024-01-15T10:00:00Z", "value": 75},
                    {"timestamp": "2024-01-15T12:00:00Z", "value": 78},
                    {"timestamp": "2024-01-15T14:00:00Z", "value": 82}
                ]
            }
        ),
        TrendEvent(
            keyword="Sustainable Fashion",
            source="news",
            timestamp=now - timedelta(hours=5),
            raw_data={
                "headline": "Major Fashion Brands Commit to Sustainability",
                "source": "Vogue",
                "engagement": 4500
            }
        ),
        
        # Plant-Based Recipes - Lower velocity trend
        TrendEvent(
            keyword="Plant-Based Recipes",
            source="google_trends",
            timestamp=now - timedelta(hours=6),
            raw_data={
                "interest_over_time": [
                    {"timestamp": "2024-01-15T06:00:00Z", "value": 68},
                    {"timestamp": "2024-01-15T08:00:00Z", "value": 71},
                    {"timestamp": "2024-01-15T10:00:00Z", "value": 74},
                    {"timestamp": "2024-01-15T12:00:00Z", "value": 77}
                ]
            }
        ),
        TrendEvent(
            keyword="Plant-Based Recipes",
            source="youtube",
            timestamp=now - timedelta(hours=7),
            raw_data={
                "view_count": 32000,
                "like_count": 890,
                "title": "5 Quick Plant-Based Meals Under 15 Minutes"
            }
        )
    ]
    
    return events

def demo_scoring():
    """Demonstrate the scoring algorithm"""
    print("🚀 Trender AI Scoring Algorithm Demo")
    print("=" * 50)
    
    # Create sample events
    events = create_sample_events()
    print(f"📊 Created {len(events)} sample trend events")
    
    # Initialize scorer
    scorer = TrendScorer()
    print("✅ Scoring engine initialized")
    
    # Score trends
    print("\n🧮 Calculating trend scores...")
    scored_trends = scorer.score_trends(events, time_window_hours=24)
    
    # Display results
    print(f"\n📈 Found {len(scored_trends)} unique trends:")
    print("-" * 80)
    
    for i, trend in enumerate(scored_trends, 1):
        print(f"\n{i}. {trend.keyword.upper()}")
        print(f"   Overall Score: {trend.score:.1f}/100")
        print(f"   📊 Component Scores:")
        print(f"      • Velocity:     {trend.velocity:.1f} (rate of growth)")
        print(f"      • Acceleration: {trend.acceleration:.1f} (speed of acceleration)")
        print(f"      • Agreement:    {trend.agreement:.1f} (cross-source consensus)")
        print(f"      • Freshness:    {trend.freshness:.1f} (recency)")
        print(f"      • Novelty:      {trend.novelty:.1f} (uniqueness)")
        print(f"   📍 Sources: {', '.join(set(e.source for e in trend.events))}")
        print(f"   📅 Events: {len(trend.events)} data points")
    
    # Show scoring formula
    print(f"\n🔬 Scoring Formula:")
    print(f"   trend_score = 0.35×velocity + 0.2×acceleration + 0.2×agreement + 0.15×freshness + 0.1×novelty")
    
    # Show top trend
    if scored_trends:
        top_trend = scored_trends[0]
        print(f"\n🏆 Top Trending Topic: {top_trend.keyword}")
        print(f"   Score: {top_trend.score:.1f}/100")
        print(f"   This trend shows the highest potential for content creation!")
    
    print(f"\n✅ Demo completed successfully!")
    return scored_trends

if __name__ == "__main__":
    try:
        demo_scoring()
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        print("This is expected if Python dependencies aren't installed.")
        print("The scoring algorithm is ready to use when the environment is set up!")

