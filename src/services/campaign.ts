import axios from "axios";
import { BrandProfile } from "../models";
import { envConfigs } from "../config/envConfig";

const API_BASE_URL = `${envConfigs.aiBackendUrl}/v1/brands`;

export class CampaignPlanService {

  /**
   * Verify brand profile exists locally
   */
  private static async verifyBrandProfile(brandId: string) {
    let brandProfile = await BrandProfile.findOne({ profileId: brandId }).lean();
    if (!brandProfile) {
      brandProfile = await BrandProfile.findById(brandId).lean();
    }
    if (!brandProfile) {
      throw new Error("Brand profile not found");
    }
    return brandProfile;
  }

  /**
   * GET /api/v1/brands/:brand_id/recommendations/chat
   * Get existing recommendations or generate new ones
   */
  static async getRecommendationsChat(brandId: string) {
    try {
      await this.verifyBrandProfile(brandId);

      const response = await axios.get(
        `${API_BASE_URL}/${brandId}/recommendations/chat`
      );

      return response.data;
    } catch (error: any) {
      console.error("Error getting recommendations chat:", error.response?.data || error.message);
      if (error.message === "Brand profile not found") {
        throw error;
      }
      throw new Error(
        error.response?.data?.detail || error.message || "Failed to get recommendations"
      );
    }
  }

  /**
   * POST /api/v1/brands/:brand_id/recommendations/chat
   * Send a message to refine recommendations
   */
  static async postRecommendationsChat(
    brandId: string,
    message: string,
    focusRecommendationId?: string
  ) {
    try {
      await this.verifyBrandProfile(brandId);

      const payload: any = { message };
      if (focusRecommendationId) {
        payload.focus_recommendation_id = focusRecommendationId;
      }

      const response = await axios.post(
        `${API_BASE_URL}/${brandId}/recommendations/chat`,
        payload
      );

      return response.data;
    } catch (error: any) {
      console.error("Error posting recommendations chat:", error.response?.data || error.message);
      if (error.message === "Brand profile not found") {
        throw error;
      }
      throw new Error(
        error.response?.data?.detail || error.message || "Failed to refine recommendations"
      );
    }
  }

  /**
   * DELETE /api/v1/brands/:brand_id/recommendations
   * Reset recommendations to start fresh
   */
  static async deleteRecommendations(brandId: string) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/${brandId}/recommendations`
      );

      return response.data;
    } catch (error: any) {
      console.error("Error deleting recommendations:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.detail || error.message || "Failed to delete recommendations"
      );
    }
  }
}
