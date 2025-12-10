import { User, BrandProfile, BrandKit, CalendarPost, CampaignNew, BrandRecommendation } from "../models";
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
      // profileId could be the _id or the deprecated profileId field
      let profile = await BrandProfile.findById(profileId)
        .select('_id')
        .lean();

      // Fallback to deprecated profileId field if not found by _id
      if (!profile) {
        profile = await BrandProfile.findOne({ profileId: profileId })
          .select('_id')
          .lean();
      }

      console.log("BrandProfile lookup for:", profileId, "found:", !!profile);

      if (!profile) return [];

      // Get all posts for this brand_id first (this is the primary data source)
      const allPosts = await CalendarPost.find({ brand_id: profileId })
        .sort({ date: 1, post_order: 1 })
        .lean();

      console.log("Total posts found for brand:", profileId, "count:", allPosts.length);

      // Get unique campaign_ids from posts
      const uniqueCampaignIds = [...new Set(allPosts.map((p: any) => p.campaign_id).filter(Boolean))];
      console.log("Unique campaign_ids in posts:", uniqueCampaignIds);

      // Query campaigns collection
      const campaigns = await CampaignNew.find({ brand_id: profileId })
        .sort({ created_at: -1 })
        .lean();

      console.log("Campaigns from CampaignNew:", campaigns.map((c: any) => ({ _id: c._id.toString(), name: c.name })));

      // Build a map of campaign_id to campaign data
      const campaignMap: Record<string, any> = {};
      campaigns.forEach((c: any) => {
        campaignMap[c._id.toString()] = c;
      });

      // Group posts by campaign_id
      const postsByCampaign: Record<string, any[]> = {};
      allPosts.forEach((post: any) => {
        const cid = post.campaign_id || 'uncategorized';
        if (!postsByCampaign[cid]) {
          postsByCampaign[cid] = [];
        }
        postsByCampaign[cid].push(post);
      });

      // Build campaigns with posts - use campaign_ids from posts as primary source
      const campaignsWithPosts = uniqueCampaignIds.map((campaignId: string) => {
        const campaign = campaignMap[campaignId];
        const posts = postsByCampaign[campaignId] || [];

        // Group posts by date
        const postsByDate: Record<string, any[]> = {};
        posts.forEach((post: any) => {
          if (!postsByDate[post.date]) {
            postsByDate[post.date] = [];
          }
          postsByDate[post.date].push(post);
        });

        // Get date range
        const dates = posts.map((p: any) => p.date).filter(Boolean).sort();
        const dateRange = dates.length > 0 ? {
          start: dates[0],
          end: dates[dates.length - 1]
        } : null;

        return {
          id: campaignId,
          name: campaign?.name || `Campaign ${campaignId.slice(-6)}`,
          status: campaign?.status || 'ACTIVE',
          start_date: campaign?.start_date || dateRange?.start,
          end_date: campaign?.end_date || dateRange?.end,
          duration_weeks: campaign?.duration_weeks,
          posts_per_week: campaign?.posts_per_week,
          total_posts: posts.length,
          posts: {
            total_posts: posts.length,
            posts_by_date: postsByDate,
            date_range: dateRange
          }
        };
      });

      // Group all posts by date for brand calendar
      const allPostsByDate: Record<string, any[]> = {};
      allPosts.forEach((post: any) => {
        if (!allPostsByDate[post.date]) {
          allPostsByDate[post.date] = [];
        }
        allPostsByDate[post.date].push(post);
      });

      const allDates = allPosts.map((p: any) => p.date).filter(Boolean).sort();
      const brandCalendar = allPosts.length > 0 ? {
        brand_id: profileId,
        total_posts: allPosts.length,
        posts_by_date: allPostsByDate,
        date_range: allDates.length > 0 ? {
          start: allDates[0],
          end: allDates[allDates.length - 1]
        } : null
      } : null;

      console.log("Returning calendar data with", campaignsWithPosts.length, "campaigns and", allPosts.length, "total posts");

      return [{
        brandProfileId: profileId,
        campaigns: campaignsWithPosts,
        calendar: brandCalendar
      }];

    } catch (error: any) {
      console.error("Error fetching calendar data:", error);
      throw new Error("Failed to fetch calendar data");
    }
  };


}
