import axios from "axios";
import { BrandProfile } from "../models";
import { envConfigs } from "../config/envConfig";

const API_BASE_URL = `${envConfigs.aiBackendUrl}/v1/brands`;

export class CampaignService {

  // ============================================
  // RECOMMENDATIONS CHAT
  // ============================================

  static async getRecommendationsChat(brandId: string) {
    const response = await axios.get(`${API_BASE_URL}/${brandId}/recommendations/chat`);
    return response.data;
  }

  static async postRecommendationsChat(brandId: string, message: string, focusRecommendationId?: string) {
    const payload: any = { message };
    if (focusRecommendationId) {
      payload.focus_recommendation_id = focusRecommendationId;
    }
    const response = await axios.post(`${API_BASE_URL}/${brandId}/recommendations/chat`, payload);
    return response.data;
  }

  static async deleteRecommendations(brandId: string) {
    const response = await axios.delete(`${API_BASE_URL}/${brandId}/recommendations`);
    return response.data;
  }

  // ============================================
  // CAMPAIGN CRUD
  // ============================================

  static async createCampaign(brandId: string, payload: any) {
    const response = await axios.post(`${API_BASE_URL}/${brandId}/campaigns`, payload);
    return response.data;
  }

  static async getCampaigns(brandId: string, options?: { status?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const url = `${API_BASE_URL}/${brandId}/campaigns${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axios.get(url);
    return response.data;
  }

  static async getCampaign(brandId: string, campaignId: string) {
    const response = await axios.get(`${API_BASE_URL}/${brandId}/campaigns/${campaignId}`);
    return response.data;
  }

  static async updateCampaignStatus(brandId: string, campaignId: string, status: string) {
    const response = await axios.put(
      `${API_BASE_URL}/${brandId}/campaigns/${campaignId}/status`,
      { status }
    );
    return response.data;
  }

  static async deleteCampaign(brandId: string, campaignId: string) {
    const response = await axios.delete(`${API_BASE_URL}/${brandId}/campaigns/${campaignId}`);
    return response.data;
  }

  // ============================================
  // BRAND RESOURCES
  // ============================================

  static async createResource(brandId: string, payload: any) {
    const response = await axios.post(`${API_BASE_URL}/${brandId}/resources`, payload);
    return response.data;
  }

  static async getResources(brandId: string, resourceType?: string) {
    const params = resourceType ? `?resource_type=${resourceType}` : '';
    const response = await axios.get(`${API_BASE_URL}/${brandId}/resources${params}`);
    return response.data;
  }

  static async getResource(brandId: string, resourceId: string) {
    const response = await axios.get(`${API_BASE_URL}/${brandId}/resources/${resourceId}`);
    return response.data;
  }

  static async getResourceByVariable(brandId: string, variableName: string) {
    const response = await axios.get(`${API_BASE_URL}/${brandId}/resources/by-variable/${variableName}`);
    return response.data;
  }

  static async getFilledVariables(brandId: string) {
    const response = await axios.get(`${API_BASE_URL}/${brandId}/resources/filled-variables`);
    return response.data;
  }

  static async updateResource(brandId: string, resourceId: string, payload: any) {
    const response = await axios.put(`${API_BASE_URL}/${brandId}/resources/${resourceId}`, payload);
    return response.data;
  }

  static async deleteResource(brandId: string, resourceId: string) {
    const response = await axios.delete(`${API_BASE_URL}/${brandId}/resources/${resourceId}`);
    return response.data;
  }
}
