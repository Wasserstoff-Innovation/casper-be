import axios from "axios";
import { campaignPlans, contentCalander } from "../model/schema";
import db from "../config/db";
import { eq, sql } from "drizzle-orm";
import { envConfigs } from "../config/envConfig";




export default class CalendarService {

  static createCalendar = async (payload: any) => {
    try {
      const checkStatus = await db.select().from(campaignPlans).where(eq(campaignPlans.campaignId, payload.campaignId));
      const plan_status = checkStatus[0]?.data?.plan_status;
      if (plan_status === "finalized") {
        const response = await axios.post(`${envConfigs.aiBackendUrl}/campaigns/${payload.campaignId}/generate-calendar`, payload);
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
      const response = await axios.get(`${envConfigs.aiBackendUrl}/calendars/jobs/${job_id}`);
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