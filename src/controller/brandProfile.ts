import { Request, Response } from "express";
import BrandProfileService from "../services/brandProfile";
import { BrandIntelligenceService } from "../services/brandIntelligence";
import axios from "axios";
import { envConfigs } from "../config/envConfig";

export default class BrandProfileController { 
  static createJob = async (req: Request, res: Response) => {
  try {
    const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
    const userId = user.userId;
    
    // v2 API parameters
    const url = req.body.url || req.body.website; // Support both 'url' and 'website' for backward compatibility
    const include_screenshots = req.body.include_screenshots !== undefined ? req.body.include_screenshots : true;
    const include_web_search = req.body.include_web_search !== undefined ? req.body.include_web_search : true;
    const max_pages = req.body.max_pages || 20;
    
    // Legacy parameters (for backward compatibility)
    const source_type = req.body.source_type;
    const file = req.file?.buffer || null;
    
    console.log("Creating brand profile job", { userId, url, include_screenshots, include_web_search, max_pages });  
    
    if (!userId) {
      return res.status(400).json({ message: 'userId required' });
    }
    
    if (!url) {
      return res.status(400).json({ message: 'url is required for brand intelligence analysis' });
    }

    // Support new modular analysis config
    const depth = req.body.depth;
    const config = req.body.config;
    const override_persona = req.body.override_persona; // NEW: Wisdom Tree persona override
    
    const result = await BrandProfileService.createBrandProfileJob({ 
      userId, 
      url,
      depth,
      override_persona, // NEW
      config,
      // Legacy support
      include_screenshots,
      include_web_search,
      max_pages,
      source_type,
      website: url,
      file
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

static getJobStatus = async (req: Request, res: Response) => {
  try {
    const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
    const { job_id } = req.params;
    console.log("job_id",job_id);
    if (!job_id) return res.status(400).json({ message: 'job_id required' });

    const result = await BrandProfileService.getBrandProfileJobStatus(job_id);
    console.log("result...",result);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

 static getProfile = async (req: Request, res: Response) => {
  try {
    const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
    const { profile_id } = req.params;
    if (!profile_id) return res.status(400).json({ message: 'profile_id required' });

    // Use optimized summary view
    // This reduces payload from 400KB to 10-50KB
    console.log("Using optimized summary view for profile:", profile_id);
    const summaryView = await BrandIntelligenceService.getSummaryView(profile_id);
    return res.status(200).json(summaryView);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// NEW: Re-analyze existing job - transform and create/update brand kit
static reAnalyzeBrandKit = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { job_id } = req.body;
    if (!job_id) {
      return res.status(400).json({ error: "job_id is required" });
    }

    console.log("Re-analyzing brand kit for job:", job_id);
    
    const result = await BrandProfileService.reAnalyzeBrandKit(job_id);
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error re-analyzing brand kit:", err);
    res.status(500).json({ error: err.message });
  }
};

// NEW: List available personas
static listPersonas = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const response = await axios.get(
      `${envConfigs.aiBackendUrl}/v2/brand-intelligence/wisdom-tree/personas`
    );

    res.status(200).json(response.data);
  } catch (err: any) {
    console.error("Error listing personas:", err);
    res.status(500).json({ error: err.message });
  }
};

// NEW: Get brand intelligence summary view (lightweight for drawer)
static getSummaryView = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profileId = req.params.id;
    if (!profileId) {
      return res.status(400).json({ error: "Invalid profile ID" });
    }

    console.log("Getting brand intelligence summary for profile:", profileId);

    const summaryView = await BrandIntelligenceService.getSummaryView(profileId);
    res.status(200).json(summaryView);
  } catch (err: any) {
    console.error("Error getting summary view:", err);
    res.status(500).json({ error: err.message });
  }
};

// NEW: Get brand intelligence detail view (full data)
static getDetailView = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profileId = req.params.id;
    if (!profileId) {
      return res.status(400).json({ error: "Invalid profile ID" });
    }

    console.log("Getting brand intelligence detail for profile:", profileId);

    const detailView = await BrandIntelligenceService.getDetailView(profileId);
    res.status(200).json(detailView);
  } catch (err: any) {
    console.error("Error getting detail view:", err);
    res.status(500).json({ error: err.message });
  }
};

// NEW: List all brand profiles for a user with filtering
static listProfiles = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = user.userId;
    const filters = {
      persona: req.query.persona as string | undefined,
      minScore: req.query.min_score ? parseInt(req.query.min_score as string, 10) : undefined,
      entityType: req.query.entity_type as string | undefined,
      status: req.query.status as string | undefined,
    };
    const sort = req.query.sort as string | undefined || 'created_at';
    const order = req.query.order as 'asc' | 'desc' | undefined || 'desc';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    console.log("Listing profiles for user:", userId, "with filters:", filters);

