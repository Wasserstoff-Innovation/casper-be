/**
 * Brand Identifier Service
 * 
 * SIMPLE: Frontend sends brand_profile_id, we validate and use it.
 * Optional fallbacks for convenience.
 */

import { BrandProfile } from '../models';
import { toObjectId } from '../utils/mongoHelpers';

export class BrandIdentifier {
  /**
   * Validate and return brand profile ID
   * 
   * @param userId User ID (for ownership validation)
   * @param brandProfileId Brand profile ID from frontend
   * @returns Brand profile ID if valid, null otherwise
   */
  static async validateBrand(
    userId: number,
    brandProfileId: string
  ): Promise<string | null> {
    if (!brandProfileId) {
      return null;
    }
    
    // Validate that this brand belongs to the user
    const isValid = await this.validateBrandOwnership(userId, brandProfileId);
    if (isValid) {
      return brandProfileId;
    }
    
    console.warn('⚠️ Invalid brand_profile_id - does not belong to user');
    return null;
  }
  
  /**
   * Validate that brand profile belongs to user
   * 
   * @param userId User ID
   * @param profileId Brand profile ID (profileId, not database ID)
   * @returns true if valid, false otherwise
   */
  private static async validateBrandOwnership(
    userId: number,
    profileId: string
  ): Promise<boolean> {
    try {
      const brandProfile = await BrandProfile.findOne({
        profileId: profileId,
        userId: toObjectId(userId)
      }).lean();

      return !!brandProfile;
    } catch (error: any) {
      console.error('❌ Error validating brand ownership:', error.message);
      return false;
    }
  }
  
  /**
   * Get all brand profiles for a user (for frontend selection)
   * 
   * @param userId User ID
   * @returns Array of brand profiles with basic info
   */
  static async getUserBrands(userId: number): Promise<Array<{
    profile_id: string;
    brand_name?: string;
    domain?: string;
    status: string;
    updated_at: Date | null;
  }>> {
    try {
      const profiles = await BrandProfile.find({
        userId: toObjectId(userId)
      })
        .select('profileId brandKit status updated_at')
        .lean();

      return profiles.map((profile: any) => {
        const brandKit = profile.brandKit as any;
        const brandName = brandKit?.comprehensive?.meta?.brand_name?.value ||
                         brandKit?.brand_name ||
                         'Unknown Brand';
        const domain = brandKit?.comprehensive?.meta?.canonical_domain?.value ||
                      brandKit?.domain ||
                      null;

        return {
          profile_id: profile.profileId || '',
          brand_name: brandName,
          domain: domain,
          status: profile.status || 'unknown',
          updated_at: profile.updated_at,
        };
      });
    } catch (error: any) {
      console.error('❌ Error getting user brands:', error.message);
      return [];
    }
  }
}

