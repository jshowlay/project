from typing import Dict, Any, List, Optional

def metrics_from_public(public: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    public = public or {}
    return {
        "like_count": public.get("like_count"),
        "retweet_count": public.get("retweet_count"),
        "reply_count": public.get("reply_count"),
        "quote_count": public.get("quote_count"),
        "bookmark_count": public.get("bookmark_count"),
        "impression_count": public.get("impression_count"),
    }

def author_map(includes: Dict[str, Any]) -> Dict[str, Any]:
    resolv = {}
    for u in (includes or {}).get("users", []):
        resolv[u["id"]] = u
    return resolv

def normalize_tweet(tweet: Dict[str, Any], author: Optional[Dict[str, Any]], tags: List[str]) -> Dict[str, Any]:
    t_id = tweet["id"]
    a_username = (author or {}).get("username")
    a_id = (author or {}).get("id")
    url = f"https://twitter.com/{a_username}/status/{t_id}" if a_username else None

    nm = {
        "source": "twitter",
        "external_id": t_id,
        "author_username": a_username,
        "author_id": a_id,
        "title": None,
        "content": tweet.get("text"),
        "url": url,
        "published_at": tweet.get("created_at"),
        "metrics": metrics_from_public(tweet.get("public_metrics")),
        "tags": tags,
        "raw": tweet
    }
    return nm


