import axios from "axios";
import { envConfigs } from "../config/envConfig";

const API_BASE_URL = `${envConfigs.aiBackendUrl}/v1`;

interface PostFilters {
  status?: string;
  platform?: string;
  start_date?: string;
  end_date?: string;
  campaign_id?: string;
  limit?: number;
  offset?: number;
}

export default class CalendarService {

  // ============================================
  // CAMPAIGN CALENDAR GENERATION
  // ============================================

  static async generateCampaignCalendar(brandId: string, campaignId: string, payload: any, append: boolean = false) {
    const url = `${API_BASE_URL}/brands/${brandId}/campaigns/${campaignId}/generate-calendar${append ? '?append=true' : ''}`;
    const response = await axios.post(url, payload);
    return response.data;
  }

  static async getCampaignCalendarStatus(brandId: string, campaignId: string) {
    const response = await axios.get(
      `${API_BASE_URL}/brands/${brandId}/campaigns/${campaignId}/calendar-status`
    );
    return response.data;
  }

  // ============================================
  // CAMPAIGN POSTS
  // ============================================

  static async getCampaignPosts(brandId: string, campaignId: string, filters?: PostFilters) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.platform) params.append('platform', filters.platform);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const url = `${API_BASE_URL}/brands/${brandId}/campaigns/${campaignId}/posts${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axios.get(url);
    return response.data;
  }

  static async getCampaignPostStats(brandId: string, campaignId: string) {
    const response = await axios.get(
      `${API_BASE_URL}/brands/${brandId}/campaigns/${campaignId}/posts/stats`
    );
    return response.data;
  }

  // ============================================
  // BRAND CALENDAR (aggregated)
  // ============================================

  static async getBrandCalendar(brandId: string, filters?: PostFilters) {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id);
    if (filters?.platform) params.append('platform', filters.platform);
    if (filters?.status) params.append('status', filters.status);

    const url = `${API_BASE_URL}/brands/${brandId}/calendar${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axios.get(url);
    return response.data;
  }

  // ============================================
  // INDIVIDUAL POST OPERATIONS
  // ============================================

  static async getPost(postId: string) {
    const response = await axios.get(`${API_BASE_URL}/posts/${postId}`);
    return response.data;
  }

  static async updatePost(postId: string, payload: any) {
    const response = await axios.put(`${API_BASE_URL}/posts/${postId}`, payload);
    return response.data;
  }

  static async updatePostStatus(postId: string, status: string) {
    const response = await axios.put(`${API_BASE_URL}/posts/${postId}/status`, { status });
    return response.data;
  }

  static async deletePost(postId: string) {
    const response = await axios.delete(`${API_BASE_URL}/posts/${postId}`);
    return response.data;
  }

  static async bulkUpdatePostStatus(postIds: string[], status: string) {
    const response = await axios.post(`${API_BASE_URL}/posts/bulk-status-update`, {
      post_ids: postIds,
      status,
    });
    return response.data;
  }

  // ============================================
  // JOB POLLING
  // ============================================

  static async getCalendarJob(jobId: string) {
    const response = await axios.get(`${API_BASE_URL}/calendars/jobs/${jobId}`);
    return response.data;
  }
}
