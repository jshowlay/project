import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from './db';

export const limiter = new RateLimiterRedis({
  storeClient: redis(),
  points: 60,
  duration: 60,
  keyPrefix: 'rl'
});
export async function rateLimit(ip:string){
  try { await limiter.consume(ip); return null; }
  catch { return { status: 429, body: { error: 'Too Many Requests' } } }
}
