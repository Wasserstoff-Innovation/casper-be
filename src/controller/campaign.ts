import { Request, Response } from "express";
import { CampaignService } from "../services/campaign";

export class CampaignController {

  // ============================================
  // RECOMMENDATIONS CHAT
  // ============================================

  static async getRecommendationsChat(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id } = req.params;
      const result = await CampaignService.getRecommendationsChat(brand_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Recommendations Chat Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async postRecommendationsChat(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id } = req.params;
      const { message, focus_recommendation_id } = req.body;
      if (!message) {
        return res.status(400).json({ message: "message is required" });
      }
      const result = await CampaignService.postRecommendationsChat(brand_id, message, focus_recommendation_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Post Recommendations Chat Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async deleteRecommendations(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id } = req.params;
      const result = await CampaignService.deleteRecommendations(brand_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Delete Recommendations Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  // ============================================
  // CAMPAIGN CRUD
  // ============================================

  static async createCampaign(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id } = req.params;
      const result = await CampaignService.createCampaign(brand_id, req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      console.error("Create Campaign Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async getCampaigns(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id } = req.params;
      const { status, limit, offset } = req.query;
      const result = await CampaignService.getCampaigns(brand_id, {
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Campaigns Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async getCampaign(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id, campaign_id } = req.params;
      const result = await CampaignService.getCampaign(brand_id, campaign_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Campaign Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async updateCampaignStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id, campaign_id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "status is required" });
      }
      const result = await CampaignService.updateCampaignStatus(brand_id, campaign_id, status);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Update Campaign Status Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async deleteCampaign(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id, campaign_id } = req.params;
      const result = await CampaignService.deleteCampaign(brand_id, campaign_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Delete Campaign Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  // ============================================
  // BRAND RESOURCES
  // ============================================

  static async createResource(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id } = req.params;
      const result = await CampaignService.createResource(brand_id, req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      console.error("Create Resource Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async getResources(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id } = req.params;
      const { resource_type } = req.query;
      const result = await CampaignService.getResources(brand_id, resource_type as string);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Resources Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async getResource(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id, resource_id } = req.params;
      const result = await CampaignService.getResource(brand_id, resource_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Resource Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async getResourceByVariable(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id, variable_name } = req.params;
      const result = await CampaignService.getResourceByVariable(brand_id, variable_name);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Resource By Variable Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async getFilledVariables(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id } = req.params;
      const result = await CampaignService.getFilledVariables(brand_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Filled Variables Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async updateResource(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id, resource_id } = req.params;
      const result = await CampaignService.updateResource(brand_id, resource_id, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Update Resource Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  static async deleteResource(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { brand_id, resource_id } = req.params;
      const result = await CampaignService.deleteResource(brand_id, resource_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Delete Resource Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
}
