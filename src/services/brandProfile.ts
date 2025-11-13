import axios from "axios";
import db from "../config/db";
import { brandProfiles, brandKits } from "../model/schema";
import { eq } from "drizzle-orm";
import { envConfigs } from "../config/envConfig";
import { BrandKitTransformer } from "./brandKitTransformer";

// v2 API endpoint for brand intelligence
const API_BASE_URL = `${envConfigs.aiBackendUrl}/v2/brand-intelligence`;

interface CreateJobInput {
  userId: number;
  url: string; // Required for v2
  include_screenshots?: boolean;
  include_web_search?: boolean;
  max_pages?: number;
  // Legacy support (will be converted to url)
  source_type?: string;
  website?: string | null;
  file?: Buffer | null;
}

export default class BrandProfileService {

 static createBrandProfileJob = async (input: CreateJobInput) => {
  try {
    // Determine URL - prioritize new url field, fallback to website, or error
    const url = input.url || input.website;
    if (!url) {
      throw new Error('URL is required for brand intelligence analysis');
    }

    // Prepare v2 API request payload
    const payload: any = {
      url: url,
      include_screenshots: input.include_screenshots !== undefined ? input.include_screenshots : true,
      include_web_search: input.include_web_search !== undefined ? input.include_web_search : true,
      max_pages: input.max_pages || 20
    };

    // Note: v2 API doesn't support CSV file uploads directly
    // If file is provided, it would need to be handled separately or uploaded first
    if (input.file) {
      console.warn('File upload not directly supported in v2 API. File will be ignored.');
    }

    const response = await axios.post(`${API_BASE_URL}/analyze`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { job_id, status, message } = response.data;
    
    // Save job_id and status in DB
    const inserted = await db.insert(brandProfiles).values({
      userId: input.userId,
      jobId: job_id,
      profileId: null, // will update later when job completes
      status: status || 'queued',
      data: { status, job_id, message, url },
      brandKit: null, // Will be populated when job completes
      brandScores: null, // Will be populated when job completes
      brandRoadmap: null, // Will be populated when job completes
    }).returning();

    return inserted[0];
  } catch (error: any) {
    console.error('Error creating Brand Profile Job:', error.response?.data || error.message);
    throw error;
  }
};

// Get Job Status
static getBrandProfileJobStatus = async (jobId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`);
    const { job_id, status, result } = response.data;

    // Prepare update data
    const updateData: any = {
      status: status,
      updated_at: new Date(),
      data: { ...response.data } // Store full response for backward compatibility
    };

    // If job is complete, extract and store v2 structured data
    if (status === 'complete' && result) {
      updateData.profileId = job_id; // Use job_id as profileId for v2
      updateData.brandKit = result.brand_kit || null;
      updateData.brandScores = result.brand_scores || null;
      updateData.brandRoadmap = result.brand_roadmap || null;
    }

    // Update brandProfiles table
    const updated = await db.update(brandProfiles)
      .set(updateData)
      .where(eq(brandProfiles.jobId, jobId))
      .returning();

    // AUTO-CREATE BRAND KIT: If job is complete and has brand_kit data, auto-create the brand kit
    if (status === 'complete' && result?.brand_kit && updated.length > 0) {
      const brandProfile = updated[0];
      
      // Check if brand kit already exists for this profile
      const existingKit = await db.select()
        .from(brandKits)
        .where(eq(brandKits.brandProfileId, brandProfile.id))
        .limit(1);
      
      // Auto-create brand kit from v2 data using comprehensive structure
      try {
        console.log('🔄 Starting brand kit transformation for job:', job_id);
        console.log('📊 Brand kit data keys:', Object.keys(result.brand_kit || {}));
        
        // Transform v2 data to comprehensive brand kit format
        const domain = result.brand_kit.domain || 'unknown';
        console.log('🌐 Using domain:', domain);
        
        const comprehensiveBrandKit = BrandKitTransformer.transformV2ToBrandKit(
          result,
          domain
        );
        
        console.log('✅ Transformation complete. Brand kit sections:', Object.keys(comprehensiveBrandKit));
        
        // Also include raw v2 data for backward compatibility
        const kitData = {
          // Comprehensive structured format
          comprehensive: comprehensiveBrandKit,
          // Raw v2 data (legacy/backward compatibility)
          v2_raw: {
            brand_name: result.brand_kit.brand_name,
            domain: result.brand_kit.domain,
            visual_identity: result.brand_kit.visual_identity,
            voice_and_tone: result.brand_kit.voice_and_tone,
            positioning: result.brand_kit.positioning,
            audience: result.brand_kit.audience,
            seo_foundation: result.brand_kit.seo_foundation,
            content_strategy: result.brand_kit.content_strategy,
            trust_elements: result.brand_kit.trust_elements,
            conversion_analysis: result.brand_kit.conversion_analysis,
            competitor_analysis: result.brand_kit.competitor_analysis,
            evidence_sources: result.brand_kit.evidence_sources,
            brand_scores: result.brand_scores,
            brand_roadmap: result.brand_roadmap,
            generated_at: result.brand_kit.generated_at,
          },
          // Metadata
          format_version: '2.0',
          source: 'v2_brand_intelligence_auto',
          generated_at: result.brand_kit.generated_at,
        };

        console.log('💾 Saving brand kit to database...');
        const savedKit = await db.insert(brandKits)
          .values({
            userId: brandProfile.userId,
            brandProfileId: brandProfile.id,
            kitData: kitData,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .onConflictDoUpdate({
            target: brandKits.brandProfileId,
            set: {
              kitData: kitData,
              updated_at: new Date(),
            },
          })
          .returning();
        
        if (!savedKit || savedKit.length === 0) {
          throw new Error('Failed to save brand kit - no record returned');
        }
        
        // Verify the kitData was saved correctly
        const verifyKit = await db.select()
          .from(brandKits)
          .where(eq(brandKits.id, savedKit[0].id))
          .limit(1);
        
        if (verifyKit.length === 0) {
          throw new Error('Brand kit was not found after save');
        }
        
        const savedKitData = verifyKit[0].kitData as any;
        console.log('✅ Auto-created brand kit for profile:', job_id);
        console.log('📦 Brand kit ID:', savedKit[0]?.id);
        console.log('📋 Kit data structure:', {
          hasComprehensive: !!savedKitData?.comprehensive,
          hasV2Raw: !!savedKitData?.v2_raw,
          comprehensiveKeys: savedKitData?.comprehensive ? Object.keys(savedKitData.comprehensive) : [],
          brandName: savedKitData?.comprehensive?.meta?.brand_name?.value || savedKitData?.v2_raw?.brand_name,
        });
      } catch (kitError: any) {
        console.error('❌ Failed to auto-create brand kit:', kitError.message);
        console.error('❌ Error stack:', kitError.stack);
        console.error('❌ Result structure:', JSON.stringify(result, null, 2).substring(0, 500));
        // Don't fail the whole request if brand kit creation fails
      }
    }

    return response.data;
  } catch (error: any) {
    console.error('Error fetching Job Status:', error.response?.data || error.message);
    throw error;
  }
};

// Get Brand Profile
// For v2, we can get the profile from the database directly using profileId
// Or fetch from API if needed. Since v2 returns everything in job status,
// we'll primarily use the database record.
static getBrandProfile = async (profileId: string) => {
  try {
    // First try to get from database
    const profile = await db.select()
      .from(brandProfiles)
      .where(eq(brandProfiles.profileId, profileId))
      .limit(1);

    if (profile.length > 0 && profile[0].status === 'complete') {
      // Return structured v2 data from database
      return {
        job_id: profile[0].jobId,
        profile_id: profile[0].profileId,
        status: profile[0].status,
        result: {
          brand_kit: profile[0].brandKit,
          brand_scores: profile[0].brandScores,
          brand_roadmap: profile[0].brandRoadmap
        },
        // Include full data for backward compatibility
        data: profile[0].data
      };
    }

    // If not found in DB or incomplete, try API (for backward compatibility)
    // Note: v2 API doesn't have a separate profile endpoint, so this is legacy support
    const response = await axios.get(`${envConfigs.aiBackendUrl}/v1/brand-profiles/${profileId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Brand Profile:', error.response?.data || error.message);
    throw error;
  }
};
}
  