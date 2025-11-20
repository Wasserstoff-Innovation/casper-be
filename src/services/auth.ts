import { User, BrandProfile, BrandKit, CampaignPlan, ContentCalendar } from "../models";
import { toObjectId } from '../utils/mongoHelpers';

interface UserPayload {
  email: string;
  name?: string;
  avatar_url?: string;
  provider: string;
}

export default class AuthService {
  static async authHandler(payload: UserPayload) {
    const { email, name, avatar_url, provider } = payload;
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return { user: existingUser, newSignUp: false };
    }

    const newUser = await User.create({
      email,
      name,
      avatar_url,
      provider,
    });

    return { user: newUser, newSignUp: true };
  }

  static getUser = async (userId: number) => {
    try {
      // Get brand profiles for the user
      const profiles = await BrandProfile.find({
        userId: toObjectId(userId)
      })
        .select('profileId _id')
        .lean();

      if (!profiles || profiles.length === 0) {
        console.log("No brand profile found for user:", userId);
        return [];
      }

      // Get brand kits for each profile
      const formatted = await Promise.all(
        profiles.map(async (profile: any) => {
          const brandKit = await BrandKit.findOne({
            brandProfileId: profile._id
          })
            .select('kitData')
            .lean();

          console.log("Brand kit for profile:", profile.profileId, brandKit?.kitData);

          return {
            brandProfileId: profile.profileId,
            kitData: brandKit?.kitData ?? {},
          };
        })
      );

      console.log("Formatted result................................", formatted);
      return formatted;

    } catch (error: any) {
      console.error("Error fetching user data:", error);
      throw new Error("Failed to fetch user data");
    }
  };


  static getCalendarData = async (_userId: number, profileId: any) => {
    try {
      const profile = await BrandProfile.findOne({ profileId: profileId })
        .select('profileId _id')
        .lean();

      if (!profile) return [];

      // Get campaign plans for this profile
      const campaignPlans = await CampaignPlan.find({
        brandProfileId: profile._id
      }).lean();

      if (!campaignPlans || campaignPlans.length === 0) {
        return [{
          brandProfileId: profile.profileId,
          campaignPlans: []
        }];
      }

      // Get content calendars for each campaign plan
      const plansWithCalendars = await Promise.all(
        campaignPlans.map(async (plan: any) => {
          const calendar = await ContentCalendar.findOne({
            campaignPlanId: plan._id
          }).lean();

          return {
            campaignId: plan.campaignId,
            data: plan.data,
            calendar: calendar?.data || null,
            created_at: plan.created_at
          };
        })
      );

      return [{
        brandProfileId: profile.profileId,
        campaignPlans: plansWithCalendars
      }];

    } catch (error: any) {
      console.error("Error fetching calendar data:", error);
      throw new Error("Failed to fetch calendar data");
    }
  };


}