    const result = await BrandIntelligenceService.listProfiles(userId, filters, sort, order, limit, offset);
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error listing profiles:", err);
    res.status(500).json({ error: err.message });
  }
};

// NEW: Update roadmap task status
static updateTask = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { task_id } = req.params;
    const { status, acceptanceCriteria } = req.body;

    if (!task_id) {
      return res.status(400).json({ error: "task_id is required" });
    }

    console.log("Updating task:", task_id, "with status:", status);

    const result = await BrandIntelligenceService.updateTask(task_id, { status, acceptanceCriteria });
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: err.message });
  }
};

// NEW: Bulk update tasks
static bulkUpdateTasks = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { taskIds, updates } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: "taskIds array is required" });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: "updates object is required" });
    }

    console.log("Bulk updating", taskIds.length, "tasks");

    const result = await BrandIntelligenceService.bulkUpdateTasks(taskIds, updates);
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error bulk updating tasks:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get job history for the user
static getJobHistory = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = user.userId;

    console.log("Fetching job history for user:", userId);
    const jobs = await BrandProfileService.getJobHistory(userId);

    res.status(200).json({ jobs });
  } catch (err: any) {
    console.error("Error fetching job history:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get detailed job information by job_id
static getJobDetailsById = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = user.userId;
    const { job_id } = req.params;

    if (!job_id) {
      return res.status(400).json({ error: "job_id is required" });
    }

    console.log("Fetching job details for job_id:", job_id);
    const jobDetails = await BrandProfileService.getJobDetails(job_id, userId);

    if (!jobDetails) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.status(200).json({ job: jobDetails });
  } catch (err: any) {
    console.error("Error fetching job details:", err);
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// Re-analyze specific module for a brand profile
static analyzeModule = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = user.userId;
    const { id } = req.params;
    const { module, include_screenshots, include_web_search } = req.body;

    if (!id) {
      return res.status(400).json({ error: "profile id is required" });
    }

    if (!module) {
      return res.status(400).json({ error: "module is required" });
    }

    const profileId = id;
    if (!profileId) {
      return res.status(400).json({ error: "Invalid profile id" });
    }

    console.log(`Re-analyzing module "${module}" for profile ${profileId}`);

    const result = await BrandProfileService.analyzeModule(profileId, userId, module, {
      include_screenshots,
      include_web_search,
    });

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error analyzing module:", err);
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// Quick-action module analysis endpoints
static analyzeVisualIdentity = async (req: Request, res: Response) => {
  req.body.module = 'visual_identity';
  return BrandProfileController.analyzeModule(req, res);
};

static analyzeSEO = async (req: Request, res: Response) => {
  req.body.module = 'seo_identity';
  return BrandProfileController.analyzeModule(req, res);
};

static analyzeTrustElements = async (req: Request, res: Response) => {
  req.body.module = 'proof_trust';
  return BrandProfileController.analyzeModule(req, res);
};

static analyzeAudience = async (req: Request, res: Response) => {
  req.body.module = 'audience_positioning';
  return BrandProfileController.analyzeModule(req, res);
};

static analyzeMessaging = async (req: Request, res: Response) => {
  req.body.module = 'verbal_identity';
  return BrandProfileController.analyzeModule(req, res);
};

static analyzeContent = async (req: Request, res: Response) => {
  req.body.module = 'content_assets';
  return BrandProfileController.analyzeModule(req, res);
};

static analyzePricing = async (req: Request, res: Response) => {
  req.body.module = 'product_offers';
  return BrandProfileController.analyzeModule(req, res);
};

static analyzeSocial = async (req: Request, res: Response) => {
  req.body.module = 'external_presence';
  return BrandProfileController.analyzeModule(req, res);
};

// NEW: Update brand profile fields
static updateProfile = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profileId = req.params.id;
    const userId = user.userId;
    const updates = req.body;

    console.log(`Updating profile ${profileId} with:`, Object.keys(updates));

    const result = await BrandProfileService.updateProfile(profileId, userId, updates);
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error updating profile:", err);
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// NEW: Update brand kit fields
static updateBrandKit = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profileId = req.params.id;
    const userId = user.userId;
    const updates = req.body;

    console.log(`Updating brand kit for profile ${profileId} with:`, Object.keys(updates));

    const result = await BrandProfileService.updateBrandKit(profileId, userId, updates);
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error updating brand kit:", err);
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// NEW: Update social profile for a platform
static updateSocialProfile = async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profileId = req.params.id;
    const platform = req.params.platform;
    const userId = user.userId;
    const updates = req.body; // { handle, url, status }

    console.log(`Updating social profile ${platform} for profile ${profileId}`);

    const result = await BrandProfileService.updateSocialProfile(profileId, userId, platform, updates);
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error updating social profile:", err);
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

}