import 'dotenv/config';
import cron from 'node-cron';
import { spawn } from 'node:child_process';

const CRON = process.env.INGEST_CRON || '*/15 * * * *';

function run(cmd: string, args: string[]) {
  const p = spawn(cmd, args, { stdio: 'inherit', env: process.env });
  p.on('close', (code) => console.log(`[${new Date().toISOString()}] ${cmd} ${args.join(' ')} exited ${code}`));
}

console.log(`[scheduler] Starting with CRON="${CRON}"`);
console.log(`[scheduler] Immediate run: ingest NYT once`);
run('npm', ['run', 'ingest:nyt:once']);

cron.schedule(CRON, () => {
  console.log(`[scheduler] Tick -> ingest NYT once`);
  run('npm', ['run', 'ingest:nyt:once']);
});

// Optional: semantic enrichment pass every hour on the 5
cron.schedule('5 * * * *', () => {
  console.log('[scheduler] Tick -> NYT semantic enrichment');
  run('npm', ['run', 'enrich:nyt:semantics']);
});

// Keep process alive
setInterval(() => {}, 1 << 30);
