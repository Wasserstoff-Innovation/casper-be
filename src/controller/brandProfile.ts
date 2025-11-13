import { Request, Response } from "express";
import BrandProfileService from "../services/brandProfile";

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
    
    const result = await BrandProfileService.createBrandProfileJob({ 
      userId, 
      url,
      depth,
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

    const result = await BrandProfileService.getBrandProfile(profile_id);
    res.status(200).json(result);
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

}