import axios from "axios";
import db from "../config/db";
import { brandProfiles, brandKits, brandRoadmapCampaigns, brandRoadmapTasks, brandSocialProfiles } from "../model/schema";
import { eq, desc } from "drizzle-orm";
import { envConfigs } from "../config/envConfig";
import { BrandKitTransformer } from "./brandKitTransformer";
import { BrandDataExtractor } from "./brandDataExtractor";

// Wisdom Tree API endpoint for brand intelligence
const API_BASE_URL = `${envConfigs.aiBackendUrl}/v2/brand-intelligence/wisdom-tree`;

interface AnalysisComponentsConfig {
  visual_identity?: boolean;
  brand_strategy?: boolean;
  seo_content?: boolean;
  conversion_trust?: boolean;
  competitor_analysis?: boolean;
  evidence_extraction?: boolean;
}

interface EvidenceCollectionConfig {
  include_screenshots?: boolean;
  include_web_search?: boolean;
  max_pages?: number;
  max_search_queries?: number;
}

interface BrandIntelligenceConfig {
  depth?: 'light' | 'medium' | 'deep';
  components?: AnalysisComponentsConfig;
  evidence?: EvidenceCollectionConfig;
}

interface CreateJobInput {
  userId: number;
  url: string; // Required for v2
  depth?: 'light' | 'medium' | 'deep';
  override_persona?: string; // NEW: Optional persona override (e.g., 'saas_startup', 'local_service')
  config?: BrandIntelligenceConfig;
  // Legacy parameters (for backward compatibility)
  include_screenshots?: boolean;
  include_web_search?: boolean;
  max_pages?: number;
  source_type?: string;
  website?: string | null;
  file?: Buffer | null;
}

export default class BrandProfileService {

