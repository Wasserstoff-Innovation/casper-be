const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function inspectProfile() {
  const client = await pool.connect();

  try {
    // Get profile 42
    const result = await client.query(`
      SELECT
        id, brand_name, persona_id, overall_score, completeness_score,
        total_critical_gaps, has_social_profiles, has_blog,
        brand_kit::text, brand_scores::text, brand_roadmap::text
      FROM brand_profiles
      WHERE id = 42
    `);

    if (result.rows.length === 0) {
      console.log('No profile found with ID 42');
      return;
    }

    const profile = result.rows[0];

    console.log('\n=== SUMMARY COLUMNS ===');
    console.log('Brand Name:', profile.brand_name);
    console.log('Persona:', profile.persona_id);
    console.log('Overall Score:', profile.overall_score);
    console.log('Completeness:', profile.completeness_score);
    console.log('Critical Gaps:', profile.total_critical_gaps);
    console.log('Has Social:', profile.has_social_profiles);
    console.log('Has Blog:', profile.has_blog);

    console.log('\n=== BRAND KIT STRUCTURE ===');
    if (profile.brand_kit) {
      const kit = JSON.parse(profile.brand_kit);
      console.log('Top-level keys:', Object.keys(kit));

      if (kit.meta) {
        console.log('\nMeta keys:', Object.keys(kit.meta));
      }

      if (kit.visual_identity) {
        console.log('Visual Identity keys:', Object.keys(kit.visual_identity));
      }

      if (kit.gaps_summary) {
        console.log('\nGaps Summary:', JSON.stringify(kit.gaps_summary, null, 2).substring(0, 500));
      }
    } else {
      console.log('brand_kit is NULL');
    }

    console.log('\n=== BRAND SCORES ===');
    if (profile.brand_scores) {
      const scores = JSON.parse(profile.brand_scores);
      console.log(JSON.stringify(scores, null, 2));
    } else {
      console.log('brand_scores is NULL');
    }

    console.log('\n=== ROADMAP TASKS ===');
    const tasks = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE is_quick_win = 1) as quick_wins
      FROM brand_roadmap_tasks
      WHERE brand_profile_id = 42
    `);
    console.log('Total tasks:', tasks.rows[0].total);
    console.log('Quick wins:', tasks.rows[0].quick_wins);

    console.log('\n=== SOCIAL PROFILES ===');
    const social = await client.query(`
      SELECT COUNT(*), platform
      FROM brand_social_profiles
      WHERE brand_profile_id = 42
      GROUP BY platform
    `);
    console.log('Social profiles:', social.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

inspectProfile();
