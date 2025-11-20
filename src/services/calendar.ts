import axios from "axios";
import { CampaignPlan, ContentCalendar, BrandProfile } from "../models";
import { Types } from "mongoose";
import { envConfigs } from "../config/envConfig";




export default class CalendarService {

  static createCalendar = async (payload: any) => {
    try {
      const checkStatus = await CampaignPlan.findOne({ campaignId: payload.campaignId }).lean();
      const plan_status = checkStatus?.data?.plan_status;
      if (plan_status === "finalized") {
        // NEW: Enhance payload with brand analysis if brand_profile_id is available
        const brandProfileId = payload.brand_profile_id;
        if (brandProfileId) {
          try {
            // Get campaign plan to find brand profile
            const campaignPlan = await CampaignPlan.findOne({
              campaignId: payload.campaignId
            }).lean();

            if (campaignPlan && campaignPlan.brandProfileId) {
              // Get brand profile with analysis context
              const brandProfile = await BrandProfile.findById(
                campaignPlan.brandProfileId
              ).lean();

              if (brandProfile) {
                const analysisContext = brandProfile.analysis_context as any;
                const brandKit = brandProfile.brandKit as any;
                
                if (analysisContext) {
                  // Enhance payload with brand insights for persona-aware content generation
                  payload.brand_insights = {
                    entity_type: analysisContext.entity_type,
                    business_model: analysisContext.business_model,
                    persona_id: analysisContext.persona_id,
                    persona_label: analysisContext.persona_label,
                    channel_orientation: analysisContext.channel_orientation,
                  };
                  
                  // Add brand kit data if available
                  if (brandKit) {
                    const comprehensive = brandKit.comprehensive || brandKit;
                    payload.brand_insights.target_audience = comprehensive?.audience_positioning?.primary_icp?.value;
                    payload.brand_insights.tone_of_voice = comprehensive?.verbal_identity?.tone_of_voice?.guidance?.value;
                    payload.brand_insights.key_messages = comprehensive?.verbal_identity?.core_value_props?.items || [];
                  }
                }
              }
            }
          } catch (error: any) {
            console.warn('⚠️ Failed to fetch brand analysis for calendar:', error.message);
            // Continue without brand analysis - calendar generation will work without it
          }
        }
        
        const response = await axios.post(`${envConfigs.aiBackendUrl}/v1/campaigns/${payload.campaignId}/generate-calendar`, payload);
        if (response.status === 202) {
          const checkCampaignPlan = await CampaignPlan.findOne({ campaignId: payload.campaignId }).lean();
          if (checkCampaignPlan) {
            const newCalendar = await ContentCalendar.create({
              userId: checkCampaignPlan.userId,
              campaignPlanId: checkCampaignPlan._id,
              data: response.data,
            });
            return { campaignId: payload.campaignId, contentCalendar: response.data };
          }
        } else {
          return { message: "Failed to create content calendar" };
        }
      }
      else {
        throw new Error("campaign plan not finalized yet");
      }
    } catch (error: any) {
      console.error("Error creating campaign plan:", error || error.message);
      throw new Error(error.response?.data?.detail[0].msg || error.message || "Unknown error");
    }
  }

  static getCalendar = async (job_id: string) => {
    try {
      const response = await axios.get(`${envConfigs.aiBackendUrl}/v1/calendars/jobs/${job_id}`);
      if (response.data.status === "complete") {
        await ContentCalendar.findOneAndUpdate(
          { 'data.job_id': job_id },
          { data: response.data },
          { new: true }
        );
      }
      return response.data;
    } catch (error: any) {
      console.error("Error getting campaign plan:", error.response?.data || error.message);
    }
  }
}   