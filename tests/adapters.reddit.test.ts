import { redditAdapter } from '@/integrations/reddit';
import { expect, test } from 'vitest';
test('reddit adapter loads shape', async () => {
  if (!process.env.REDDIT_CLIENT_ID) return;
  const res = await redditAdapter.fetchTrends();
  expect(Array.isArray(res)).toBe(true);
});
