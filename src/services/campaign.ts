import axios from "axios";
import db from "../config/db";
import { brandProfiles, campaignPlans } from "../model/schema";
import { eq } from "drizzle-orm";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1/campaigns"; 

export class CampaignPlanService {
  static async createCampaignPlan(userId: number, payload: any) {
    try {
      const response = await axios.post(API_BASE_URL, payload);
      const campaignData = response.data;
      console.log("campaignData........",campaignData)
      const checkBrandProfile = await db.select().from(brandProfiles).where(eq(brandProfiles.profileId, payload.brand_profile_id));
      if(checkBrandProfile.length > 0){
        const [newPlan] = await db
          .insert(campaignPlans)
          .values({
            userId,
            brandProfileId: checkBrandProfile[0].id,
            campaignId: campaignData._id,
            data: campaignData, 
          })
          .returning();
        newPlan.brandProfileId = payload.brand_profile_id;
        return newPlan;
      }
      else{
        return { message: "brand profile not found" };
      }
    } catch (error: any) {
      console.error("Error creating campaign plan:", error.response?.data || error.message);
      throw new Error("Failed to create campaign plan");
    }
  }

  static async getCampaignPlan(campaignPlanId:string) {
    try {
      console.log("campaignPlanId........",campaignPlanId)
      const response = await axios.get(`${API_BASE_URL}/${campaignPlanId}`);
      const campaignData = response.data;
      console.log("campaignData........",campaignData)
      return campaignData;
    } catch (error:any) {
      console.error("Error getting campaign plan:", error.response?.data || error.message);
    }
  }

 static async getAiRecommendations(campaignPlanId: string) {
  try {
    console.log("campaignPlanId........", campaignPlanId);

    // API expects POST not GET
    const response = await axios.post(
      `${API_BASE_URL}/${campaignPlanId}/recommendations`
    );
    const recommendations = response.data;
    // console.log("recommendations........", recommendations);
    return recommendations;
  } catch (error: any) {
    console.error(
      "Error getting campaign recommendations:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.detail || error.message || "Unknown error"
    );
  }
}

static async finalizeCampaignPlan(
  campaignPlanId: string,
  payload: { selected_platforms: string[]; selected_duration_weeks: number }
) {
  try {
    console.log("Finalizing campaign plan:", campaignPlanId, payload);

    const response = await axios.post(
      `${API_BASE_URL}/${campaignPlanId}/finalize`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
   
    const finalizedPlan = response.data;
    // console.log("Finalized Plan Response:", finalizedPlan);

    return finalizedPlan;
  } catch (error: any) {
    console.error(
      "Error finalizing campaign plan:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Unknown error while finalizing campaign plan"
    );
  }
}

}
