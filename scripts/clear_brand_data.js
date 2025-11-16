/**
 * Safe script to clear all brand-related data from the database
 *
 * Deletes in order (respecting foreign key constraints):
 * 1. content_calander (references campaign_plans)
 * 2. campaign_plans (references brand_profiles)
 * 3. brand_roadmap_tasks (references campaigns, milestones, brand_profiles)
 * 4. brand_roadmap_milestones (references campaigns)
 * 5. brand_roadmap_campaigns (references brand_profiles)
 * 6. brand_social_profiles (references brand_profiles)
 * 7. brand_kits (references brand_profiles)
 * 8. brand_profiles (references users)
 *
 * Does NOT delete:
 * - users table
 * - image generation data
 * - visited users
 * - any other non-brand data
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function clearBrandData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔍 Checking current data counts...\n');
    
    // Get counts before deletion
    const countsBefore = {
      content_calander: (await client.query('SELECT COUNT(*) FROM content_calander')).rows[0].count,
      campaign_plans: (await client.query('SELECT COUNT(*) FROM campaign_plans')).rows[0].count,
      brand_roadmap_tasks: (await client.query('SELECT COUNT(*) FROM brand_roadmap_tasks')).rows[0].count,
      brand_roadmap_milestones: (await client.query('SELECT COUNT(*) FROM brand_roadmap_milestones')).rows[0].count,
      brand_roadmap_campaigns: (await client.query('SELECT COUNT(*) FROM brand_roadmap_campaigns')).rows[0].count,
      brand_social_profiles: (await client.query('SELECT COUNT(*) FROM brand_social_profiles')).rows[0].count,
      brand_kits: (await client.query('SELECT COUNT(*) FROM brand_kits')).rows[0].count,
      brand_profiles: (await client.query('SELECT COUNT(*) FROM brand_profiles')).rows[0].count,
    };

    console.log('📊 Current counts:');
    console.log(`  - content_calander: ${countsBefore.content_calander}`);
    console.log(`  - campaign_plans: ${countsBefore.campaign_plans}`);
    console.log(`  - brand_roadmap_tasks: ${countsBefore.brand_roadmap_tasks}`);
    console.log(`  - brand_roadmap_milestones: ${countsBefore.brand_roadmap_milestones}`);
    console.log(`  - brand_roadmap_campaigns: ${countsBefore.brand_roadmap_campaigns}`);
    console.log(`  - brand_social_profiles: ${countsBefore.brand_social_profiles}`);
    console.log(`  - brand_kits: ${countsBefore.brand_kits}`);
    console.log(`  - brand_profiles: ${countsBefore.brand_profiles}\n`);
    
    if (countsBefore.brand_profiles === '0' && countsBefore.brand_kits === '0') {
      console.log('✅ No brand data to delete. Database is already clean.\n');
      await client.query('COMMIT');
      return;
    }
    
    console.log('🗑️  Starting deletion (in correct order to respect foreign keys)...\n');

    // 1. Delete content_calander first (references campaign_plans)
    const contentCalResult = await client.query('DELETE FROM content_calander');
    console.log(`✅ Deleted ${contentCalResult.rowCount} content calendar entries`);

    // 2. Delete campaign_plans (references brand_profiles)
    const campaignResult = await client.query('DELETE FROM campaign_plans');
    console.log(`✅ Deleted ${campaignResult.rowCount} campaign plans`);

    // 3. Delete brand_roadmap_tasks (references campaigns, milestones, brand_profiles)
    const roadmapTasksResult = await client.query('DELETE FROM brand_roadmap_tasks');
    console.log(`✅ Deleted ${roadmapTasksResult.rowCount} roadmap tasks`);

    // 4. Delete brand_roadmap_milestones (references campaigns)
    const roadmapMilestonesResult = await client.query('DELETE FROM brand_roadmap_milestones');
    console.log(`✅ Deleted ${roadmapMilestonesResult.rowCount} roadmap milestones`);

    // 5. Delete brand_roadmap_campaigns (references brand_profiles)
    const roadmapCampaignsResult = await client.query('DELETE FROM brand_roadmap_campaigns');
    console.log(`✅ Deleted ${roadmapCampaignsResult.rowCount} roadmap campaigns`);

    // 6. Delete brand_social_profiles (references brand_profiles)
    const socialProfilesResult = await client.query('DELETE FROM brand_social_profiles');
    console.log(`✅ Deleted ${socialProfilesResult.rowCount} social profiles`);

    // 7. Delete brand_kits (references brand_profiles)
    const brandKitsResult = await client.query('DELETE FROM brand_kits');
    console.log(`✅ Deleted ${brandKitsResult.rowCount} brand kits`);

    // 8. Delete brand_profiles last (references users, but we're not deleting users)
    const brandProfilesResult = await client.query('DELETE FROM brand_profiles');
    console.log(`✅ Deleted ${brandProfilesResult.rowCount} brand profiles\n`);
    
    // Verify deletion
    console.log('🔍 Verifying deletion...\n');
    
    const countsAfter = {
      content_calander: (await client.query('SELECT COUNT(*) FROM content_calander')).rows[0].count,
      campaign_plans: (await client.query('SELECT COUNT(*) FROM campaign_plans')).rows[0].count,
      brand_roadmap_tasks: (await client.query('SELECT COUNT(*) FROM brand_roadmap_tasks')).rows[0].count,
      brand_roadmap_milestones: (await client.query('SELECT COUNT(*) FROM brand_roadmap_milestones')).rows[0].count,
      brand_roadmap_campaigns: (await client.query('SELECT COUNT(*) FROM brand_roadmap_campaigns')).rows[0].count,
      brand_social_profiles: (await client.query('SELECT COUNT(*) FROM brand_social_profiles')).rows[0].count,
      brand_kits: (await client.query('SELECT COUNT(*) FROM brand_kits')).rows[0].count,
      brand_profiles: (await client.query('SELECT COUNT(*) FROM brand_profiles')).rows[0].count,
    };

    console.log('📊 Final counts:');
    console.log(`  - content_calander: ${countsAfter.content_calander}`);
    console.log(`  - campaign_plans: ${countsAfter.campaign_plans}`);
    console.log(`  - brand_roadmap_tasks: ${countsAfter.brand_roadmap_tasks}`);
    console.log(`  - brand_roadmap_milestones: ${countsAfter.brand_roadmap_milestones}`);
    console.log(`  - brand_roadmap_campaigns: ${countsAfter.brand_roadmap_campaigns}`);
    console.log(`  - brand_social_profiles: ${countsAfter.brand_social_profiles}`);
    console.log(`  - brand_kits: ${countsAfter.brand_kits}`);
    console.log(`  - brand_profiles: ${countsAfter.brand_profiles}\n`);
    
    // Verify all are zero
    const allZero = Object.values(countsAfter).every(count => count === '0');
    
    if (allZero) {
      console.log('✅ SUCCESS: All brand data cleared successfully!\n');
      await client.query('COMMIT');
    } else {
      console.error('❌ ERROR: Some data still exists. Rolling back...\n');
      await client.query('ROLLBACK');
      throw new Error('Deletion verification failed');
    }
    
    // Show what was preserved
    const usersCount = (await client.query('SELECT COUNT(*) FROM users')).rows[0].count;
    const imageJobsCount = (await client.query('SELECT COUNT(*) FROM image_generation_jobs')).rows[0].count;
    
    console.log('📋 Preserved data:');
    console.log(`  - users: ${usersCount}`);
    console.log(`  - image_generation_jobs: ${imageJobsCount}`);
    console.log('  - All other non-brand tables\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error clearing brand data:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
  }
}

// Run the cleanup
clearBrandData()
  .then(() => {
    console.log('🎉 Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });

