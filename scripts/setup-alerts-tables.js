const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupAlertsTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Setting up alerts database tables...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'sql', 'create_alerts_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sqlContent);
    
    console.log('✅ Alerts tables created successfully!');
    
    // Verify the tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('alert_rules', 'alert_events', 'alert_deliveries')
      ORDER BY table_name
    `);
    
    console.log('Created tables:', tables.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('❌ Error setting up alerts tables:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  setupAlertsTables()
    .then(() => {
      console.log('🎉 Alerts setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupAlertsTables };
