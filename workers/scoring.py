"""
Trender AI Scoring Algorithm

Implements the sophisticated trend scoring system:
trend_score = 0.35*velocity + 0.2*acceleration + 0.2*agreement + 0.15*freshness + 0.1*novelty

Features:
- Min-max normalization for 0-100 scale
- Sentence transformers for novelty detection
- Exponential decay for freshness calculation
- Cross-source agreement scoring
"""

import math
import numpy as np
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import json

# In production, would use sentence-transformers
# from sentence_transformers import SentenceTransformer

@dataclass
class TrendEvent:
    """Represents a single trend event from a data source."""
    keyword: str
    source: str
    timestamp: datetime
    raw_data: Dict[str, Any]
    geo: str = "global"
    language: str = "en"

@dataclass
class TrendScore:
    """Computed trend score with component metrics."""
    keyword: str
    score: float
    velocity: float
    acceleration: float
    agreement: float
    freshness: float
    novelty: float
    events: List[TrendEvent]

class TrendScorer:
    """
    Main trend scoring engine implementing the composite algorithm.
    """
    
    def __init__(self):
        # Scoring weights (must sum to 1.0)
        self.weights = {
            'velocity': 0.35,
            'acceleration': 0.2,
            'agreement': 0.2,
            'freshness': 0.15,
            'novelty': 0.1
        }
        
        # In production, would initialize sentence transformer model
        # self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.embedding_model = None  # Mock for now
        
        # Freshness decay parameters
        self.freshness_half_life = 12  # hours
        self.max_age_hours = 168  # 1 week
    
    def score_trends(self, events: List[TrendEvent], time_window_hours: int = 24) -> List[TrendScore]:
        """
        Score a list of trend events and return ranked results.
        
        Args:
            events: List of trend events to score
            time_window_hours: Time window to consider for trend analysis
            
        Returns:
            List of TrendScore objects ranked by composite score
        """
        if not events:
            return []
        
        # Group events by keyword (case-insensitive, basic stemming)
        grouped_events = self._group_events_by_keyword(events)
        
        # Calculate component scores for each keyword
        trend_scores = []
        for keyword, keyword_events in grouped_events.items():
            
            # Filter events within time window
            cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
            recent_events = [e for e in keyword_events if e.timestamp >= cutoff_time]
            
            if not recent_events:
                continue
            
            # Compute component scores
            velocity = self._calculate_velocity(recent_events, time_window_hours)
            acceleration = self._calculate_acceleration(recent_events, time_window_hours)
            agreement = self._calculate_agreement(recent_events)
            freshness = self._calculate_freshness(recent_events)
            novelty = self._calculate_novelty(keyword, grouped_events)
            
            # Calculate composite score
            composite_score = (
                self.weights['velocity'] * velocity +
                self.weights['acceleration'] * acceleration +
                self.weights['agreement'] * agreement +
                self.weights['freshness'] * freshness +
                self.weights['novelty'] * novelty
            )
            
            trend_scores.append(TrendScore(
                keyword=keyword,
                score=composite_score,
                velocity=velocity,
                acceleration=acceleration,
                agreement=agreement,
                freshness=freshness,
                novelty=novelty,
                events=recent_events
            ))
        
        # Apply min-max normalization to scale scores 0-100
        if trend_scores:
            trend_scores = self._normalize_scores(trend_scores)
        
        # Sort by composite score (descending)
        return sorted(trend_scores, key=lambda x: x.score, reverse=True)
    
    def _group_events_by_keyword(self, events: List[TrendEvent]) -> Dict[str, List[TrendEvent]]:
        """
        Group events by keyword with basic deduplication and stemming.
        
        In production, would use more sophisticated NLP for grouping similar terms.
        """
        grouped = {}
        
        for event in events:
            # Basic normalization (lowercase, strip)
            normalized_keyword = event.keyword.lower().strip()
            
            # Basic stemming (remove common plurals, etc.)
            normalized_keyword = self._basic_stem(normalized_keyword)
            
            if normalized_keyword not in grouped:
                grouped[normalized_keyword] = []
            grouped[normalized_keyword].append(event)
        
        return grouped
    
    def _basic_stem(self, keyword: str) -> str:
        """Basic keyword stemming for deduplication."""
        # Remove trailing 's' for simple plurals
        if keyword.endswith('s') and len(keyword) > 3:
            return keyword[:-1]
        return keyword
    
    def _calculate_velocity(self, events: List[TrendEvent], time_window_hours: int) -> float:
        """
        Calculate trend velocity (rate of mentions/interest over time).
        
        Velocity represents how quickly the trend is gaining traction.
        Higher values indicate rapid growth in mentions/interest.
        """
        if len(events) <= 1:
            return 0.0
        
        # Sort events by timestamp
        events_sorted = sorted(events, key=lambda x: x.timestamp)
        
        # Calculate mention frequency over time windows
        time_buckets = max(1, time_window_hours // 6)  # 6-hour buckets
        bucket_size_hours = time_window_hours / time_buckets
        
        oldest_time = events_sorted[0].timestamp
        bucket_counts = [0] * time_buckets
        
        for event in events_sorted:
            hours_since_start = (event.timestamp - oldest_time).total_seconds() / 3600
            bucket_index = min(int(hours_since_start / bucket_size_hours), time_buckets - 1)
            
            # Weight by source importance and raw metrics
            weight = self._get_event_weight(event)
            bucket_counts[bucket_index] += weight
        
        # Calculate velocity as average rate of change
        if len(bucket_counts) <= 1:
            return sum(bucket_counts) * 10  # Single bucket, use total activity
        
        velocity_sum = 0
        for i in range(1, len(bucket_counts)):
            if bucket_counts[i-1] > 0:
                change_rate = (bucket_counts[i] - bucket_counts[i-1]) / bucket_counts[i-1]
            else:
                change_rate = bucket_counts[i]  # First occurrence
            velocity_sum += change_rate
        
        average_velocity = velocity_sum / (len(bucket_counts) - 1)
        
        # Normalize to 0-100 scale (will be min-max normalized later)
        return max(0, min(100, average_velocity * 50 + 50))
    
    def _calculate_acceleration(self, events: List[TrendEvent], time_window_hours: int) -> float:
        """
        Calculate trend acceleration (rate of velocity change).
        
        Acceleration measures if the trend is speeding up or slowing down.
        """
        if len(events) <= 2:
            return 0.0
        
        # Sort events by timestamp
        events_sorted = sorted(events, key=lambda x: x.timestamp)
        
        # Split into two halves to calculate acceleration
        mid_point = len(events_sorted) // 2
        first_half = events_sorted[:mid_point]
        second_half = events_sorted[mid_point:]
        
        if not first_half or not second_half:
            return 0.0
        
        # Calculate velocity for each half
        first_half_velocity = self._calculate_velocity(first_half, time_window_hours // 2)
        second_half_velocity = self._calculate_velocity(second_half, time_window_hours // 2)
        
        # Acceleration is the change in velocity
        if first_half_velocity > 0:
            acceleration = (second_half_velocity - first_half_velocity) / first_half_velocity
        else:
            acceleration = second_half_velocity / 100  # Normalize if no initial velocity
        
        # Normalize to 0-100 scale
        return max(0, min(100, acceleration * 50 + 50))
    
    def _calculate_agreement(self, events: List[TrendEvent]) -> float:
        """
        Calculate cross-source agreement score.
        
        Higher scores indicate the trend appears across multiple independent sources.
        """
        if not events:
            return 0.0
        
        # Count unique sources
        unique_sources = set(event.source for event in events)
        source_count = len(unique_sources)
        
        # Weight by source diversity and quality
        source_weights = {
            'google_trends': 1.0,
            'reddit': 0.9,
            'youtube': 0.8,
            'news': 0.9,
            'twitter': 0.7
        }
        
        weighted_source_score = sum(
            source_weights.get(source, 0.5) for source in unique_sources
        )
        
        # Calculate agreement score based on source diversity
        max_possible_sources = 5  # Number of available connectors
        agreement_score = (weighted_source_score / max_possible_sources) * 100
        
        # Bonus for multiple mentions from same sources (consistency)
        total_mentions = len(events)
        consistency_bonus = min(20, (total_mentions - source_count) * 2)
        
        return min(100, agreement_score + consistency_bonus)
    
    def _calculate_freshness(self, events: List[TrendEvent]) -> float:
        """
        Calculate freshness score using exponential decay.
        
        More recent trends get higher freshness scores.
        """
        if not events:
            return 0.0
        
        now = datetime.now()
        freshness_scores = []
        
        for event in events:
            age_hours = (now - event.timestamp).total_seconds() / 3600
            
            # Exponential decay: score = e^(-age * ln(2) / half_life)
            decay_factor = math.exp(-age_hours * math.log(2) / self.freshness_half_life)
            freshness_score = decay_factor * 100
            
            # Apply weight based on event importance
            weight = self._get_event_weight(event)
            weighted_freshness = freshness_score * weight
            
            freshness_scores.append(weighted_freshness)
        
        # Return maximum freshness (most recent significant event)
        return max(freshness_scores) if freshness_scores else 0.0
    
    def _calculate_novelty(self, keyword: str, all_grouped_events: Dict[str, List[TrendEvent]]) -> float:
        """
        Calculate novelty score using semantic similarity.
        
        In production, would use sentence transformers to compare keyword embeddings.
        For now, uses basic string similarity.
        """
        if self.embedding_model:
            # Production implementation would use sentence transformers
            # keyword_embedding = self.embedding_model.encode([keyword])
            # similarity_scores = []
            # 
            # for other_keyword in all_grouped_events.keys():
            #     if other_keyword != keyword:
            #         other_embedding = self.embedding_model.encode([other_keyword])
            #         similarity = cosine_similarity(keyword_embedding, other_embedding)[0][0]
            #         similarity_scores.append(similarity)
            # 
            # # Novelty is inverse of maximum similarity
            # if similarity_scores:
            #     max_similarity = max(similarity_scores)
            #     novelty = (1 - max_similarity) * 100
            # else:
            #     novelty = 100  # Completely novel
            pass
        
        # Mock implementation using basic string similarity
        other_keywords = [k for k in all_grouped_events.keys() if k != keyword]
        
        if not other_keywords:
            return 100.0  # Completely novel
        
        # Calculate basic string similarity (Jaccard similarity)
        keyword_words = set(keyword.lower().split())
        max_similarity = 0.0
        
        for other_keyword in other_keywords:
            other_words = set(other_keyword.lower().split())
            
            if keyword_words and other_words:
                intersection = keyword_words.intersection(other_words)
                union = keyword_words.union(other_words)
                similarity = len(intersection) / len(union)
                max_similarity = max(max_similarity, similarity)
        
        # Novelty is inverse of similarity
        novelty = (1 - max_similarity) * 100
        return max(0, min(100, novelty))
    
    def _get_event_weight(self, event: TrendEvent) -> float:
        """
        Get importance weight for an event based on source and metrics.
        """
        base_weights = {
            'google_trends': 1.0,
            'reddit': 0.8,
            'youtube': 0.9,
            'news': 0.7,
            'twitter': 0.6
        }
        
        base_weight = base_weights.get(event.source, 0.5)
        
        # Add weight based on raw metrics in event data
        metric_weight = 1.0
        raw_data = event.raw_data
        
        if event.source == 'reddit' and 'score' in raw_data:
            # Reddit: upvotes indicate engagement
            score = raw_data.get('score', 0)
            metric_weight = min(2.0, 1.0 + (score / 1000))
        elif event.source == 'youtube' and 'view_count' in raw_data:
            # YouTube: view count indicates reach
            views = raw_data.get('view_count', 0)
            metric_weight = min(2.0, 1.0 + (views / 100000))
        elif event.source == 'google_trends' and 'interest_over_time' in raw_data:
            # Google Trends: interest value indicates search volume
            interest_data = raw_data.get('interest_over_time', [])
            if interest_data:
                avg_interest = sum(item.get('value', 0) for item in interest_data) / len(interest_data)
                metric_weight = min(2.0, 1.0 + (avg_interest / 100))
        
        return base_weight * metric_weight
    
    def _normalize_scores(self, trend_scores: List[TrendScore]) -> List[TrendScore]:
        """
        Apply min-max normalization to scale all scores to 0-100 range.
        """
        if not trend_scores:
            return trend_scores
        
        # Extract all component scores
        scores = [ts.score for ts in trend_scores]
        velocities = [ts.velocity for ts in trend_scores]
        accelerations = [ts.acceleration for ts in trend_scores]
        agreements = [ts.agreement for ts in trend_scores]
        freshnesses = [ts.freshness for ts in trend_scores]
        novelties = [ts.novelty for ts in trend_scores]
        
        # Normalize each component
        def normalize_list(values):
            if not values or len(set(values)) <= 1:
                return values
            min_val, max_val = min(values), max(values)
            return [((val - min_val) / (max_val - min_val)) * 100 for val in values]
        
        normalized_scores = normalize_list(scores)
        normalized_velocities = normalize_list(velocities)
        normalized_accelerations = normalize_list(accelerations)
        normalized_agreements = normalize_list(agreements)
        normalized_freshnesses = normalize_list(freshnesses)
        normalized_novelties = normalize_list(novelties)
        
        # Update trend scores with normalized values
        for i, ts in enumerate(trend_scores):
            ts.score = normalized_scores[i]
            ts.velocity = normalized_velocities[i]
            ts.acceleration = normalized_accelerations[i]
            ts.agreement = normalized_agreements[i]
            ts.freshness = normalized_freshnesses[i]
            ts.novelty = normalized_novelties[i]
        
        return trend_scores

# Example usage
if __name__ == "__main__":
    # Mock trend events for testing
    mock_events = [
        TrendEvent(
            keyword="AI Art Generators",
            source="google_trends",
            timestamp=datetime.now() - timedelta(hours=2),
            raw_data={"interest_over_time": [{"timestamp": "2024-01-15", "value": 89}]}
        ),
        TrendEvent(
            keyword="AI Art Tools",
            source="reddit",
            timestamp=datetime.now() - timedelta(hours=1),
            raw_data={"score": 245, "comments": 67}
        ),
        TrendEvent(
            keyword="Vertical Farming",
            source="google_trends",
            timestamp=datetime.now() - timedelta(hours=6),
            raw_data={"interest_over_time": [{"timestamp": "2024-01-15", "value": 72}]}
        )
    ]
    
    # Score the trends
    scorer = TrendScorer()
    scored_trends = scorer.score_trends(mock_events)
    
    # Print results
    for trend in scored_trends:
        print(f"\nKeyword: {trend.keyword}")
        print(f"Score: {trend.score:.1f}")
        print(f"  Velocity: {trend.velocity:.1f}")
        print(f"  Acceleration: {trend.acceleration:.1f}")
        print(f"  Agreement: {trend.agreement:.1f}")
        print(f"  Freshness: {trend.freshness:.1f}")
        print(f"  Novelty: {trend.novelty:.1f}")
        print(f"  Events: {len(trend.events)}")

from numpy import exp
import numpy as np

def normalize(scores):
    s = np.array(scores, dtype=float)
    if s.size == 0: return []
    lo, hi = s.min(), s.max()
    if hi == lo: return [50.0]*len(scores)
    return list(((s - lo) / (hi - lo)) * 100.0)

def compute_score(items, tau_hours=36):
    # items: list of dicts with fields: velocity, acceleration, novelty, agreement, hours_since_peak
    raw = []
    for it in items:
        freshness = float(exp(- it["hours_since_peak"]/tau_hours))
        raw.append(0.35*it["velocity"] + 0.2*it["acceleration"] +
                   0.2*it["agreement"] + 0.15*freshness + 0.1*it["novelty"])
    norm = normalize(raw)
    for i, s in enumerate(norm):
        items[i]["score"] = round(float(s), 1)
    return items