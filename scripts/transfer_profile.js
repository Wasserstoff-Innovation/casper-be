const { Client } = require('pg');
require('dotenv').config();

async function transferProfile() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Update brand_profiles to belong to user_id=1
    await client.query(`
      UPDATE brand_profiles
      SET user_id = 1
      WHERE user_id = 7
    `);
    console.log('✅ Transferred brand profiles from user_id=7 to user_id=1');

    // Update roadmap campaigns
    await client.query(`
      UPDATE brand_roadmap_campaigns
      SET user_id = 1
      WHERE user_id = 7
    `);
    console.log('✅ Transferred roadmap campaigns');

    // Update roadmap tasks
    await client.query(`
      UPDATE brand_roadmap_tasks
      SET user_id = 1
      WHERE user_id = 7
    `);
    console.log('✅ Transferred roadmap tasks');

    // Verify
    const result = await client.query(`
      SELECT id, user_id, canonical_domain, brand_name
      FROM brand_profiles
      WHERE user_id = 1
    `);

    console.log(`\n✅ User 1 now has ${result.rows.length} brand profile(s):`);
    result.rows.forEach(row => {
      console.log(`   - ${row.brand_name} (${row.canonical_domain})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

transferProfile();