 static async createBrandProfileJob(input: CreateJobInput) {
  try {
    // Determine URL - prioritize new url field, fallback to website, or error
    const url = input.url || input.website;
    if (!url) {
      throw new Error('URL is required for brand intelligence analysis');
    }

    // Prepare Wisdom Tree API request payload with new modular config support
    const payload: any = {
      url: url,
      depth: input.depth || 'medium',
    };

    // Add override_persona if provided
    if (input.override_persona) {
      payload.override_persona = input.override_persona;
    }

    // Support new modular analysis config
    if (input.config) {
      // Update depth if provided in config
      if (input.config.depth) {
        payload.depth = input.config.depth;
      }
      if (input.config.components) {
        payload.config = {
          ...payload.config,
          components: input.config.components
        };
      }
      if (input.config.evidence) {
        payload.config = {
          ...payload.config,
          evidence: {
            include_screenshots: input.config.evidence.include_screenshots !== undefined 
              ? input.config.evidence.include_screenshots 
              : (input.include_screenshots !== undefined ? input.include_screenshots : true),
            include_web_search: input.config.evidence.include_web_search !== undefined
              ? input.config.evidence.include_web_search
              : (input.include_web_search !== undefined ? input.include_web_search : true),
            max_pages: input.config.evidence.max_pages || input.max_pages || 20,
            max_search_queries: input.config.evidence.max_search_queries || 10,
          }
        };
      }
    } else {
      // Legacy parameters (backward compatibility)
      payload.include_screenshots = input.include_screenshots !== undefined ? input.include_screenshots : true;
      payload.include_web_search = input.include_web_search !== undefined ? input.include_web_search : true;
      payload.max_pages = input.max_pages || 20;
    }

    // Note: v2 API doesn't support CSV file uploads directly
    // If file is provided, it would need to be handled separately or uploaded first
    if (input.file) {
      console.warn('File upload not directly supported in v2 API. File will be ignored.');
    }

    console.log('📡 Calling Wisdom Tree API:', `${API_BASE_URL}/analyze`);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    let response;
    try {
      response = await axios.post(`${API_BASE_URL}/analyze`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });
    } catch (error: any) {
      // Better error handling for 502 and other server errors
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        const data = error.response.data;
        
        if (status === 502) {
          console.error('❌ 502 Bad Gateway - Backend API server is down or unreachable');
          console.error('🔗 API URL:', `${API_BASE_URL}/analyze`);
          throw new Error('Brand intelligence service is temporarily unavailable. Please try again in a few moments.');
        }
        
        if (status === 503) {
          console.error('❌ 503 Service Unavailable - Backend API is overloaded');
          throw new Error('Brand intelligence service is currently overloaded. Please try again later.');
        }
        
        if (status === 504) {
          console.error('❌ 504 Gateway Timeout - Backend API took too long to respond');
          throw new Error('Request timed out. The analysis may take longer than expected. Please try again.');
        }
        
        // For other HTTP errors, include status and message
        const errorMessage = typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data).substring(0, 200);
        console.error(`❌ API Error ${status} ${statusText}:`, errorMessage);
        throw new Error(`Brand intelligence API error (${status}): ${errorMessage}`);
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Connection Refused - Backend API is not running');
        console.error('🔗 API URL:', `${API_BASE_URL}/analyze`);
        throw new Error('Cannot connect to brand intelligence service. Please check if the service is running.');
      }
      
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        console.error('❌ Request Timeout - Backend API did not respond in time');
        throw new Error('Request timed out. Please try again.');
      }
      
      // Generic error
      console.error('❌ Network Error:', error.message);
      throw new Error(`Failed to connect to brand intelligence service: ${error.message}`);
    }

    const { job_id, status, message } = response.data;
    
    // Save job_id and status in DB
    const inserted = await db.insert(brandProfiles).values({
      userId: input.userId,
      jobId: job_id,
      profileId: null, // will update later when job completes
      status: status || 'queued',
      // Note: jobStartedAt will be set when job status changes to 'processing'
      data: { status, job_id, message, url },
      brandKit: null, // Will be populated when job completes
      brandScores: null, // Will be populated when job completes
      brandRoadmap: null, // Will be populated when job completes
      analysis_context: null, // NEW: Will be populated when job completes
    }).returning();

    return inserted[0];
  } catch (error: any) {
    console.error('❌ Error creating Brand Profile Job:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Detail:', error.detail);
    console.error('  Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
}

// Get Module Job Status (different endpoint than regular jobs!)
static async getModuleJobStatus(jobId: string) {
  try {
    // Module jobs use /modules/{job_id} endpoint instead of /jobs/{job_id}
    const response = await axios.get(`${API_BASE_URL}/modules/${jobId}`);
    const { job_id, module_id, status, result } = response.data;

    console.log(`📊 Module job ${job_id} status: ${status} (module: ${module_id})`);

    // If complete, merge the brand_kit_patch into existing profile
    if (status === 'complete' && result?.brand_kit_patch) {
      // TODO: Implement brand kit patch merging
      console.log('✅ Module analysis complete, patch available:', Object.keys(result.brand_kit_patch));
    }

    return response.data;
  } catch (error: any) {
    console.error('Error fetching Module Job Status:', error.response?.data || error.message);
    throw error;
  }
}

// Get Job Status
static async getBrandProfileJobStatus(jobId: string) {
  try {
    let response;
    try {
      // Try regular job endpoint first
      response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`);
    } catch (regularJobError: any) {
      // If 404 or "Job not found", try module endpoint
      if (regularJobError.response?.status === 404 ||
          regularJobError.response?.data?.detail === 'Job not found') {
        console.log('⚠️ Regular job not found, trying module job endpoint...');
        return await this.getModuleJobStatus(jobId);
      }
      throw regularJobError;
    }

    const { job_id, status, result, error } = response.data;

    // Get current job record to check if status changed
    const currentJob = await db.select()
      .from(brandProfiles)
      .where(eq(brandProfiles.jobId, jobId))
      .limit(1);

    // Prepare update data
    const updateData: any = {
      status: status,
      updated_at: new Date(),
      data: { ...response.data } // Store full response for backward compatibility
    };

    // If job status changed to 'processing' from 'queued', set jobStartedAt
    if (currentJob.length > 0 && currentJob[0].status === 'queued' && status === 'processing') {
      updateData.jobStartedAt = new Date(); // Track when job started processing
      console.log('✅ Job started processing, setting jobStartedAt');
    }

    // If job is complete, extract and store structured data
    // Wisdom Tree API returns comprehensive format with analysis_context
    if (status === 'complete' && result) {
      updateData.profileId = job_id; // Use job_id as profileId for v2
      updateData.jobCompletedAt = new Date(); // Track when job completed
      // Also set jobStartedAt if it wasn't set (in case we missed the 'processing' status)
      if (currentJob.length > 0 && !currentJob[0].jobStartedAt) {
        updateData.jobStartedAt = new Date(); // Fallback: set started time same as completion
      }
      // Store comprehensive format (preferred) or fallback to brand_kit
      updateData.brandKit = result.comprehensive || result.brand_kit || null;
      updateData.brandScores = result.brand_scores || null;
      updateData.brandRoadmap = result.brand_roadmap || null;
      updateData.analysis_context = result.analysis_context || null; // NEW: Store analysis context

      // Extract summary columns for fast queries
      try {
        const summary = BrandDataExtractor.extractSummaryColumns(result);
        Object.assign(updateData, summary);
        console.log('✅ Extracted summary columns:', summary);
      } catch (extractError: any) {
        console.error('⚠️ Failed to extract summary columns:', extractError.message);
        // Don't fail the whole operation if summary extraction fails
      }
    }

    // If job failed, store error message and completion time
    if (status === 'failed' && error) {
      updateData.jobError = error; // Store error in new jobError field
      updateData.jobCompletedAt = new Date(); // Track when job failed
      // Also set jobStartedAt if it wasn't set (in case we missed the 'processing' status)
      if (currentJob.length > 0 && !currentJob[0].jobStartedAt) {
        updateData.jobStartedAt = new Date(); // Fallback: set started time same as failure
      }
    }

    // Update brandProfiles table
    const updated = await db.update(brandProfiles)
      .set(updateData)
      .where(eq(brandProfiles.jobId, jobId))
      .returning();

    // AUTO-CREATE BRAND KIT: If job is complete, auto-create the brand kit
    // Backend now returns comprehensive format directly when format=comprehensive
    if (status === 'complete' && result && updated.length > 0) {
      const brandProfile = updated[0];
      
      // Check if brand kit already exists for this profile
      const existingKit = await db.select()
        .from(brandKits)
        .where(eq(brandKits.brandProfileId, brandProfile.id))
        .limit(1);
      
      // Auto-create brand kit using comprehensive format from backend
      try {
        console.log('🔄 Auto-creating brand kit for job:', job_id);
        
        // Backend returns comprehensive format directly when format=comprehensive
        // Structure: result.comprehensive (the comprehensive brand kit from Python transformer)
        //           result.brand_kit (may also contain comprehensive format with FieldValue objects)
        //           result.brand_scores
        //           result.brand_roadmap

        let comprehensiveBrandKit = result.comprehensive;

        // UPDATED: Check if result.brand_kit has comprehensive format (FieldValue objects)
        if (!comprehensiveBrandKit && result.brand_kit) {
          // Check if brand_kit has comprehensive sections with FieldValue structure
          const hasComprehensiveFormat =
            result.brand_kit.verbal_identity?.elevator_pitch?.value !== undefined ||
            result.brand_kit.audience_positioning?.primary_icp?.value !== undefined ||
            result.brand_kit.proof_trust?.testimonials?.value !== undefined;

          if (hasComprehensiveFormat) {
            console.log('✅ Using result.brand_kit as comprehensive format (has FieldValue objects)');
            comprehensiveBrandKit = result.brand_kit;
          } else {
            console.warn('⚠️ No comprehensive format in result - falling back to TypeScript transformer');
            console.log('⚠️ Falling back to TypeScript transformer');
            const domain = result.brand_kit.domain || 'unknown';
            const transformed = BrandKitTransformer.transformV2ToBrandKit(result, domain);

            // Set comprehensiveBrandKit to the transformed data for use below
            comprehensiveBrandKit = transformed;

            const kitData = {
              comprehensive: transformed,
              v2_raw: {
                brand_kit: result.brand_kit,
                brand_scores: result.brand_scores,
                brand_roadmap: result.brand_roadmap,
                generated_at: result.brand_kit.generated_at,
              },
              format_version: '2.0',
              source: 'v2_brand_intelligence_auto_fallback',
              generated_at: result.brand_kit.generated_at || new Date().toISOString(),
            };

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

            console.log('✅ Brand kit created using TypeScript transformer fallback');
            // Don't return here - continue to roadmap/social profile extraction below
          }
        } else if (!comprehensiveBrandKit) {
          throw new Error('No brand kit data available in result');
        }
        
        // Only save if we haven't already saved in the fallback block above
        // Save when: result.comprehensive exists OR result.brand_kit was used as comprehensive format
        if (result.comprehensive || (comprehensiveBrandKit === result.brand_kit)) {
          console.log('✅ Comprehensive brand kit received from backend. Sections:', Object.keys(comprehensiveBrandKit));

          // Prepare kit data structure - use comprehensive format directly from backend
          const kitData = {
            // Comprehensive structured format (from backend Python transformer)
            comprehensive: comprehensiveBrandKit,
            // Raw v2 data (for backward compatibility and debug)
            v2_raw: {
              brand_kit: result.brand_kit || {},
              brand_scores: result.brand_scores || {},
              brand_roadmap: result.brand_roadmap || {},
              generated_at: result.brand_kit?.generated_at || comprehensiveBrandKit.meta?.audit_timestamp?.value,
            },
            // Metadata
            format_version: '2.0',
            source: 'v2_brand_intelligence_auto',
            generated_at: result.brand_kit?.generated_at || comprehensiveBrandKit.meta?.audit_timestamp?.value || new Date().toISOString(),
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
        }

        // Normalize roadmap into relational tables
        try {
          console.log('🔄 Normalizing roadmap data...');
          const roadmapData = BrandDataExtractor.extractRoadmapData(result.brand_roadmap, brandProfile.id);

          // Insert campaigns
          if (roadmapData.campaigns.length > 0) {
            await db.insert(brandRoadmapCampaigns)
              .values(roadmapData.campaigns)
              .onConflictDoUpdate({
                target: brandRoadmapCampaigns.id,
                set: {
                  title: roadmapData.campaigns[0].title,
                  updatedAt: new Date(),
                },
              });
            console.log(`✅ Inserted ${roadmapData.campaigns.length} campaigns`);
          }

          // Insert tasks
          if (roadmapData.tasks.length > 0) {
            await db.insert(brandRoadmapTasks)
              .values(roadmapData.tasks)
              .onConflictDoUpdate({
                target: brandRoadmapTasks.id,
                set: {
                  status: roadmapData.tasks[0].status,
                  updatedAt: new Date(),
                },
              });
            console.log(`✅ Inserted ${roadmapData.tasks.length} tasks`);
          }
        } catch (roadmapError: any) {
          console.error('⚠️ Failed to normalize roadmap:', roadmapError.message);
          // Don't fail the whole operation
        }

        // Extract and save social profiles
        try {
          console.log('🔄 Extracting social profiles...');
          const socialProfiles = BrandDataExtractor.extractSocialProfiles(comprehensiveBrandKit);

          if (socialProfiles.length > 0) {
            const profilesData = socialProfiles.map(profile => ({
              brandProfileId: brandProfile.id,
              platform: profile.platform,
              profileType: profile.profileType,
              url: profile.url,
              status: profile.status,
              source: profile.source,
            }));

            // Delete existing profiles for this brand and insert new ones
            await db.delete(brandSocialProfiles)
              .where(eq(brandSocialProfiles.brandProfileId, brandProfile.id));

            await db.insert(brandSocialProfiles).values(profilesData);
            console.log(`✅ Inserted ${socialProfiles.length} social profiles`);
          } else {
            console.log('ℹ️ No social profiles found');
          }
        } catch (socialError: any) {
          console.error('⚠️ Failed to extract social profiles:', socialError.message);
          // Don't fail the whole operation
        }

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
}

// Get Brand Profile
// For v2, we can get the profile from the database directly using profileId
// Or fetch from API if needed. Since v2 returns everything in job status,
// we'll primarily use the database record.
static async getBrandProfile(profileId: string) {
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

    // If not found in DB or incomplete, try fetching from backend API
    try {
      // Try v2 API first (using job_id if we have it) - request comprehensive format
      if (profile.length > 0 && profile[0].jobId) {
        const jobResponse = await axios.get(`${API_BASE_URL}/jobs/${profile[0].jobId}?format=comprehensive`);
        if (jobResponse.data.status === 'complete' && jobResponse.data.result) {
          // Update our DB with the fresh data
          await db.update(brandProfiles)
            .set({
              status: 'complete',
              brandKit: jobResponse.data.result.comprehensive || jobResponse.data.result.brand_kit,
              brandScores: jobResponse.data.result.brand_scores,
              brandRoadmap: jobResponse.data.result.brand_roadmap,
              updated_at: new Date(),
            })
            .where(eq(brandProfiles.profileId, profileId));
          
          return {
            job_id: profile[0].jobId,
            profile_id: profileId,
            status: 'complete',
            result: jobResponse.data.result,
            data: jobResponse.data
          };
        }
      }
      
      // Fallback to v1 API (legacy support)
      const response = await axios.get(`${envConfigs.aiBackendUrl}/v1/brand-profiles/${profileId}`);
    return response.data;
    } catch (apiError: any) {
      // If API also fails, only then say it's not available
      console.error('Error fetching Brand Profile from API:', apiError.response?.data || apiError.message);
      throw new Error(`Brand profile not found in database or backend API. Profile ID: ${profileId}`);
    }
  } catch (error: any) {
    console.error('Error fetching Brand Profile:', error.message);
    throw error;
  }
}

// NEW: Re-analyze existing completed job - transform data and create/update brand kit
static async reAnalyzeBrandKit(jobId: string) {
  try {
    console.log('🔄 Re-analyzing brand kit for job:', jobId);
    
    // Get the brand profile
    const profile = await db.select()
      .from(brandProfiles)
      .where(eq(brandProfiles.jobId, jobId))
      .limit(1);

    if (profile.length === 0) {
      throw new Error('Brand profile not found for job: ' + jobId);
    }

    const brandProfile = profile[0];

    // Check if we have completed data
    if (brandProfile.status !== 'complete') {
      // Try to fetch fresh status from backend with comprehensive format
      try {
        const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}?format=comprehensive`);
        const { status, result } = response.data;
        
        if (status === 'complete' && result) {
          // Update DB with fresh data
          await db.update(brandProfiles)
            .set({
              status: 'complete',
              brandKit: result.comprehensive || result.brand_kit,
              brandScores: result.brand_scores,
              brandRoadmap: result.brand_roadmap,
              updated_at: new Date(),
            })
            .where(eq(brandProfiles.jobId, jobId));
          
          // Use the fresh data
          brandProfile.brandKit = result.comprehensive || result.brand_kit;
          brandProfile.brandScores = result.brand_scores;
          brandProfile.brandRoadmap = result.brand_roadmap;
        } else {
          throw new Error(`Job ${jobId} is not complete. Status: ${status}`);
        }
      } catch (apiError: any) {
        throw new Error(`Cannot re-analyze: Job is not complete and backend API unavailable. Status: ${brandProfile.status}`);
      }
    }

    // Get comprehensive format from backend (preferred) or use local data
    let comprehensiveBrandKit: any;
    let v2RawData: any = {
      brand_kit: brandProfile.brandKit || {},
      brand_scores: brandProfile.brandScores || {},
      brand_roadmap: brandProfile.brandRoadmap || {},
    };
    
    try {
      // Request comprehensive format directly from backend
      const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}?format=comprehensive`);
      if (response.data.status === 'complete' && response.data.result) {
        comprehensiveBrandKit = response.data.result.comprehensive;
        v2RawData = {
          brand_kit: response.data.result.brand_kit || {},
          brand_scores: response.data.result.brand_scores || {},
          brand_roadmap: response.data.result.brand_roadmap || {},
        };
        console.log('✅ Got comprehensive format directly from backend');
      }
    } catch (apiError: any) {
      console.warn('⚠️ Could not fetch from backend, using local data with fallback transformer');
      
      // Fallback: Use local data and transform if needed
      if (brandProfile.brandKit) {
        // Check if it's already in comprehensive format
        if (brandProfile.brandKit.meta && brandProfile.brandKit.visual_identity) {
          // Already comprehensive format
          comprehensiveBrandKit = brandProfile.brandKit;
          v2RawData = {
            brand_kit: brandProfile.brandKit,
            brand_scores: brandProfile.brandScores || {},
            brand_roadmap: brandProfile.brandRoadmap || {},
          };
        } else {
          // Need to transform - use TypeScript transformer as fallback
          const domain = brandProfile.brandKit.domain || 'unknown';
          comprehensiveBrandKit = BrandKitTransformer.transformV2ToBrandKit(
            {
              brand_kit: brandProfile.brandKit,
              brand_scores: brandProfile.brandScores || {},
              brand_roadmap: brandProfile.brandRoadmap || {},
            },
            domain
          );
          v2RawData = {
            brand_kit: brandProfile.brandKit,
            brand_scores: brandProfile.brandScores || {},
            brand_roadmap: brandProfile.brandRoadmap || {},
          };
          console.log('⚠️ Used TypeScript transformer as fallback');
        }
      } else {
        throw new Error('No brand kit data available for re-analysis');
      }
    }

    if (!comprehensiveBrandKit) {
      throw new Error('No comprehensive brand kit data available');
    }

    console.log('✅ Comprehensive brand kit ready. Sections:', Object.keys(comprehensiveBrandKit));

    // Create or update brand kit
    const kitData = {
      comprehensive: comprehensiveBrandKit,
      v2_raw: {
        brand_name: v2RawData.brand_kit?.brand_name || comprehensiveBrandKit.meta?.brand_name?.value,
        domain: v2RawData.brand_kit?.domain || comprehensiveBrandKit.meta?.canonical_domain?.value,
        visual_identity: v2RawData.brand_kit?.visual_identity,
        voice_and_tone: v2RawData.brand_kit?.voice_and_tone,
        positioning: v2RawData.brand_kit?.positioning,
        audience: v2RawData.brand_kit?.audience,
        seo_foundation: v2RawData.brand_kit?.seo_foundation,
        content_strategy: v2RawData.brand_kit?.content_strategy,
        trust_elements: v2RawData.brand_kit?.trust_elements,
        conversion_analysis: v2RawData.brand_kit?.conversion_analysis,
        competitor_analysis: v2RawData.brand_kit?.competitor_analysis,
        evidence_sources: v2RawData.brand_kit?.evidence_sources,
        brand_scores: v2RawData.brand_scores,
        brand_roadmap: v2RawData.brand_roadmap,
        generated_at: v2RawData.brand_kit?.generated_at || comprehensiveBrandKit.meta?.audit_timestamp?.value,
      },
      format_version: '2.0',
      source: 'v2_brand_intelligence_reanalyzed',
      generated_at: new Date().toISOString(),
    };

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

    console.log('✅ Brand kit re-analyzed and saved. Kit ID:', savedKit[0]?.id);

    return {
      success: true,
      message: 'Brand kit re-analyzed successfully',
      brandKit: savedKit[0],
    };
  } catch (error: any) {
    console.error('❌ Error re-analyzing brand kit:', error.message);
    throw error;
  }
}

// Get job history for a user
static async getJobHistory(userId: number) {
  try {
    const jobs = await db.select({
      id: brandProfiles.id,
      jobId: brandProfiles.jobId,
      url: brandProfiles.canonical_domain,
      brandName: brandProfiles.brand_name,
      status: brandProfiles.status,
      jobStartedAt: brandProfiles.jobStartedAt,
      jobCompletedAt: brandProfiles.jobCompletedAt,
      jobError: brandProfiles.jobError,
      personaId: brandProfiles.persona_id,
      entityType: brandProfiles.entity_type,
      createdAt: brandProfiles.created_at,
    })
      .from(brandProfiles)
      .where(eq(brandProfiles.userId, userId))
      .orderBy(desc(brandProfiles.created_at)); // Newest first

    // Transform to match API spec with enhanced metadata
    return jobs.map((job: any) => {
      // Calculate duration if job started and completed/failed
      let durationMs = null;
      let durationSeconds = null;
      if (job.jobStartedAt && job.jobCompletedAt) {
        durationMs = new Date(job.jobCompletedAt).getTime() - new Date(job.jobStartedAt).getTime();
        durationSeconds = Math.round(durationMs / 1000);
      }

      return {
        id: job.jobId,
        url: job.url,
        brandName: job.brandName,
        status: job.status,
        brandProfileId: job.id,
        startedAt: job.jobStartedAt,
        completedAt: job.jobCompletedAt,
        error: job.jobError,
        createdAt: job.createdAt,
        // Enhanced metadata
        personaId: job.personaId,
        entityType: job.entityType,
        durationSeconds: durationSeconds,
        isFailed: job.status === 'failed',
        isComplete: job.status === 'complete',
        isProcessing: job.status === 'processing' || job.status === 'queued',
      };
    });
  } catch (error: any) {
    console.error('❌ Error fetching job history:', error.message);
    throw error;
  }
}

// Get job details by job_id
static async getJobDetails(jobId: string, userId: number) {
  try {
    const jobs = await db.select()
      .from(brandProfiles)
      .where(eq(brandProfiles.jobId, jobId))
      .limit(1);

    if (jobs.length === 0) {
      return null;
    }

    const job = jobs[0];

    // Check if job belongs to user
    if (job.userId !== userId) {
      throw new Error('Unauthorized: Job does not belong to this user');
    }

    return {
      id: job.jobId,
      url: job.canonical_domain,
      brandName: job.brand_name,
      status: job.status,
      brandProfileId: job.id,
      result: {
        brandKit: job.brandKit,
        brandScores: job.brandScores,
        brandRoadmap: job.brandRoadmap,
        analysis_context: job.analysis_context,
      },
      startedAt: job.jobStartedAt,
      completedAt: job.jobCompletedAt,
      error: job.jobError,
      createdAt: job.created_at,
    };
  } catch (error: any) {
    console.error('❌ Error fetching job details:', error.message);
    throw error;
  }
}

// Re-analyze specific module for a brand profile
static async analyzeModule(
  profileId: number,
  userId: number,
  module: string,
  options?: {
    include_screenshots?: boolean;
    include_web_search?: boolean;
  }
) {
  try {
    // Known common modules (for reference, but not strict validation)
    // Different personas may have different modules, so we allow any module name
    const commonModules = [
      'visual_identity',
      'verbal_identity',
      'audience_positioning',
      'proof_trust',
      'seo_identity',
      'content_assets',
      'product_offers',
      'external_presence',
      // Persona-specific modules may include others
    ];

    // Validate module name format (alphanumeric + underscore only)
    if (!module || !/^[a-z_]+$/.test(module)) {
      throw new Error(`Invalid module name format: ${module}. Module names must be lowercase alphanumeric with underscores.`);
    }

    // Log if using a non-common module (might be persona-specific)
    if (!commonModules.includes(module)) {
      console.log(`⚠️ Using persona-specific or custom module: ${module}`);
    }

    // Get existing profile
    const profiles = await db.select()
      .from(brandProfiles)
      .where(eq(brandProfiles.id, profileId))
      .limit(1);

    if (profiles.length === 0) {
      throw new Error('Brand profile not found');
    }

    const profile = profiles[0];

    // Check ownership
    if (profile.userId !== userId) {
      throw new Error('Unauthorized: Profile does not belong to this user');
    }

    if (!profile.canonical_domain) {
      throw new Error('Profile does not have a domain URL');
    }

    console.log(`🔄 Re-analyzing module "${module}" for profile ${profileId} (${profile.canonical_domain})`);

    // Call Python backend for module-specific analysis using the new /analyze-module endpoint
    // IMPORTANT: Pass job_id for evidence reuse (88% cost savings!)
    const modulePayload: any = {
      url: `https://${profile.canonical_domain}`, // Add https:// protocol for Python backend
      module_id: module, // Python expects module_id
      persona_id: profile.persona_id || undefined, // Optional: helps Python validate module applicability
      job_id: profile.jobId || undefined, // CRITICAL: Reuse evidence from parent job (88% cheaper!)
    };

    console.log('📡 Calling Wisdom Tree API for targeted module analysis:', module);
    console.log('📦 Payload:', {
      module_id: module,
      persona_id: modulePayload.persona_id || 'auto-detect',
      parent_job_id: modulePayload.job_id,
      evidence_reuse: !!modulePayload.job_id ? 'YES (88% cost savings)' : 'NO (fresh scrape)',
    });

    const response = await axios.post(`${API_BASE_URL}/analyze-module`, modulePayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const { job_id, status } = response.data;

    console.log(`✅ Module analysis job created: ${job_id}, status: ${status}`);

    // Return job info for polling
    return {
      jobId: job_id,
      status: status,
      module: module,
      profileId: profileId,
      message: `Module "${module}" analysis started. Poll /api/brand-profiles/jobs/${job_id} for results.`,
    };

  } catch (error: any) {
    console.error('❌ Error analyzing module:', error.message);
    throw error;
  }
}

// Merge module results into existing brand kit
static async mergeModuleResults(profileId: number, module: string, moduleData: any) {
  try {
    // Get existing profile
    const profiles = await db.select()
      .from(brandProfiles)
      .where(eq(brandProfiles.id, profileId))
      .limit(1);

    if (profiles.length === 0) {
      throw new Error('Brand profile not found');
    }

    const profile = profiles[0];
    const existingBrandKit = profile.brandKit as any || {};

    // Merge module data into existing brand kit
    const updatedBrandKit = {
      ...existingBrandKit,
      [module]: moduleData,
    };

    // Update database
    await db.update(brandProfiles)
      .set({
        brandKit: updatedBrandKit,
        updated_at: new Date(),
      })
      .where(eq(brandProfiles.id, profileId));

    console.log(`✅ Module "${module}" merged into brand kit for profile ${profileId}`);

    return {
      success: true,
      module: module,
      brandProfileId: profileId,
    };
  } catch (error: any) {
    console.error('❌ Error merging module results:', error.message);
    throw error;
  }
}
}
  