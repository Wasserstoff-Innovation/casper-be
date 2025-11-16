const { Client } = require('pg');
require('dotenv').config();

async function checkProfiles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check all brand profiles
    const profiles = await client.query(`
      SELECT id, user_id, canonical_domain, brand_name, status, created_at
      FROM brand_profiles
      ORDER BY created_at DESC
      LIMIT 20
    `);

    console.log(`\n📊 Found ${profiles.rows.length} brand profiles:`);
    if (profiles.rows.length === 0) {
      console.log('   ⚠️  No brand profiles found in database');
    } else {
      profiles.rows.forEach((row, i) => {
        console.log(`\n${i + 1}. Profile ID: ${row.id}`);
        console.log(`   User ID: ${row.user_id}`);
        console.log(`   Domain: ${row.canonical_domain || 'N/A'}`);
        console.log(`   Brand: ${row.brand_name || 'N/A'}`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Created: ${row.created_at}`);
      });
    }

    // Check users
    const users = await client.query(`
      SELECT id, name, email
      FROM users
      ORDER BY id
      LIMIT 10
    `);

    console.log(`\n\n👥 Found ${users.rows.length} users:`);
    users.rows.forEach((row, i) => {
      console.log(`${i + 1}. User ID ${row.id}: ${row.name} (${row.email})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkProfiles();
