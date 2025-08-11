import { Adapter } from './types';
import { redditAdapter } from './reddit';
import { youtubeAdapter } from './youtube';
import { newsapiAdapter } from './newsapi';
import { coingeckoAdapter } from './coingecko';
import { alphavantageAdapter } from './alphavantage';

export function activeAdapters(): Adapter[] {
  const adapters: Adapter[] = [];
  if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) adapters.push(redditAdapter);
  if (process.env.YOUTUBE_API_KEY) adapters.push(youtubeAdapter);
  if (process.env.NEWSAPI_KEY) adapters.push(newsapiAdapter);
  adapters.push(coingeckoAdapter); // no key required
  if (process.env.ALPHAVANTAGE_KEY) adapters.push(alphavantageAdapter);
  return adapters;
}
