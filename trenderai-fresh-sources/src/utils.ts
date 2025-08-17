import axios from "axios";
import pRetry from "p-retry";
import { addMilliseconds } from "date-fns";

export const http = axios.create({
  timeout: 15000,
  headers: { "User-Agent": "trenderai-fresh/1.0" }
});

export async function getJson<T>(url: string, config: any = {}): Promise<T> {
  return pRetry(async () => {
    const res = await http.get<T>(url, config);
    return res.data as T;
  }, { retries: 3 });
}

export function floorToMinute(d = new Date()): Date {
  const ms = d.getTime();
  return new Date(ms - (ms % 60000));
}

export function safe<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  return fn().catch((e) => {
    console.error(`[${label}]`, e?.response?.status, e?.response?.data || e?.message);
    return null;
  });
}
