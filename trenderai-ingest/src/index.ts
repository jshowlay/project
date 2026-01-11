import 'dotenv/config';
import { scheduleRepeatable, startWorker } from './queue/index.js';
import { fetchYouTubeTrending } from './connectors/youtube.js';
import { fetchGdelt } from './connectors/gdelt.js';
import { fetchReddit } from './connectors/reddit.js';
import { fetchRss } from './connectors/rss.js';
import { log } from './lib/log.js';

async function main() {
  log('TrenderAI Ingest starting…');

  // Workers
  startWorker('youtube', async () => { await fetchYouTubeTrending('US', 50); });
  startWorker('gdelt', async () => { await fetchGdelt('15MIN', 75); });
  startWorker('reddit', async () => { await fetchReddit(); });
  startWorker('rss', async () => { await fetchRss(); });

  // Schedules (tweak as desired)
  await scheduleRepeatable('youtube', {}, { everyMs: 15 * 60 * 1000 }); // 15m
  await scheduleRepeatable('gdelt',  {}, { everyMs: 15 * 60 * 1000 }); // 15m
  await scheduleRepeatable('reddit', {}, { everyMs: 10 * 60 * 1000 }); // 10m
  await scheduleRepeatable('rss',    {}, { everyMs: 20 * 60 * 1000 }); // 20m

  log('Workers & schedules registered.');
}

main().catch(err => { console.error(err); process.exit(1); });












