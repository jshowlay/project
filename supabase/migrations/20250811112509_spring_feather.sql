/*
  # Seed Data for Trender AI

  This migration populates the database with sample data for development and demonstration.
  
  1. Sample trend events from various sources
  2. Computed trend scores for each event
  3. Sample briefs showing the complete pipeline
*/

-- Insert sample trend events
INSERT INTO trend_events (keyword, source, raw_data, geo, language, timestamp) VALUES
('AI Art Generators', 'google_trends', '{"interest_over_time": [{"timestamp": "2024-01-15", "value": 89}], "rising_queries": ["midjourney", "stable diffusion"]}', 'US', 'en', '2024-01-15 10:00:00+00'),
('AI Art Generators', 'reddit', '{"subreddit": "artificial", "score": 245, "comments": 67, "upvote_ratio": 0.94}', 'US', 'en', '2024-01-15 11:30:00+00'),
('AI Art Generators', 'youtube', '{"view_count": 125000, "like_count": 8900, "comment_count": 456, "published_at": "2024-01-15T09:00:00Z"}', 'US', 'en', '2024-01-15 09:00:00+00'),

('Vertical Farming', 'google_trends', '{"interest_over_time": [{"timestamp": "2024-01-15", "value": 72}], "rising_queries": ["hydroponics", "indoor farming"]}', 'US', 'en', '2024-01-15 08:00:00+00'),
('Vertical Farming', 'reddit', '{"subreddit": "gardening", "score": 189, "comments": 34, "upvote_ratio": 0.87}', 'US', 'en', '2024-01-15 12:00:00+00'),

('Remote Work Tools', 'google_trends', '{"interest_over_time": [{"timestamp": "2024-01-15", "value": 65}], "rising_queries": ["zoom alternatives", "collaboration software"]}', 'US', 'en', '2024-01-15 07:00:00+00'),
('Remote Work Tools', 'news', '{"headline": "New Remote Work Tools Emerge", "source": "TechCrunch", "published_at": "2024-01-15T06:00:00Z"}', 'US', 'en', '2024-01-15 06:00:00+00'),

('Sustainable Fashion', 'google_trends', '{"interest_over_time": [{"timestamp": "2024-01-15", "value": 58}], "rising_queries": ["eco friendly clothing", "sustainable brands"]}', 'US', 'en', '2024-01-15 05:00:00+00'),
('Sustainable Fashion', 'reddit', '{"subreddit": "fashion", "score": 156, "comments": 45, "upvote_ratio": 0.91}', 'US', 'en', '2024-01-15 13:00:00+00'),

('Mental Health Apps', 'google_trends', '{"interest_over_time": [{"timestamp": "2024-01-15", "value": 71}], "rising_queries": ["meditation apps", "therapy apps"]}', 'US', 'en', '2024-01-15 04:00:00+00');

-- Insert corresponding trend scores
INSERT INTO trend_scores (trend_event_id, keyword, score, velocity, acceleration, agreement, freshness, novelty, computed_at) VALUES
-- AI Art Generators (high score trend)
((SELECT id FROM trend_events WHERE keyword = 'AI Art Generators' AND source = 'google_trends'), 'AI Art Generators', 92.5, 89.0, 78.0, 95.0, 96.0, 85.0, '2024-01-15 14:00:00+00'),

-- Vertical Farming (medium score trend)
((SELECT id FROM trend_events WHERE keyword = 'Vertical Farming' AND source = 'google_trends'), 'Vertical Farming', 78.2, 72.0, 68.0, 82.0, 85.0, 91.0, '2024-01-15 14:00:00+00'),

-- Remote Work Tools (medium-low score)
((SELECT id FROM trend_events WHERE keyword = 'Remote Work Tools' AND source = 'google_trends'), 'Remote Work Tools', 66.8, 65.0, 58.0, 75.0, 70.0, 69.0, '2024-01-15 14:00:00+00'),

-- Sustainable Fashion (medium score)
((SELECT id FROM trend_events WHERE keyword = 'Sustainable Fashion' AND source = 'google_trends'), 'Sustainable Fashion', 73.5, 58.0, 72.0, 83.0, 88.0, 76.0, '2024-01-15 14:00:00+00'),

-- Mental Health Apps (medium-high score)
((SELECT id FROM trend_events WHERE keyword = 'Mental Health Apps' AND source = 'google_trends'), 'Mental Health Apps', 81.3, 71.0, 82.0, 79.0, 92.0, 88.0, '2024-01-15 14:00:00+00');

-- Insert a sample brief
INSERT INTO briefs (niche, platforms, geo, language, time_window_hours, content, metadata) VALUES
('Technology', ARRAY['TikTok', 'YouTube', 'Instagram'], 'US', 'en', 24, 
'{
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
        ],
        "Instagram": [
          "AI art process carousel post",
          "Stories poll: AI vs human art",
          "Reel showing AI art creation timelapse"
        ]
      },
      "hooks": {
        "TikTok": [
          "This AI created museum-quality art in 30 seconds",
          "POV: You discover AI can replace artists",
          "I tried 5 AI art tools so you dont have to"
        ],
        "YouTube": [
          "The Future of Digital Art is Here (and its Scary)",
          "How I Make $1000/Month Selling AI Art",
          "Artist Reacts to AI Art for the First Time"
        ],
        "Instagram": [
          "AI just changed the art world forever ✨",
          "From prompt to masterpiece in seconds",
          "The tool every creative needs to try"
        ]
      },
      "keywords": ["ai art", "midjourney", "stable diffusion", "digital art", "creative ai", "art generation"],
      "timestamp": "2024-01-15T14:00:00.000Z"
    },
    {
      "id": "2", 
      "keyword": "Mental Health Apps",
      "score": 81.3,
      "velocity": 71.0,
      "acceleration": 82.0,
      "agreement": 79.0,
      "freshness": 92.0,
      "novelty": 88.0,
      "sources": ["Google Trends", "News API"],
      "angles": {
        "TikTok": [
          "Mental health apps that actually work",
          "Therapy in your pocket review",
          "Apps that helped my anxiety journey"
        ],
        "YouTube": [
          "I tried 10 mental health apps for 30 days",
          "Therapist reviews popular mental health apps",
          "Free vs paid mental health apps comparison"
        ],
        "Instagram": [
          "Mental health app recommendations carousel",
          "My daily wellness app routine",
          "Apps for anxiety and depression support"
        ]
      },
      "hooks": {
        "TikTok": [
          "These apps replaced my therapist (temporarily)",
          "POV: Finding the right mental health app",
          "Apps that helped me through my darkest days"
        ],
        "YouTube": [
          "Mental Health Apps: Do They Actually Work?",
          "A Therapists Honest Review of Wellness Apps",
          "How I Improved My Mental Health with Technology"
        ],
        "Instagram": [
          "Self-care starts with the right apps 💙",
          "Technology meets mental wellness",
          "Your pocket guide to better mental health"
        ]
      },
      "keywords": ["mental health apps", "therapy apps", "meditation apps", "wellness technology", "self care apps"],
      "timestamp": "2024-01-15T14:00:00.000Z"
    }
  ]
}',
'{
  "total_trends": 2,
  "generation_time": "2024-01-15T14:00:00.000Z",
  "sources_used": ["google_trends", "reddit", "youtube", "news"],
  "scoring_algorithm": "v1.0",
  "processing_time_ms": 1250
}'
);