import 'dotenv/config';
import { readFileSync } from 'fs';
import { query } from '../db/index.js';

async function ensurePgcrypto() {
  await query('create extension if not exists pgcrypto;');
}

async function run() {
  await ensurePgcrypto();
  const sql = readFileSync('src/db/schema.sql', 'utf8');
  await query(sql);
  console.log('Migration complete.');
  process.exit(0);
}

run();







