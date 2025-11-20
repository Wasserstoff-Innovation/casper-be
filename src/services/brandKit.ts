import FormData from "form-data";
import axios from "axios";
import { BrandKit, BrandProfile } from "../models";
import { envConfigs } from "../config/envConfig";
import { toObjectId } from '../utils/mongoHelpers';

const API_BASE_URL = `${envConfigs.aiBackendUrl}/v1/brand-kits`;

export default class BrandKitsService {

  // NEW: Auto-generate brand kit from v2 brand intelligence data
  static async createBrandKitFromV2Profile(userId: number, brandProfileId: string) {
    try {
      console.log("Creating brand kit from v2 profile:", brandProfileId);

      // Get the brand profile with v2 data
      const profile = await BrandProfile.findOne({ profileId: brandProfileId });

      if (!profile) {
        throw new Error('Brand profile not found');
      }

      // Check if profile is complete
      if (profile.status !== 'complete' || !profile.brandKit) {
        throw new Error('Brand profile analysis is not complete yet');
      }

      // Transform v2 brand_kit data into brand kit format
      const kitData = {
        brand_name: profile.brandKit.brand_name,
        domain: profile.brandKit.domain,
        visual_identity: profile.brandKit.visual_identity,
        voice_and_tone: profile.brandKit.voice_and_tone,
        positioning: profile.brandKit.positioning,
        audience: profile.brandKit.audience,
        seo_foundation: profile.brandKit.seo_foundation,
        content_strategy: profile.brandKit.content_strategy,
        trust_elements: profile.brandKit.trust_elements,
        conversion_analysis: profile.brandKit.conversion_analysis,
        brand_scores: profile.brandScores,
        brand_roadmap: profile.brandRoadmap,
        generated_at: profile.brandKit.generated_at,
        source: 'v2_brand_intelligence'
      };

      // Save to brand_kits table (upsert)
      const savedKit = await BrandKit.findOneAndUpdate(
        { brandProfileId: profile._id },
        {
          userId: toObjectId(userId),
          brandProfileId: profile._id,
          kitData: kitData,
          updated_at: new Date(),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      return {
        success: true,
        message: 'Brand kit created successfully from v2 profile',
        brandKit: {
          ...savedKit.toObject(),
          brandProfileId: brandProfileId
        }
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

      const checkBrandProfile = await BrandProfile.findOne({ profileId: brandProfileId });

      if (checkBrandProfile) {
        const savedKit = await BrandKit.findOneAndUpdate(
          { brandProfileId: checkBrandProfile._id },
          {
            userId: toObjectId(userId),
            brandProfileId: checkBrandProfile._id,
            kitData: response.data,
            updated_at: new Date(),
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
          }
        );

        return {
          ...savedKit.toObject(),
          brandProfileId: brandProfileId
        };
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
      const savedKit = await BrandKit.create({
        userId: toObjectId(userId),
        brandProfileId: null, // Manual kits don't require a brand profile
        kitData: formattedKitData,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return {
        success: true,
        message: 'Manual brand kit created successfully',
        brandKit: savedKit
      };

    } catch (error: any) {
      console.error("Error creating manual brand kit:", error?.message || error);
      throw new Error(error?.message || "Failed to create manual brand kit");
    }
  }

  // NEW: Get brand kit by profile ID - checks both local DB and backend API
  static async getBrandKitByProfileId(profileId: string) {
    try {
      // First, try to get from local database
      // Handle both numeric ID and string profileId
      const profile = await BrandProfile.findOne({ profileId: profileId.toString() });

      if (profile) {
        // Check if we have a brand kit in local DB
        const brandKit = await BrandKit.findOne({ brandProfileId: profile._id });

        if (brandKit && brandKit.kitData) {
          console.log('✅ Found brand kit in local database');
          const kitData = brandKit.kitData as any;

          // Ensure comprehensive structure exists
          if (!kitData.comprehensive) {
            console.warn('⚠️ Brand kit missing comprehensive structure, may need re-analysis');
            return null; // Signal re-analysis needed
          }

          return kitData;
        }

        // If no local kit but profile is complete, try to re-analyze
        if (profile.status === 'complete' && profile.brandKit) {
          console.log('⚠️ No local brand kit found, but profile is complete. Attempting to create from profile data...');
          // This will be handled by the re-analyze endpoint
          return null; // Signal that re-analysis is needed
        }

        // If profile is complete, try fetching from backend with comprehensive format
        if (profile.status === 'complete' && profile.jobId) {
          try {
            const response = await axios.get(`${envConfigs.aiBackendUrl}/v2/brand-intelligence/jobs/${profile.jobId}?format=comprehensive`);
            if (response.data.status === 'complete' && response.data.result) {
              console.log('✅ Found brand kit data in backend API with comprehensive format');
              // Backend returns comprehensive format directly - we can use it
              const comprehensive = response.data.result.comprehensive;
              if (comprehensive) {
                // Return the comprehensive format directly
                return {
                  comprehensive: comprehensive,
                  v2_raw: {
                    brand_kit: response.data.result.brand_kit,
                    brand_scores: response.data.result.brand_scores,
                    brand_roadmap: response.data.result.brand_roadmap,
                  },
                  format_version: '2.0',
                  source: 'v2_brand_intelligence_backend',
                  generated_at: response.data.result.generated_at,
                };
              }
              // If no comprehensive format, signal re-analysis needed
              return null;
            }
          } catch (apiError: any) {
            console.log('⚠️ Backend API unavailable:', apiError.message);
          }
        }
      }

      // If not found in local DB, try backend API (legacy v1 endpoint)
      try {
        const response = await axios.get(`${API_BASE_URL}/${profileId}`);
        console.log('✅ Found brand kit in backend API (v1)');
        return response.data;
      } catch (apiError: any) {
        if (apiError.response && apiError.response.status === 404) {
          // Only say not available if both local DB and backend API don't have it
          throw new Error(`Brand kit not found in database or backend API. Profile ID: ${profileId}`);
        }
        throw apiError;
      }
    } catch (error: any) {
      console.error('❌ Error fetching brand kit:', error.message);
      throw error;
    }
  }

  static async fetchBrandKit(kitId: string) {
    try {
      // First try to get from local DB by kit ID
      const kit = await BrandKit.findById(kitId);

      if (kit && kit.kitData) {
        console.log('✅ Found brand kit in local database by ID');
        return kit.kitData;
      }

      // Fallback to backend API
      const response = await axios.get(`${API_BASE_URL}/${kitId}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        return { detail: error.response.data.detail };
      }
      if (error.response && error.response.status === 404) {
        throw new Error(`Brand kit not found in database or backend API. Kit ID: ${kitId}`);
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
      return response.data; // HTML string
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        return JSON.stringify({ detail: error.response.data.detail });
      }
      throw new Error(error.message);
    }
  }

}
