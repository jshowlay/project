import { Adapter } from './types';
import { redditAdapter } from './reddit';
import { youtubeAdapter } from './youtube';
import { newsapiAdapter } from './newsapi';
import { coingeckoAdapter } from './coingecko';
import { alphavantageAdapter } from './alphavantage';
import { nytimesAdapter } from './nytimes';
import { instagramAdapter } from './instagramAdapter';
import { twitterAdapter } from './twitterAdapter';

export function activeAdapters(): Adapter[] {
  const adapters: Adapter[] = [];
  if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) adapters.push(redditAdapter);
  if (process.env.YOUTUBE_API_KEY) adapters.push(youtubeAdapter);
  if (process.env.NEWSAPI_KEY) adapters.push(newsapiAdapter);
  adapters.push(coingeckoAdapter); // no key required
  if (process.env.ALPHAVANTAGE_KEY) adapters.push(alphavantageAdapter);
  if (process.env.NYT_API_KEY) adapters.push(nytimesAdapter);
  if (process.env.IG_LONG_LIVED_TOKEN && process.env.IG_USER_ID) adapters.push(instagramAdapter);
  // Temporarily include Twitter adapter for testing (even without token)
  adapters.push(twitterAdapter);
  return adapters;
}
