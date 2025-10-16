import { Request, Response } from "express";
import { CampaignPlanService } from "../services/campaign";

export class CampaignPlanController {

  static async createChat(req: Request, res: Response) {
    try {
      const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
      const userId = user.userId;

      // The rest of the campaign plan payload
      const payload = req.body;
      console.log("payload........",payload)
      if (!payload) {
        return res.status(400).json({ message: "Campaign plan data is required" });
      }

      const campaignPlan = await CampaignPlanService.createChat(userId, payload);

      return res.status(201).json({
        message: "Structured data created successfully",
        campaignPlan,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
  static async createCampaignPlan(req: Request, res: Response) {
    try {
      const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
      const userId = user.userId;

      // The rest of the campaign plan payload
      const payload = req.body;
      console.log("payload........",payload.brand_profile_id)
      if (!payload) {
        return res.status(400).json({ message: "Campaign plan data is required" });
      }

      const campaignPlan = await CampaignPlanService.createCampaignPlan(userId, payload);

      return res.status(201).json({
        campaignPlan,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getCampaignPlan(req: Request, res: Response) {
    try {
      const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
      const userId = user.userId;
      const campaignPlanId = req.params.id;

      if (!campaignPlanId) {
        return res.status(400).json({ message: "Campaign plan ID is required" });
      }

      const campaignPlan = await CampaignPlanService.getCampaignPlan(campaignPlanId);

      return res.status(200).json({
        message: "Campaign plan found successfully",
        campaignPlan,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

 static async getAiRecommendations(req: Request, res: Response) {
  try {
    const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
      const userId = user.userId;
    const campaignPlanId = req.params.id;

    if (!campaignPlanId) {
      return res.status(400).json({ message: "Campaign plan ID is required" });
    }

    const recommendations = await CampaignPlanService.getAiRecommendations(campaignPlanId);

    return res.status(200).json({
      message: "AI recommendations fetched successfully",
      recommendations,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch AI recommendations",
    });
  }
}

  
 // controllers/CampaignPlanController.ts
static async finalizeCampaignPlan(req: Request, res: Response) {
  try {
    const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
      const userId = user.userId;
    const campaignPlanId = req.params.id;
    if (!campaignPlanId) {
      return res.status(400).json({ message: "Campaign plan ID is required" });
    }
    const { selected_platforms, selected_duration_weeks } = req.body;
    if (!Array.isArray(selected_platforms) || selected_platforms.length === 0) {
      return res.status(400).json({
        message: "At least one platform must be selected",
      });
    }

    if (
      typeof selected_duration_weeks !== "number" ||
      selected_duration_weeks <= 0
    ) {
      return res.status(400).json({
        message: "A valid duration (in weeks) must be provided",
      });
    }
    
    const finalizedPlan = await CampaignPlanService.finalizeCampaignPlan(
      campaignPlanId,
      { selected_platforms, selected_duration_weeks }
    );

    return res.status(200).json({
      message: "Campaign plan finalized successfully",
      finalizedPlan,
    });
  } catch (error: any) {
    console.error("Finalize Campaign Error:", error);

    return res.status(error.response?.status || 500).json({
      message:
        error.response?.data?.detail ||
        error.message ||
        "Failed to finalize campaign plan",
    });
  }
}
}
