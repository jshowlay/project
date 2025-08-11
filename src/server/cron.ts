import cron from 'node-cron';
import { ingestAll } from './ingest';

export function maybeStartLocalCron(){
  if (process.env.ENABLE_LOCAL_CRON === 'true') {
    cron.schedule('*/5 * * * *', async () => {
      try { await ingestAll(); } catch {}
    });
  }
}
