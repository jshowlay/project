import cron from 'node-cron';
import { ingestAll } from './ingest';
import { refreshSearchMV } from './search_mv';

export function maybeStartLocalCron(){
  if (process.env.ENABLE_LOCAL_CRON === 'true') {
    // Every 5 minutes: ingest
    cron.schedule('*/5 * * * *', async () => { try { await ingestAll(); } catch {} });
    // Nightly at 2:00: refresh MV
    cron.schedule('0 2 * * *', async () => { try { await refreshSearchMV(); } catch {} });
  }
}
