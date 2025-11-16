const { Client } = require('pg');
require('dotenv').config();

async function verifyDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all table names
    const result = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('📊 Database Tables:');
    console.log('==================');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.tablename}`);
    });
    console.log(`\nTotal: ${result.rows.length} tables\n`);

    // Check brand_profiles schema
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'brand_profiles'
      ORDER BY ordinal_position
    `);

    console.log('🔍 brand_profiles schema:');
    console.log('=========================');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyDatabase();
