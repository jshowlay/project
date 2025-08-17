import 'dotenv/config';
import { readFileSync } from 'fs';
import { pool } from '../src/lib/db.js';

const files = process.argv.slice(2);
if (files.length === 0) throw new Error('Usage: tsx scripts/migrate.ts sql/file1.sql [sql/file2.sql ...]');

(async () => {
  for (const file of files) {
    const sql = readFileSync(file, 'utf8');
    await pool.query(sql);
    console.log(`Applied migration: ${file}`);
  }
  await pool.end();
})();
