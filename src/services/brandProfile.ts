import axios from "axios";
import db from "../config/db";
import { brandProfiles, brandKits } from "../model/schema";
import { eq } from "drizzle-orm";
import { envConfigs } from "../config/envConfig";
import { BrandKitTransformer } from "./brandKitTransformer";

// v2 API endpoint for brand intelligence
const API_BASE_URL = `${envConfigs.aiBackendUrl}/v2/brand-intelligence`;

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

 static createBrandProfileJob = async (input: CreateJobInput) => {
  try {
    // Determine URL - prioritize new url field, fallback to website, or error
    const url = input.url || input.website;
    if (!url) {
      throw new Error('URL is required for brand intelligence analysis');
    }

    // Prepare v2 API request payload with new modular config support
    const payload: any = {
      url: url,
    };

    // Support new modular analysis config
    if (input.depth || input.config) {
      payload.depth = input.depth || input.config?.depth || 'medium';
      
      if (input.config) {
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

    console.log('📡 Calling v2 API:', `${API_BASE_URL}/analyze`);
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
    // Request comprehensive format directly from backend
    const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}?format=comprehensive`);
    const { job_id, status, result } = response.data;

    // Prepare update data
    const updateData: any = {
      status: status,
      updated_at: new Date(),
      data: { ...response.data } // Store full response for backward compatibility
    };

    // If job is complete, extract and store structured data
    // Backend now returns comprehensive format when format=comprehensive
    if (status === 'complete' && result) {
      updateData.profileId = job_id; // Use job_id as profileId for v2
      // Store comprehensive format (preferred) or fallback to brand_kit
      updateData.brandKit = result.comprehensive || result.brand_kit || null;
      updateData.brandScores = result.brand_scores || null;
      updateData.brandRoadmap = result.brand_roadmap || null;
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
        //           result.brand_kit (v2_raw format for backward compatibility)
        //           result.brand_scores
        //           result.brand_roadmap
        
        const comprehensiveBrandKit = result.comprehensive;
        
        if (!comprehensiveBrandKit) {
          console.warn('⚠️ No comprehensive format in result - backend may not support format=comprehensive yet');
          // Fallback: If no comprehensive, try to transform using TypeScript transformer
          if (result.brand_kit) {
            console.log('⚠️ Falling back to TypeScript transformer');
            const domain = result.brand_kit.domain || 'unknown';
            const transformed = BrandKitTransformer.transformV2ToBrandKit(result, domain);
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
            return response.data;
          }
          throw new Error('No brand kit data available in result');
        }
        
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
};

// NEW: Re-analyze existing completed job - transform data and create/update brand kit
static reAnalyzeBrandKit = async (jobId: string) => {
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
};
}
  