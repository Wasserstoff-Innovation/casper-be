/**
 * Clean up all brand profiles and related data
 * Run with: node scripts/cleanup_all_profiles.js
 */

require('dotenv').config();
const { Client } = require('pg');

async function cleanupAllProfiles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // List current profiles
    const profiles = await client.query('SELECT id, canonical_domain, brand_name, status FROM brand_profiles ORDER BY id');
    console.log('\n📊 Current profiles:');
    profiles.rows.forEach(p => {
      console.log(`  - ID ${p.id}: ${p.brand_name || 'Unnamed'} (${p.canonical_domain || 'no domain'}) - ${p.status}`);
    });

    // Delete all related data (in correct order due to foreign keys)
    console.log('\n🗑️  Deleting all brand profile data...');

    await client.query('DELETE FROM brand_social_profiles');
    console.log('✅ Deleted all social profiles');

    await client.query('DELETE FROM brand_roadmap_tasks');
    console.log('✅ Deleted all roadmap tasks');

    await client.query('DELETE FROM brand_roadmap_campaigns');
    console.log('✅ Deleted all roadmap campaigns');

    await client.query('DELETE FROM brand_kits');
    console.log('✅ Deleted all brand kits');

    await client.query('DELETE FROM brand_profiles');
    console.log('✅ Deleted all brand profiles');

    // Verify cleanup
    const remaining = await client.query('SELECT COUNT(*) FROM brand_profiles');
    console.log(`\n✅ Cleanup complete! Remaining profiles: ${remaining.rows[0].count}`);

    console.log('\n🎯 Database is now clean and ready for comprehensive-format-only data!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

cleanupAllProfiles().catch(console.error);
