import { Request, Response } from "express";
import BrandProfileService from "../services/brandProfile";

export default class BrandProfileController { 
  static createJob = async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId||2;
    const source_type = req.body.source_type;
    const website = req.body.url || null;
    const file = req.file?.buffer || null;
    console.log("userId and source_type required",userId,source_type,website);  
    if (!userId || !source_type) return res.status(400).json({ message: 'userId and source_type required' });

    const result = await BrandProfileService.createBrandProfileJob({ userId, source_type, website, file });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

static getJobStatus = async (req: Request, res: Response) => {
  try {
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
    const { profile_id } = req.params;
    if (!profile_id) return res.status(400).json({ message: 'profile_id required' });

    const result = await BrandProfileService.getBrandProfile(profile_id);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


}