import FormData from "form-data";
import axios from "axios";
import { BrandKit, BrandProfile } from "../models";
import { envConfigs } from "../config/envConfig";
import { toObjectId } from '../utils/mongoHelpers';
import {
  ComprehensiveBrandKit,
  VisualKitUIConfig,
  DataQualityMetrics,
  calculateDataQuality,
  updateFieldWithEdit,
} from '../types/brandKit';
import {
  ensureComprehensiveStructure,
  ensureVisualKitConfig,
  applyDeepUpdate,
  getDefaultVisualKitConfig,
} from '../utils/visualKitTransformer';

const API_BASE_URL = `${envConfigs.aiBackendUrl}/v1/brand-kits`;

export default class BrandKitsService {

  // ============================================
  // UNIFIED BRAND KIT ACCESS
  // ============================================

  /**
   * Get the comprehensive brand kit for a profile.
   * Returns the single source of truth with all brand data.
   */
  static async getComprehensiveBrandKit(profileId: string): Promise<{
    comprehensive: ComprehensiveBrandKit;
    visualKitConfig: VisualKitUIConfig;
    dataQuality: DataQualityMetrics;
    brandKitId: string;
  } | null> {
    try {
      const profile = await BrandProfile.findOne({ profileId: profileId.toString() });
      if (!profile) {
        throw new Error('Brand profile not found');
      }

      let brandKit = await BrandKit.findOne({ brandProfileId: profile._id });

      if (!brandKit) {
        // Try to find by profileId directly
        brandKit = await BrandKit.findOne({ profileId: profileId.toString() });
      }

      if (!brandKit) {
        // No brand kit exists yet - create one from profile data
        console.log('⚠️ No brand kit found, creating from profile data');
        
        const brandName = profile.name || profile.brand_name || 'Brand';
        const domain = profile.domain || 'example.com';
        
        // Create comprehensive structure from any existing data
        let existingComprehensive: Partial<ComprehensiveBrandKit> = {};
        
        if (profile.brandKit?.comprehensive) {
          existingComprehensive = profile.brandKit.comprehensive;
        } else if (profile.brandKit) {
          // Transform legacy brandKit data
          existingComprehensive = transformLegacyBrandKit(profile.brandKit);
        }
        
        const comprehensive = ensureComprehensiveStructure(existingComprehensive, brandName, domain);
        const visualKitConfig = getDefaultVisualKitConfig();
        const dataQuality = calculateDataQuality(comprehensive);
        
        // Create the brand kit record
        brandKit = await BrandKit.create({
          userId: profile.userId ? toObjectId(profile.userId) : undefined,
          profileId: profileId,
          brandProfileId: profile._id,
          brand_name: brandName,
          domain: domain,
          comprehensive: comprehensive,
          visual_kit_config: visualKitConfig,
          data_quality: dataQuality,
          created_at: new Date(),
          updated_at: new Date(),
        });
        
        console.log('✅ Created brand kit from profile data');
      }

      // Ensure comprehensive structure exists and is complete
      let comprehensive = brandKit.comprehensive as ComprehensiveBrandKit;
      if (!comprehensive) {
        // Try to build from legacy kitData
        if (brandKit.kitData?.comprehensive) {
          comprehensive = brandKit.kitData.comprehensive;
        } else if (brandKit.kitData) {
          comprehensive = transformLegacyBrandKit(brandKit.kitData) as ComprehensiveBrandKit;
        } else {
          comprehensive = {} as ComprehensiveBrandKit;
        }
      }
      
      comprehensive = ensureComprehensiveStructure(
        comprehensive,
        brandKit.brand_name || 'Brand',
        brandKit.domain || 'example.com'
      );

      // Ensure visual kit config exists
      const visualKitConfig = ensureVisualKitConfig(brandKit.visual_kit_config as any);
      
      // Calculate data quality
      const dataQuality = calculateDataQuality(comprehensive);

      return {
        comprehensive,
        visualKitConfig,
        dataQuality,
        brandKitId: brandKit._id.toString(),
      };
    } catch (error: any) {
      console.error('❌ Error getting comprehensive brand kit:', error.message);
      throw error;
    }
  }

  /**
   * Update a field in the comprehensive brand kit.
   * Path format: "meta.brand_name" or "visual_identity.color_system.primary_colors.items[0].hex"
   */
  static async updateComprehensiveField(
    profileId: string,
    path: string,
    value: any
  ): Promise<{ success: boolean; path: string; newValue: any }> {
    try {
      const profile = await BrandProfile.findOne({ profileId: profileId.toString() });
      if (!profile) {
        throw new Error('Brand profile not found');
      }

      const brandKit = await BrandKit.findOne({ brandProfileId: profile._id });
      if (!brandKit) {
        throw new Error('Brand kit not found - call getComprehensiveBrandKit first');
      }

      let comprehensive = brandKit.comprehensive as ComprehensiveBrandKit;
      if (!comprehensive) {
        throw new Error('Comprehensive structure not found');
      }

      // Apply the update
      const { updated, fieldPath } = applyDeepUpdate(comprehensive, path, value);
      
      // Update data quality
      const dataQuality = calculateDataQuality(updated);
      dataQuality.lastEditedAt = new Date().toISOString();
      if (!dataQuality.editedFieldPaths.includes(fieldPath)) {
        dataQuality.editedFieldPaths.push(fieldPath);
      }

      // Save to database
      await BrandKit.updateOne(
        { _id: brandKit._id },
        {
          $set: {
            comprehensive: updated,
            data_quality: dataQuality,
            updated_at: new Date(),
          }
        }
      );

      console.log(`✅ Updated field: ${path}`);
      return { success: true, path: fieldPath, newValue: value };
    } catch (error: any) {
      console.error('❌ Error updating field:', error.message);
      throw error;
    }
  }

  /**
   * Update an entire section of the comprehensive brand kit.
   */
  static async updateComprehensiveSection(
    profileId: string,
    section: keyof ComprehensiveBrandKit,
    data: any
  ): Promise<{ success: boolean; section: string }> {
    try {
      const profile = await BrandProfile.findOne({ profileId: profileId.toString() });
      if (!profile) {
        throw new Error('Brand profile not found');
      }

      const brandKit = await BrandKit.findOne({ brandProfileId: profile._id });
      if (!brandKit) {
        throw new Error('Brand kit not found');
      }

      let comprehensive = brandKit.comprehensive as ComprehensiveBrandKit;
      if (!comprehensive) {
        comprehensive = {} as ComprehensiveBrandKit;
      }

      // Update the section
      (comprehensive as any)[section] = data;
      
      // Update data quality
      const dataQuality = calculateDataQuality(comprehensive);
      dataQuality.lastEditedAt = new Date().toISOString();

      await BrandKit.updateOne(
        { _id: brandKit._id },
        {
          $set: {
            comprehensive: comprehensive,
            data_quality: dataQuality,
            updated_at: new Date(),
          }
        }
      );

      console.log(`✅ Updated section: ${section}`);
      return { success: true, section };
    } catch (error: any) {
      console.error('❌ Error updating section:', error.message);
      throw error;
    }
  }

  /**
   * Update visual kit UI configuration (slides, export settings).
   * This does NOT update brand data - only presentation settings.
   */
  static async updateVisualKitConfig(
    profileId: string,
    config: Partial<VisualKitUIConfig>
  ): Promise<{ success: boolean; visualKitConfig: VisualKitUIConfig }> {
    try {
      const profile = await BrandProfile.findOne({ profileId: profileId.toString() });
      if (!profile) {
        throw new Error('Brand profile not found');
      }

      const brandKit = await BrandKit.findOne({ brandProfileId: profile._id });
      if (!brandKit) {
        throw new Error('Brand kit not found');
      }

      const existingConfig = brandKit.visual_kit_config as Partial<VisualKitUIConfig> || {};
      const updatedConfig: VisualKitUIConfig = {
        slides: config.slides || existingConfig.slides || getDefaultVisualKitConfig().slides,
        settings: {
          ...getDefaultVisualKitConfig().settings,
          ...existingConfig.settings,
          ...config.settings,
        },
        lastEditedAt: new Date().toISOString(),
      };

      await BrandKit.updateOne(
        { _id: brandKit._id },
        {
          $set: {
            visual_kit_config: updatedConfig,
            updated_at: new Date(),
          }
        }
      );

      console.log('✅ Updated visual kit config');
      return { success: true, visualKitConfig: updatedConfig };
    } catch (error: any) {
      console.error('❌ Error updating visual kit config:', error.message);
      throw error;
    }
  }

