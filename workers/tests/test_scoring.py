"""
Unit tests for the scoring algorithm
Tests normalization, score calculation, and edge cases
"""

import pytest
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scoring import TrendScorer

class TestTrendScorer:
    def setup_method(self):
        """Set up test fixtures"""
        self.scorer = TrendScorer()
    
    def test_score_normalization(self):
        """Test that scores are properly normalized to 0-100 range"""
        # Test high scores
        high_score = self.scorer.calculate_composite_score(
            velocity=95,
            acceleration=90,
            agreement=88,
            freshness=92,
            novelty=85
        )
        assert 0 <= high_score <= 100
        
        # Test low scores
        low_score = self.scorer.calculate_composite_score(
            velocity=10,
            acceleration=15,
            agreement=20,
            freshness=25,
            novelty=30
        )
        assert 0 <= low_score <= 100
        
        # Test edge cases
        zero_score = self.scorer.calculate_composite_score(
            velocity=0,
            acceleration=0,
            agreement=0,
            freshness=0,
            novelty=0
        )
        assert zero_score == 0
        
        max_score = self.scorer.calculate_composite_score(
            velocity=100,
            acceleration=100,
            agreement=100,
            freshness=100,
            novelty=100
        )
        assert max_score == 100
    
    def test_velocity_calculation(self):
        """Test velocity calculation with sample data"""
        # Mock trend data over time
        trend_data = [10, 15, 25, 40, 60, 85, 95, 100]
        velocity = self.scorer.calculate_velocity(trend_data)
        
        assert 0 <= velocity <= 100
        assert velocity > 0  # Should be positive for increasing trend
    
    def test_acceleration_calculation(self):
        """Test acceleration calculation"""
        # Mock velocity changes over time
        velocity_changes = [5, 10, 15, 20, 25, 10, 5, 0]
        acceleration = self.scorer.calculate_acceleration(velocity_changes)
        
        assert -100 <= acceleration <= 100  # Can be negative for deceleration
    
    def test_agreement_calculation(self):
        """Test cross-source agreement calculation"""
        sources = ['google_trends', 'reddit', 'youtube', 'news']
        agreement = self.scorer.calculate_agreement(sources)
        
        assert 0 <= agreement <= 100
        # More sources should generally mean higher agreement
        assert agreement > 0
    
    def test_freshness_calculation(self):
        """Test freshness calculation based on time"""
        from datetime import datetime, timedelta
        
        # Recent timestamp should have high freshness
        recent_time = datetime.now() - timedelta(hours=1)
        recent_freshness = self.scorer.calculate_freshness(recent_time)
        assert recent_freshness > 80
        
        # Old timestamp should have lower freshness
        old_time = datetime.now() - timedelta(days=7)
        old_freshness = self.scorer.calculate_freshness(old_time)
        assert old_freshness < recent_freshness
    
    def test_novelty_calculation(self):
        """Test novelty calculation using semantic similarity"""
        # Test with different keywords
        keyword1 = "AI Art Generators"
        existing_keywords = ["Digital Art", "Creative Tools", "Art Software"]
        
        novelty = self.scorer.calculate_novelty(keyword1, existing_keywords)
        assert 0 <= novelty <= 100
    
    def test_composite_score_weights(self):
        """Test that composite score uses correct weights"""
        # Test with known values
        velocity = 80
        acceleration = 70
        agreement = 90
        freshness = 85
        novelty = 75
        
        score = self.scorer.calculate_composite_score(
            velocity, acceleration, agreement, freshness, novelty
        )
        
        # Manual calculation with weights
        expected_score = (
            velocity * 0.35 +
            acceleration * 0.20 +
            agreement * 0.20 +
            freshness * 0.15 +
            novelty * 0.10
        )
        
        # Allow for small floating point differences
        assert abs(score - expected_score) < 0.01
    
    def test_edge_cases(self):
        """Test edge cases and error handling"""
        # Test with empty data
        empty_score = self.scorer.calculate_composite_score(0, 0, 0, 0, 0)
        assert empty_score == 0
        
        # Test with negative values (should be clamped to 0)
        negative_score = self.scorer.calculate_composite_score(-10, -5, -15, -20, -25)
        assert negative_score == 0
        
        # Test with values over 100 (should be clamped to 100)
        overflow_score = self.scorer.calculate_composite_score(150, 200, 180, 160, 140)
        assert overflow_score == 100
    
    def test_score_consistency(self):
        """Test that scores are consistent for same inputs"""
        score1 = self.scorer.calculate_composite_score(80, 70, 90, 85, 75)
        score2 = self.scorer.calculate_composite_score(80, 70, 90, 85, 75)
        
        assert score1 == score2
    
    def test_score_monotonicity(self):
        """Test that higher inputs produce higher scores"""
        low_score = self.scorer.calculate_composite_score(50, 50, 50, 50, 50)
        high_score = self.scorer.calculate_composite_score(80, 80, 80, 80, 80)
        
        assert high_score > low_score

if __name__ == "__main__":
    pytest.main([__file__])

