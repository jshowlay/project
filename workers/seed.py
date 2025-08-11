"""
Seed script for Trender AI database
Populates tables with sample data for development and testing
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
import uuid

# Mock data for seeding
SAMPLE_TREND_EVENTS = [
    {
        "keyword": "AI Art Generators",
        "source": "google_trends",
        "raw_data": {
            "interest_over_time": [85, 87, 89, 92, 95, 98, 96, 94],
            "related_queries": ["midjourney", "dall-e", "stable diffusion", "ai art tools"]
        },
        "geo": "US",
        "language": "en",
        "timestamp": datetime.now() - timedelta(hours=2)
    },
    {
        "keyword": "AI Art Generators",
        "source": "reddit",
        "raw_data": {
            "subreddit": "artificial",
            "score": 1250,
            "comments": 89,
            "title": "Just discovered this amazing AI art generator"
        },
        "geo": "US",
        "language": "en",
        "timestamp": datetime.now() - timedelta(hours=1)
    },
    {
        "keyword": "AI Art Generators",
        "source": "youtube",
        "raw_data": {
            "video_id": "abc123",
            "views": 45000,
            "likes": 1200,
            "title": "How to Create Amazing Art with AI"
        },
        "geo": "US",
        "language": "en",
        "timestamp": datetime.now() - timedelta(hours=3)
    },
    {
        "keyword": "Sustainable Fashion",
        "source": "google_trends",
        "raw_data": {
            "interest_over_time": [72, 75, 78, 82, 85, 87, 89, 91],
            "related_queries": ["thrift shopping", "eco-friendly clothing", "fast fashion alternatives"]
        },
        "geo": "US",
        "language": "en",
        "timestamp": datetime.now() - timedelta(hours=4)
    },
    {
        "keyword": "Sustainable Fashion",
        "source": "news",
        "raw_data": {
            "headline": "Major Fashion Brands Commit to Sustainability",
            "source": "Vogue",
            "sentiment": "positive",
            "engagement": 4500
        },
        "geo": "US",
        "language": "en",
        "timestamp": datetime.now() - timedelta(hours=5)
    },
    {
        "keyword": "Plant-Based Recipes",
        "source": "google_trends",
        "raw_data": {
            "interest_over_time": [68, 71, 74, 77, 79, 82, 84, 86],
            "related_queries": ["vegan meals", "plant-based cooking", "healthy recipes"]
        },
        "geo": "US",
        "language": "en",
        "timestamp": datetime.now() - timedelta(hours=6)
    },
    {
        "keyword": "Plant-Based Recipes",
        "source": "youtube",
        "raw_data": {
            "video_id": "def456",
            "views": 32000,
            "likes": 890,
            "title": "5 Quick Plant-Based Meals Under 15 Minutes"
        },
        "geo": "US",
        "language": "en",
        "timestamp": datetime.now() - timedelta(hours=7)
    }
]

SAMPLE_BRIEF = {
    "id": str(uuid.uuid4()),
    "niche": "Technology",
    "platforms": ["TikTok", "YouTube"],
    "geo": "US",
    "language": "en",
    "time_window_hours": 24,
    "content": {
        "trends": [
            {
                "id": "1",
                "keyword": "AI Art Generators",
                "score": 92.5,
                "velocity": 89.0,
                "acceleration": 78.0,
                "agreement": 95.0,
                "freshness": 96.0,
                "novelty": 85.0,
                "sources": ["Google Trends", "Reddit", "YouTube"],
                "angles": {
                    "TikTok": [
                        "Quick AI art tutorial in under 60 seconds",
                        "Before/after art transformation reveal",
                        "AI vs human artist drawing challenge"
                    ],
                    "YouTube": [
                        "Complete beginner guide to AI art tools",
                        "Advanced AI art techniques and prompts",
                        "Honest review: 5 AI art tools compared"
                    ]
                },
                "hooks": {
                    "TikTok": [
                        "This AI created art in 30 seconds",
                        "POV: You discover AI art for the first time",
                        "I tried 5 AI art tools and here's what happened"
                    ],
                    "YouTube": [
                        "The Future of Digital Art is Here",
                        "How I Make $1000/Month with AI Art",
                        "Professional Artist Reacts to AI Art"
                    ]
                },
                "keywords": ["AI art", "digital art", "artificial intelligence", "creative tools", "art generation"],
                "timestamp": datetime.now().isoformat()
            },
            {
                "id": "2",
                "keyword": "Sustainable Fashion",
                "score": 87.3,
                "velocity": 82.0,
                "acceleration": 91.0,
                "agreement": 88.0,
                "freshness": 89.0,
                "novelty": 76.0,
                "sources": ["Google Trends", "News", "Instagram"],
                "angles": {
                    "TikTok": [
                        "Thrift store haul with styling tips",
                        "Sustainable outfit challenge",
                        "Eco-friendly fashion hacks"
                    ],
                    "YouTube": [
                        "Sustainable fashion documentary",
                        "Brand review: eco-friendly options",
                        "DIY sustainable fashion projects"
                    ]
                },
                "hooks": {
                    "TikTok": [
                        "I spent $50 on sustainable fashion",
                        "POV: Sustainable fashion is expensive",
                        "Thrift store finds that look expensive"
                    ],
                    "YouTube": [
                        "The Truth About Fast Fashion",
                        "Sustainable Fashion on a Budget",
                        "Eco-Friendly Fashion Brands You Need to Know"
                    ]
                },
                "keywords": ["sustainable fashion", "eco-friendly", "thrift shopping", "fast fashion", "ethical clothing"],
                "timestamp": datetime.now().isoformat()
            }
        ]
    },
    "metadata": {
        "generated_at": datetime.now().isoformat(),
        "total_trends": 2,
        "scoring_weights": {
            "velocity": 0.35,
            "acceleration": 0.20,
            "agreement": 0.20,
            "freshness": 0.15,
            "novelty": 0.10
        }
    }
}

async def create_sample_data():
    """Create sample data for development"""
    print("🌱 Seeding database with sample data...")
    
    # In a real implementation, this would use SQLAlchemy or similar ORM
    # For now, we'll just print what would be created
    
    print(f"📊 Creating {len(SAMPLE_TREND_EVENTS)} trend events...")
    for event in SAMPLE_TREND_EVENTS:
        print(f"  - {event['keyword']} from {event['source']}")
    
    print(f"📋 Creating sample brief for {SAMPLE_BRIEF['niche']}...")
    print(f"  - {len(SAMPLE_BRIEF['content']['trends'])} trends")
    print(f"  - Platforms: {', '.join(SAMPLE_BRIEF['platforms'])}")
    
    print("✅ Sample data created successfully!")
    
    return {
        "trend_events": len(SAMPLE_TREND_EVENTS),
        "brief": SAMPLE_BRIEF
    }

def create_sample_data_sync():
    """Synchronous version for CLI usage"""
    return asyncio.run(create_sample_data())

if __name__ == "__main__":
    create_sample_data_sync()