  /**
   * Regenerate comprehensive structure from analysis data.
   * Preserves user edits where the field is marked as edited.
   */
  static async regenerateFromAnalysis(profileId: string): Promise<{
    success: boolean;
    comprehensive: ComprehensiveBrandKit;
    dataQuality: DataQualityMetrics;
  }> {
    try {
      const profile = await BrandProfile.findOne({ profileId: profileId.toString() });
      if (!profile) {
        throw new Error('Brand profile not found');
      }

      const brandKit = await BrandKit.findOne({ brandProfileId: profile._id });
      const existingComprehensive = brandKit?.comprehensive as ComprehensiveBrandKit | undefined;
      
      // Get fresh data from profile or backend
      let freshData: Partial<ComprehensiveBrandKit> = {};
      
      if (profile.brandKit?.comprehensive) {
        freshData = profile.brandKit.comprehensive;
      } else if (profile.brandKit) {
        freshData = transformLegacyBrandKit(profile.brandKit);
      }
      
      // If we have existing data with edits, merge carefully
      let comprehensive: ComprehensiveBrandKit;
      if (existingComprehensive) {
        comprehensive = mergePreservingEdits(existingComprehensive, freshData);
      } else {
        comprehensive = ensureComprehensiveStructure(
          freshData,
          profile.name || profile.brand_name || 'Brand',
          profile.domain || 'example.com'
        );
      }
      
      const dataQuality = calculateDataQuality(comprehensive);
      dataQuality.lastAnalyzedAt = new Date().toISOString();

      if (brandKit) {
        await BrandKit.updateOne(
          { _id: brandKit._id },
          {
            $set: {
              comprehensive: comprehensive,
              data_quality: dataQuality,
              updated_at: new Date(),
            }
          }
        );
      } else {
        await BrandKit.create({
          userId: profile.userId ? toObjectId(profile.userId) : undefined,
          profileId: profileId,
          brandProfileId: profile._id,
          brand_name: profile.name || profile.brand_name || 'Brand',
          domain: profile.domain || 'example.com',
          comprehensive: comprehensive,
          visual_kit_config: getDefaultVisualKitConfig(),
          data_quality: dataQuality,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      console.log('✅ Regenerated comprehensive from analysis');
      return { success: true, comprehensive, dataQuality };
    } catch (error: any) {
      console.error('❌ Error regenerating from analysis:', error.message);
      throw error;
    }
  }

  // ============================================
  // LEGACY METHODS (for backwards compatibility)
  // ============================================

  static async createBrandKitFromV2Profile(userId: number, brandProfileId: string) {
    try {
      console.log("Creating brand kit from v2 profile:", brandProfileId);

      const profile = await BrandProfile.findOne({ profileId: brandProfileId });
      if (!profile) {
        throw new Error('Brand profile not found');
      }

      if (profile.status !== 'complete' || !profile.brandKit) {
        throw new Error('Brand profile analysis is not complete yet');
      }

      // Transform to comprehensive format
      let comprehensive: ComprehensiveBrandKit;
      if (profile.brandKit.comprehensive) {
        comprehensive = ensureComprehensiveStructure(profile.brandKit.comprehensive);
      } else {
        comprehensive = ensureComprehensiveStructure(
          transformLegacyBrandKit(profile.brandKit),
          profile.name || profile.brand_name || 'Brand',
          profile.domain || 'example.com'
        );
      }

      const visualKitConfig = getDefaultVisualKitConfig();
      const dataQuality = calculateDataQuality(comprehensive);

      const savedKit = await BrandKit.findOneAndUpdate(
        { brandProfileId: profile._id },
        {
          userId: toObjectId(userId),
          profileId: brandProfileId,
          brandProfileId: profile._id,
          brand_name: profile.name || profile.brand_name,
          domain: profile.domain,
          comprehensive: comprehensive,
          visual_kit_config: visualKitConfig,
          data_quality: dataQuality,
          kitData: profile.brandKit,
          brand_scores: profile.brandScores,
          brand_roadmap: profile.brandRoadmap,
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

      const response = await axios.post(`${API_BASE_URL}`, form, {
        headers: form.getHeaders(),
      });

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

  static async createManualBrandKit(userId: number, kitData: any) {
    try {
      console.log("Creating manual brand kit for user:", userId);

      const formattedKitData = {
        ...kitData,
        format_version: kitData.format_version || '2.0',
        source: 'manual',
        generated_at: kitData.generated_at || new Date().toISOString(),
      };

      const savedKit = await BrandKit.create({
        userId: toObjectId(userId),
        brandProfileId: null,
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

  static async getBrandKitByProfileId(profileId: string) {
    try {
      const profile = await BrandProfile.findOne({ profileId: profileId.toString() });

      if (profile) {
        const brandKit = await BrandKit.findOne({ brandProfileId: profile._id });

        if (brandKit && brandKit.kitData) {
          console.log('✅ Found brand kit in local database');
          const kitData = brandKit.kitData as any;

          if (!kitData.comprehensive) {
            console.warn('⚠️ Brand kit missing comprehensive structure, may need re-analysis');
            return null;
          }

          return kitData;
        }

        if (profile.status === 'complete' && profile.brandKit) {
          console.log('⚠️ No local brand kit found, but profile is complete.');
          return null;
        }

        if (profile.status === 'complete' && profile.jobId) {
          try {
            const response = await axios.get(`${envConfigs.aiBackendUrl}/v2/brand-intelligence/jobs/${profile.jobId}?format=comprehensive`);
            if (response.data.status === 'complete' && response.data.result) {
              const comprehensive = response.data.result.comprehensive;
              if (comprehensive) {
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
              return null;
            }
          } catch (apiError: any) {
            console.log('⚠️ Backend API unavailable:', apiError.message);
          }
        }
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/${profileId}`);
        console.log('✅ Found brand kit in backend API (v1)');
        return response.data;
      } catch (apiError: any) {
        if (apiError.response && apiError.response.status === 404) {
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
      const kit = await BrandKit.findById(kitId);

      if (kit && kit.kitData) {
        console.log('✅ Found brand kit in local database by ID');
        return kit.kitData;
      }

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
      const response = await axios.get(`${API_BASE_URL}/${kitId}/report`, {
        headers: { Accept: "text/html" },
      });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        return JSON.stringify({ detail: error.response.data.detail });
      }
      throw new Error(error.message);
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Transform legacy brand kit data to comprehensive structure.
 */
function transformLegacyBrandKit(legacyData: any): Partial<ComprehensiveBrandKit> {
  if (!legacyData) return {};
  
  const result: Partial<ComprehensiveBrandKit> = {};
  
  // If already has comprehensive structure, return it
  if (legacyData.comprehensive) {
    return legacyData.comprehensive;
  }
  
  // Transform visual_identity
  if (legacyData.visual_identity) {
    const vi = legacyData.visual_identity;
    result.visual_identity = {
      logos: {
        primary_logo_url: vi.logo_url ? { value: vi.logo_url, status: 'found', confidence: 0.9, description: 'Primary logo', usage: ['header'], source: ['analysis'], notes: null } : undefined,
        favicon_url: vi.favicon_url ? { value: vi.favicon_url, status: 'found', confidence: 0.9, description: 'Favicon', usage: ['browser'], source: ['analysis'], notes: null } : undefined,
      },
      color_system: {
        primary_colors: vi.colors?.primary ? {
          items: vi.colors.primary.map((hex: string) => ({ hex, role: 'primary', usage: ['brand'] })),
          status: 'found',
          confidence: 0.9,
          description: 'Primary colors',
          usage: ['brand'],
          source: ['analysis'],
          notes: null,
        } : undefined,
        secondary_colors: vi.colors?.secondary ? {
          items: vi.colors.secondary.map((hex: string) => ({ hex, role: 'secondary', usage: ['accent'] })),
          status: 'found',
          confidence: 0.8,
          description: 'Secondary colors',
          usage: ['accent'],
          source: ['analysis'],
          notes: null,
        } : undefined,
      },
      typography: {
        heading_font: vi.typography?.heading ? {
          value: { name: vi.typography.heading },
          status: 'found',
          confidence: 0.9,
          description: 'Heading font',
          usage: ['headings'],
          source: ['analysis'],
          notes: null,
        } : undefined,
        body_font: vi.typography?.body ? {
          value: { name: vi.typography.body },
          status: 'found',
          confidence: 0.9,
          description: 'Body font',
          usage: ['body'],
          source: ['analysis'],
          notes: null,
        } : undefined,
      },
    } as any;
  }
  
  // Transform verbal_identity
  if (legacyData.verbal_identity || legacyData.voice_and_tone) {
    const vi = legacyData.verbal_identity || {};
    const vt = legacyData.voice_and_tone || {};
    
    result.verbal_identity = {
      tagline: vi.tagline || vt.tagline ? {
        value: vi.tagline || vt.tagline,
        status: 'found',
        confidence: 0.8,
        description: 'Brand tagline',
        usage: ['marketing'],
        source: ['analysis'],
        notes: null,
      } : undefined,
      elevator_pitch: vi.elevator_pitch || vt.elevator_pitch ? {
        value: vi.elevator_pitch || vt.elevator_pitch,
        status: 'found',
        confidence: 0.8,
        description: 'Elevator pitch',
        usage: ['about'],
        source: ['analysis'],
        notes: null,
      } : undefined,
      tone_of_voice: {
        adjectives: vi.tone_voice || vt.tone_attributes ? {
          items: vi.tone_voice || vt.tone_attributes || [],
          status: 'found',
          confidence: 0.7,
          description: 'Tone adjectives',
          usage: ['content'],
          source: ['analysis'],
          notes: null,
        } : undefined,
      },
    } as any;
  }
  
  return result;
}

/**
 * Merge fresh analysis data with existing data, preserving user edits.
 */
function mergePreservingEdits(
  existing: ComprehensiveBrandKit,
  fresh: Partial<ComprehensiveBrandKit>
): ComprehensiveBrandKit {
  const result = JSON.parse(JSON.stringify(existing));
  
  function mergeRecursive(target: any, source: any) {
    if (!source) return;
    
    for (const key of Object.keys(source)) {
      if (target[key] && typeof target[key] === 'object' && 'isEdited' in target[key]) {
        // This is a field - only update if not edited by user
        if (!target[key].isEdited) {
          target[key] = source[key];
        }
      } else if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        // Recurse into nested objects
        mergeRecursive(target[key], source[key]);
      } else if (!(key in target)) {
        // Add new fields
        target[key] = source[key];
      }
    }
  }
  
  mergeRecursive(result, fresh);
  return ensureComprehensiveStructure(result);
}
