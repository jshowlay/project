import { startStream } from '@/integrations/x_stream';

let started = false;

/** Call once from a server entrypoint to auto-start X stream (dev/SSR only). */
export function bootOnce() {
  if (started) return;
  started = true;
  if (process.env.X_STREAM_ENABLED === 'true' && process.env.X_STREAM_AUTO_START === 'true') {
    // Fire and forget; errors handled in the streamer
    startStream().catch(()=>{});
  }
}
