import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { log, error } from '../lib/log.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const queues = {
  youtube: new Queue('youtube', { connection }),
  gdelt: new Queue('gdelt', { connection }),
  reddit: new Queue('reddit', { connection }),
  rss: new Queue('rss', { connection }),
};

export function startWorker<T>(name: keyof typeof queues, handler: (data: T) => Promise<void>) {
  const worker = new Worker(String(name), async job => handler(job.data as T), {
    connection,
    concurrency: 3
  });
  worker.on('completed', job => log(`[${name}] job ${job.id} completed`));
  worker.on('failed', (job, err) => error(`[${name}] job ${job?.id} failed`, err));
  return worker;
}

export async function scheduleRepeatable(
  name: keyof typeof queues,
  data: any,
  opts: JobsOptions & { everyMs?: number } = {}
) {
  const every = opts.everyMs || 10 * 60 * 1000;
  await queues[name].add('tick', data, {
    repeat: { every },
    removeOnComplete: 1000,
    removeOnFail: 1000,
    backoff: { type: 'exponential', delay: 2000 },
    attempts: 3
  });
}
