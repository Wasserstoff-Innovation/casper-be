import axios from "axios";
import { BrandProfile, BrandKit, BrandRoadmapCampaign, BrandRoadmapTask, BrandSocialProfile } from "../models";
import { Types } from "mongoose";
import { envConfigs } from "../config/envConfig";
import { BrandKitTransformer } from "./brandKitTransformer";
import { BrandDataExtractor } from "./brandDataExtractor";
import { toObjectId } from '../utils/mongoHelpers';

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
      userId: input.userId, // Send userId to Python (matches Python's camelCase field name)
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

    // Python backend will create the BrandProfile record with userId
    // Just return the job info
    return {
      jobId: job_id,
      status: status || 'queued',
      message: message
    };
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
// NOTE: Check brand_intelligence_jobs first for status, then brand_profiles for complete data
static async getBrandProfileJobStatus(jobId: string) {
  try {
    // Call Python backend for real-time job status (from brand_intelligence_jobs)
    const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`);
    const jobStatus = response.data;

    // If job is complete, fetch full aggregated data from brand_profiles
    if (jobStatus.status === 'complete') {
      try {
        const profile = await BrandProfile.findOne({ jobId: jobId }).lean();

        if (profile) {
          // Job complete + profile exists = return full data
          return {
            job_id: jobId,
            status: 'complete',
            progress: jobStatus.progress || null,
            result: {
              profile_id: profile.profileId,
              brand_kit: profile.brandKit,
              brand_scores: profile.brandScores,
              brand_roadmap: profile.brandRoadmap,
              analysis_context: profile.analysis_context,
            },
            error: null
          };
        }
      } catch (dbError) {
        console.warn('Job complete but profile not found in DB yet:', dbError);
        // Fall through to return job status without results
      }
    }

    // Job is queued/running, or profile not ready yet - return status only
    return jobStatus;
  } catch (error: any) {
    console.error('Error fetching Job Status from Python backend:', error.response?.data || error.message);
    throw error;
  }
}

// Get Brand Profile
// NOTE: Python backend writes directly to MongoDB, so we just read from DB
static async getBrandProfile(profileId: string) {
  try {
    // Python backend has already written to MongoDB
    // Just query the database directly
    const profile = await BrandProfile.findOne({ profileId: profileId }).lean();

    if (!profile) {
      throw new Error(`Brand profile not found for profileId: ${profileId}`);
    }

    // Return the profile data (which Python already populated)
    return {
      job_id: profile.jobId,
      profile_id: profile.profileId,
      status: profile.status,
      result: profile.status === 'complete' ? {
        brand_kit: profile.brandKit,
        brand_scores: profile.brandScores,
        brand_roadmap: profile.brandRoadmap,
        analysis_context: profile.analysis_context
      } : null,
      error: profile.jobError || null,
      // Include full data for backward compatibility
      data: profile.data
    };
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
    const brandProfile = await BrandProfile.findOne({ jobId: jobId });

    if (!brandProfile) {
      throw new Error('Brand profile not found for job: ' + jobId);
    }

    // Check if we have completed data in DB (Python should have already written it)
    if (brandProfile.status !== 'complete') {
      throw new Error(`Cannot re-analyze: Job is not complete. Status: ${brandProfile.status}. Wait for Python to complete processing.`);
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

    const savedKit = await BrandKit.findOneAndUpdate(
      { brandProfileId: brandProfile._id },
      {
        userId: brandProfile.userId,
        brandProfileId: brandProfile._id,
        kitData: kitData,
        updated_at: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log('✅ Brand kit re-analyzed and saved. Kit ID:', savedKit._id);

    return {
      success: true,
      message: 'Brand kit re-analyzed successfully',
      brandKit: savedKit,
    };
  } catch (error: any) {
    console.error('❌ Error re-analyzing brand kit:', error.message);
    throw error;
  }
}

// Get job history for a user
static async getJobHistory(userId: number) {
  try {
    const jobs = await BrandProfile.find({ userId: toObjectId(userId) })
      .select('_id jobId canonical_domain brand_name status jobStartedAt jobCompletedAt jobError persona_id entity_type created_at')
      .sort({ created_at: -1 }) // Newest first
      .lean();

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
        url: job.canonical_domain,
        brandName: job.brand_name,
        status: job.status,
        brandProfileId: job._id.toString(),
        startedAt: job.jobStartedAt,
        completedAt: job.jobCompletedAt,
        error: job.jobError,
        createdAt: job.created_at,
        // Enhanced metadata
        personaId: job.persona_id,
        entityType: job.entity_type,
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
    const job = await BrandProfile.findOne({ jobId: jobId }).lean();

    if (!job) {
      return null;
    }

    // Check if job belongs to user
    if (job.userId?.toString() !== toObjectId(userId).toString()) {
      throw new Error('Unauthorized: Job does not belong to this user');
    }

    return {
      id: job.jobId,
      url: job.canonical_domain,
      brandName: job.brand_name,
      status: job.status,
      brandProfileId: job._id.toString(),
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
  profileId: string,
  userId: number,
  module: string,
  _options?: {
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

    // Get existing profile by _id
    const profile = await BrandProfile.findById(profileId);

    if (!profile) {
      throw new Error('Brand profile not found');
    }

    // Check ownership
    if (profile.userId?.toString() !== toObjectId(userId).toString()) {
      throw new Error('Unauthorized: Profile does not belong to this user');
    }

    if (!profile.domain && !profile.canonical_domain) {
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
    const profile = await BrandProfile.findOne({ profileId: profileId.toString() });

    if (!profile) {
      throw new Error('Brand profile not found');
    }

    const existingBrandKit = profile.brandKit as any || {};

    // Merge module data into existing brand kit
    const updatedBrandKit = {
      ...existingBrandKit,
      [module]: moduleData,
    };

    // Update database
    await BrandProfile.findByIdAndUpdate(
      profileId,
      {
        brandKit: updatedBrandKit,
        updated_at: new Date(),
      },
      { new: true }
    );

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
  