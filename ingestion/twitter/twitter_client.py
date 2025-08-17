import os
import time
import requests
from typing import Dict, Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

class RateLimit(Exception): pass

class TwitterClient:
    def __init__(self, bearer_token: Optional[str] = None, base: Optional[str] = None):
        self.base = base or os.environ.get("TWITTER_API_BASE", "https://api.twitter.com/2")
        self.bearer = bearer_token or os.environ.get("TWITTER_BEARER_TOKEN")
        if not self.bearer:
            raise RuntimeError("TWITTER_BEARER_TOKEN not set")
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {self.bearer}"})

    def _check_rl(self, r: requests.Response):
        if r.status_code == 429:
            # Respect Retry-After if present
            retry_after = int(r.headers.get("retry-after", "60"))
            raise RateLimit(f"429 rate limited; retry after {retry_after}s")
        r.raise_for_status()

    @retry(
        retry=retry_if_exception_type((requests.RequestException, RateLimit)),
        wait=wait_exponential(multiplier=1, min=2, max=60),
        stop=stop_after_attempt(5),
        reraise=True
    )
    def _get(self, path: str, params: Dict[str, Any]) -> Dict[str, Any]:
        url = self.base + path
        r = self.session.get(url, params=params, timeout=30)
        if r.status_code == 429:
            self._check_rl(r)
        r.raise_for_status()
        return r.json()

    def recent_search(self, query: str, max_results: int = 100, next_token: Optional[str] = None,
                      since_id: Optional[str] = None) -> Dict[str, Any]:
        params = {
            "query": query,
            "max_results": max(10, min(max_results, 100)),
            "tweet.fields": "created_at,lang,public_metrics,conversation_id,in_reply_to_user_id,possibly_sensitive,source,entities,referenced_tweets",
            "user.fields": "created_at,public_metrics,verified,username,name,profile_image_url",
            "expansions": "author_id"
        }
        if next_token:
            params["next_token"] = next_token
        if since_id:
            params["since_id"] = since_id
        return self._get("/tweets/search/recent", params)

    def user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        data = self._get("/users/by/username/" + username, {
            "user.fields": "created_at,public_metrics,verified,username,name,profile_image_url"
        })
        return data.get("data")

    def user_tweets(self, user_id: str, max_results: int = 100, pagination_token: Optional[str] = None,
                    since_id: Optional[str] = None) -> Dict[str, Any]:
        params = {
            "max_results": max(10, min(max_results, 100)),
            "tweet.fields": "created_at,lang,public_metrics,conversation_id,in_reply_to_user_id,possibly_sensitive,source,entities,referenced_tweets",
            "expansions": "author_id",
            "user.fields": "created_at,public_metrics,verified,username,name,profile_image_url"
        }
        if pagination_token:
            params["pagination_token"] = pagination_token
        if since_id:
            params["since_id"] = since_id
        return self._get(f"/users/{user_id}/tweets", params)


