import axios from "axios";
import { CampaignPlan, ContentCalendar, BrandProfile } from "../models";
import { envConfigs } from "../config/envConfig";
import { toObjectId } from "../utils/mongoHelpers";

const API_BASE_URL = `${envConfigs.aiBackendUrl}/v1`;

interface GenerateCalendarPayload {
  selected_platforms: string[];
  selected_duration_weeks: number;
  posting_frequency_per_week: number;
  start_date: string;
  campaign_purpose?: string;
  content_ideas?: string[];
}

export default class CalendarService {

  /**
   * Step 2: Generate calendar (creates plan + generates calendar in one call)
   * POST /api/v1/brands/:brand_id/generate-calendar
   */
  static generateBrandCalendar = async (
    userId: string,
    brandId: string,
    payload: GenerateCalendarPayload
  ) => {
    try {
      // Verify brand profile exists locally
      let brandProfile = await BrandProfile.findOne({ profileId: brandId }).lean();
      if (!brandProfile) {
        brandProfile = await BrandProfile.findById(brandId).lean();
      }
      if (!brandProfile) {
        throw new Error("Brand profile not found");
      }

      // Call AI backend
      const response = await axios.post(
        `${API_BASE_URL}/brands/${brandId}/generate-calendar`,
        payload
      );

      if (response.status === 202) {
        const { job_id, plan_id } = response.data;

        // Save campaign plan locally
        await CampaignPlan.create({
          userId: toObjectId(userId),
          brandProfileId: brandProfile._id,
          campaignId: plan_id,
          data: {
            ...payload,
            plan_status: "finalized",
          },
        });

        // Save content calendar record
        await ContentCalendar.create({
          userId: toObjectId(userId),
          campaignPlanId: plan_id,
          data: { job_id, status: "queued" },
        });

        return {
          job_id,
          plan_id,
          status: response.data.status || "queued",
        };
      } else {
        throw new Error("Failed to generate calendar");
      }
    } catch (error: any) {
      console.error("Error generating brand calendar:", error.response?.data || error.message);
      if (error.message === "Brand profile not found") {
        throw error;
      }
      throw new Error(
        error.response?.data?.detail || error.message || "Failed to generate calendar"
      );
    }
  };

  /**
   * Step 3: Get calendar job status and result
   * GET /api/v1/calendars/jobs/:job_id
   */
  static getCalendarJob = async (job_id: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/calendars/jobs/${job_id}`);

      // Update ContentCalendar record when job is complete
      if (response.data.status === "complete") {
        await ContentCalendar.findOneAndUpdate(
          { "data.job_id": job_id },
          { data: response.data },
          { new: true }
        );
      }

      return {
        job_id: response.data.job_id || job_id,
        status: response.data.status,
        result: response.data.result || null,
      };
    } catch (error: any) {
      console.error("Error getting calendar job:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.detail || error.message || "Failed to get calendar job status"
      );
    }
  };
}
