import { Pool } from "pg";

(async ()=>{
  const cs = process.env.PG_URL;
  if (!cs) throw new Error("PG_URL not set");
  const needsSsl = /neon\.tech/i.test(cs) || (process.env.PG_SSL ?? "").toLowerCase().startsWith("req");
  const pool = new Pool({ connectionString: cs, ssl: needsSsl ? { rejectUnauthorized: false } : undefined });
  const ver = await pool.query("select version()");
  console.log("Connected:", ver.rows[0]?.version);
  const r = await pool.query("select source, count(*) as rows from signals group by source order by rows desc");
  console.table(r.rows);
  await pool.end();
})().catch(e=>{ console.error(e); process.exit(1); });
