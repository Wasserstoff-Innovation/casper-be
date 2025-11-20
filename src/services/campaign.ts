import axios from "axios";
import { BrandProfile, CampaignPlan } from "../models";
import { envConfigs } from "../config/envConfig";
import { toObjectId } from '../utils/mongoHelpers';

const API_BASE_URL = `${envConfigs.aiBackendUrl}/v1/campaigns`;

export class CampaignPlanService {

  static async createChat(userId: number, payload: any) {
    try {
      console.log("payload.......text.",payload)
      const generateStructuredData:any = await axios.post(
        `${API_BASE_URL}/parse-from-text`,
        payload
      );
      console.log("generateStructuredData........",generateStructuredData)
      generateStructuredData.data.brand_profile_id = payload.brand_profile_id;
      // console.log("campaignData........",generateStructuredData)
    return generateStructuredData?.data;
    } catch (error: any) {
      console.error("Error creating campaign plan:", error.response?.data || error.message);
      throw new Error(error.response?.data?.detail[0].msg || error.message || "Unknown error");
    }
  }
static async createCampaignPlan(userId: number, payload: any) {
  try {
    const brandProfileRecord = await BrandProfile.findOne({
      profileId: payload.brand_profile_id
    });

    if (!brandProfileRecord) {
      return { message: "Brand profile not found" };
    }

    const existingPlan = await CampaignPlan.findOne({
      brandProfileId: brandProfileRecord._id
    });

    if (existingPlan) {
      return {
        message: "Campaign plan already exists for this brand profile",
        existingPlan: existingPlan,
      };
    }

    const response = await axios.post(`${API_BASE_URL}`, payload);
    const campaignData = response.data;

    const newPlan = await CampaignPlan.create({
      userId: toObjectId(userId),
      brandProfileId: brandProfileRecord._id,
      campaignId: campaignData._id,
      data: campaignData,
    });

    const result = newPlan.toObject();
    (result as any).brandProfileId = payload.brand_profile_id;

    return {
      message: "New campaign plan created successfully",
      data: result,
    };

  } catch (error: any) {
    console.error("Error creating campaign plan:", error.response?.data || error.message);
    return {
      message: error.response?.data?.detail?.[0]?.msg || error.message || "Unknown error",
      status: "error",
    };
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
    if(finalizedPlan.plan_status ){
      //update plan_status in campaignPlans table
      await CampaignPlan.findOneAndUpdate(
        { campaignId: campaignPlanId },
        { data: { ...finalizedPlan, plan_status: finalizedPlan.plan_status } },
        { new: true }
      );
    }

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
