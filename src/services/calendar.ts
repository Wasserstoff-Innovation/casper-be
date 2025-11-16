import axios from "axios";
import { campaignPlans, contentCalander, brandProfiles } from "../model/schema";
import db from "../config/db";
import { eq, sql } from "drizzle-orm";
import { envConfigs } from "../config/envConfig";




export default class CalendarService {

  static createCalendar = async (payload: any) => {
    try {
      const checkStatus = await db.select().from(campaignPlans).where(eq(campaignPlans.campaignId, payload.campaignId));
      const plan_status = checkStatus[0]?.data?.plan_status;
      if (plan_status === "finalized") {
        // NEW: Enhance payload with brand analysis if brand_profile_id is available
        const brandProfileId = payload.brand_profile_id;
        if (brandProfileId) {
          try {
            // Get campaign plan to find brand profile
            const campaignPlan = await db.select()
              .from(campaignPlans)
              .where(eq(campaignPlans.campaignId, payload.campaignId))
              .limit(1);
            
            if (campaignPlan.length > 0 && campaignPlan[0].brandProfileId) {
              // Get brand profile with analysis context
              const brandProfile = await db.select()
                .from(brandProfiles)
                .where(eq(brandProfiles.id, campaignPlan[0].brandProfileId))
                .limit(1);
              
              if (brandProfile.length > 0) {
                const analysisContext = brandProfile[0].analysis_context as any;
                const brandKit = brandProfile[0].brandKit as any;
                
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
          const checkCampaignPlan = await db.select().from(campaignPlans).where(eq(campaignPlans.campaignId, payload.campaignId));
          if (checkCampaignPlan.length > 0) {
            const [newCalendar] = await db.insert(contentCalander).values({
              userId: checkCampaignPlan[0].userId,
              campaignPlanId: checkCampaignPlan[0].id,
              data: response.data,
            }).returning();
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
        await db
          .update(contentCalander)
          .set({ data: response.data })
          .where(sql`${contentCalander.data} ->> 'job_id' = ${job_id}`);
      }
      return response.data;
    } catch (error: any) {
      console.error("Error getting campaign plan:", error.response?.data || error.message);
    }
  }
}   