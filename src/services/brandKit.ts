import FormData from "form-data";
import axios from "axios";
import { brandKits, brandProfiles } from "../model/schema";
import db from "../config/db";
import { eq } from "drizzle-orm";
import { envConfigs } from "../config/envConfig";

// const API_BASE_URL = "http://127.0.0.1:8000/api/v1/brand-kits";
const API_BASE_URL = `${envConfigs.aiBackendUrl}/v1/brand-kits`;

export default class BrandKitsService {
  
  // NEW: Auto-generate brand kit from v2 brand intelligence data
  static async createBrandKitFromV2Profile(userId: number, brandProfileId: string) {
    try {
      console.log("Creating brand kit from v2 profile:", brandProfileId);
      
      // Get the brand profile with v2 data
      const profile = await db.select()
        .from(brandProfiles)
        .where(eq(brandProfiles.profileId, brandProfileId))
        .limit(1);

      if (profile.length === 0) {
        throw new Error('Brand profile not found');
      }

      const brandProfile = profile[0];

      // Check if profile is complete
      if (brandProfile.status !== 'complete' || !brandProfile.brandKit) {
        throw new Error('Brand profile analysis is not complete yet');
      }

      // Transform v2 brand_kit data into brand kit format
      const kitData = {
        brand_name: brandProfile.brandKit.brand_name,
        domain: brandProfile.brandKit.domain,
        visual_identity: brandProfile.brandKit.visual_identity,
        voice_and_tone: brandProfile.brandKit.voice_and_tone,
        positioning: brandProfile.brandKit.positioning,
        audience: brandProfile.brandKit.audience,
        seo_foundation: brandProfile.brandKit.seo_foundation,
        content_strategy: brandProfile.brandKit.content_strategy,
        trust_elements: brandProfile.brandKit.trust_elements,
        conversion_analysis: brandProfile.brandKit.conversion_analysis,
        brand_scores: brandProfile.brandScores,
        brand_roadmap: brandProfile.brandRoadmap,
        generated_at: brandProfile.brandKit.generated_at,
        source: 'v2_brand_intelligence'
      };

      // Save to brand_kits table
      const savedKit = await db
        .insert(brandKits)
        .values({
          userId,
          brandProfileId: brandProfile.id,
          kitData: kitData,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .onConflictDoUpdate({
          target: brandKits.brandProfileId,
          set: {
            kitData: kitData,
            updated_at: new Date(),
          },
        })
        .returning();

      savedKit[0].brandProfileId = brandProfileId;
      return {
        success: true,
        message: 'Brand kit created successfully from v2 profile',
        brandKit: savedKit[0]
      };

    } catch (error: any) {
      console.error("Error creating brand kit from v2 profile:", error?.message || error);
      throw new Error(error?.message || "Failed to create brand kit from v2 profile");
    }
  }

  static async createBrandKit(
    userId: number,
    brandProfileId: string,
    kitDataJson: any,
    files: { [key: string]: any }
  ) {
    console.log("inside the service");
    try {
      const form = new FormData();
      form.append("kit_data_json", JSON.stringify(kitDataJson));

      if (files.logo_file)
        form.append("logo_file", files.logo_file.buffer, files.logo_file.originalname);

      if (files.mascot_file)
        form.append("mascot_file", files.mascot_file.buffer, files.mascot_file.originalname);

      if (files.additional_images && files.additional_images.length > 0) {
        files.additional_images.forEach((file: any) =>
          form.append("additional_images", file.buffer, file.originalname)
        );
      }

      // Send to 3rd-party API
      const response = await axios.post(`${API_BASE_URL}`, form, {
        headers: form.getHeaders(),
      });

      console.log("response.data....", response.data);

      const checkBrandProfile = await db
        .select()
        .from(brandProfiles)
        .where(eq(brandProfiles.profileId, brandProfileId));

      if (checkBrandProfile.length > 0) {
        const savedKit = await db
          .insert(brandKits)
          .values({
            userId,
            brandProfileId: checkBrandProfile[0].id,
            kitData: response.data,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .onConflictDoUpdate({
            target: brandKits.brandProfileId,
            set: {
              kitData: response.data,
              updated_at: new Date(),
            },
          })
          .returning();
        savedKit[0].brandProfileId = brandProfileId;
        return savedKit[0];
      } else {
        return { message: "brand profile not found" };
      }
    } catch (error: any) {
      console.error("Error in createBrandKit:", error?.response?.data || error.message || error);
      throw new Error(error?.message || "Failed to create brand kit");
    }
  }


  // NEW: Create brand kit manually (no AI, no brand profile required)
  static async createManualBrandKit(userId: number, kitData: any) {
    try {
      console.log("Creating manual brand kit for user:", userId);
      
      // Ensure format version and source are set
      const formattedKitData = {
        ...kitData,
        format_version: kitData.format_version || '2.0',
        source: 'manual',
        generated_at: kitData.generated_at || new Date().toISOString(),
      };

      // Save to brand_kits table (brandProfileId can be null for manual kits)
      const savedKit = await db
        .insert(brandKits)
        .values({
          userId,
          brandProfileId: null, // Manual kits don't require a brand profile
          kitData: formattedKitData,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();

      return {
        success: true,
        message: 'Manual brand kit created successfully',
        brandKit: savedKit[0]
      };

    } catch (error: any) {
      console.error("Error creating manual brand kit:", error?.message || error);
      throw new Error(error?.message || "Failed to create manual brand kit");
    }
  }

  static async fetchBrandKit(kitId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${kitId}`);
      // Expected JSON format from the 3rd party
      // console.log("response.data....",response.data)
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        // Handle validation error format
        return { detail: error.response.data.detail };
      }
      throw new Error(error.message);
    }
  }

  static async fetchBrandKitReport(kitId: string) {
    try {
      console.log("inside the fetchBrandKitReport")
      const response = await axios.get(`${API_BASE_URL}/${kitId}/report`
        , {
          headers: { Accept: "text/html" },
        }
      );
      // console.log("response.data....",response.data)  
      return response.data; // HTML string
    } catch (error: any) {
      // console.log("error.... report",error)
      if (error.response && error.response.status === 422) {
        return JSON.stringify({ detail: error.response.data.detail });
      }
      throw new Error(error.message);
    }
  }

}



