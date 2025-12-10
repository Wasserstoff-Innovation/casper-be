import { Request, Response } from "express";
import CalendarService from "../services/calendar";

export default class CalendarController {

  // ============================================
  // CAMPAIGN CALENDAR GENERATION
  // ============================================

  static async generateCampaignCalendar(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id, campaign_id } = req.params;
      const { append } = req.query; // Optional: append to existing or replace
      const result = await CalendarService.generateCampaignCalendar(
        brand_id,
        campaign_id,
        req.body,
        append === 'true'
      );
      return res.status(202).json(result);
    } catch (error: any) {
      console.error("Generate Campaign Calendar Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async getCampaignCalendarStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id, campaign_id } = req.params;
      const result = await CalendarService.getCampaignCalendarStatus(brand_id, campaign_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Campaign Calendar Status Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  // ============================================
  // CAMPAIGN POSTS
  // ============================================

  static async getCampaignPosts(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id, campaign_id } = req.params;
      const { status, platform, start_date, end_date, limit, offset } = req.query;
      const result = await CalendarService.getCampaignPosts(brand_id, campaign_id, {
        status: status as string,
        platform: platform as string,
        start_date: start_date as string,
        end_date: end_date as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Campaign Posts Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async getCampaignPostStats(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id, campaign_id } = req.params;
      const result = await CalendarService.getCampaignPostStats(brand_id, campaign_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Campaign Post Stats Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  // ============================================
  // BRAND CALENDAR (aggregated)
  // ============================================

  static async getBrandCalendar(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id } = req.params;
      const { start_date, end_date, campaign_id, platform, status } = req.query;
      const result = await CalendarService.getBrandCalendar(brand_id, {
        start_date: start_date as string,
        end_date: end_date as string,
        campaign_id: campaign_id as string,
        platform: platform as string,
        status: status as string,
      });
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Brand Calendar Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  // ============================================
  // INDIVIDUAL POST OPERATIONS
  // ============================================

  static async getPost(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { post_id } = req.params;
      const result = await CalendarService.getPost(post_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Post Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async updatePost(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { post_id } = req.params;
      const result = await CalendarService.updatePost(post_id, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Update Post Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async updatePostStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { post_id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "status is required" });
      }
      const result = await CalendarService.updatePostStatus(post_id, status);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Update Post Status Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async deletePost(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { post_id } = req.params;
      const result = await CalendarService.deletePost(post_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Delete Post Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async bulkUpdatePostStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { post_ids, status } = req.body;
      if (!post_ids || !Array.isArray(post_ids)) {
        return res.status(400).json({ message: "post_ids array is required" });
      }
      if (!status) {
        return res.status(400).json({ message: "status is required" });
      }
      const result = await CalendarService.bulkUpdatePostStatus(post_ids, status);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Bulk Update Post Status Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  // ============================================
  // JOB POLLING (kept from before)
  // ============================================

  static async getCalendarJob(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { job_id } = req.params;
      const result = await CalendarService.getCalendarJob(job_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Calendar Job Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
}
