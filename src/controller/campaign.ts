import { Request, Response } from "express";
import { CampaignPlanService } from "../services/campaign";

export class CampaignPlanController {

  /**
   * GET /api/v1/brands/:brand_id/recommendations/chat
   * Get existing recommendations or generate new ones
   */
  static async getRecommendationsChat(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const brand_id = req.params.brand_id;
      if (!brand_id) {
        return res.status(400).json({ message: "brand_id is required" });
      }

      const result = await CampaignPlanService.getRecommendationsChat(brand_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Recommendations Chat Error:", error);
      if (error.message === "Brand profile not found") {
        return res.status(404).json({ message: "Brand profile not found" });
      }
      return res.status(500).json({
        message: error.message || "Failed to get recommendations",
      });
    }
  }

  /**
   * POST /api/v1/brands/:brand_id/recommendations/chat
   * Send a message to refine recommendations
   * Body: { message: string, focus_recommendation_id?: string }
   */
  static async postRecommendationsChat(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const brand_id = req.params.brand_id;
      if (!brand_id) {
        return res.status(400).json({ message: "brand_id is required" });
      }

      const { message, focus_recommendation_id } = req.body;
      if (!message) {
        return res.status(400).json({ message: "message is required" });
      }

      const result = await CampaignPlanService.postRecommendationsChat(
        brand_id,
        message,
        focus_recommendation_id
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Post Recommendations Chat Error:", error);
      if (error.message === "Brand profile not found") {
        return res.status(404).json({ message: "Brand profile not found" });
      }
      return res.status(500).json({
        message: error.message || "Failed to refine recommendations",
      });
    }
  }

  /**
   * DELETE /api/v1/brands/:brand_id/recommendations
   * Reset recommendations to start fresh
   */
  static async deleteRecommendations(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const brand_id = req.params.brand_id;
      if (!brand_id) {
        return res.status(400).json({ message: "brand_id is required" });
      }

      const result = await CampaignPlanService.deleteRecommendations(brand_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Delete Recommendations Error:", error);
      return res.status(500).json({
        message: error.message || "Failed to delete recommendations",
      });
    }
  }
}
