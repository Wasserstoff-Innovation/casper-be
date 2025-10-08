import db from "../config/db";
import { brandKits, brandProfiles, campaignPlans, contentCalander, users } from "../model/schema";
import { eq } from "drizzle-orm";

interface UserPayload {
  email: string;
  name?: string;
  avatar_url?: string;
  provider: string;
}

export default class AuthService {
  static async authHandler(payload: UserPayload) {
    const { email, name, avatar_url, provider } = payload;
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { user: existingUser, newSignUp: false };
    }
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        avatar_url,
        provider,
      })
      .returning();

    return { user: newUser, newSignUp: true };
  }

  static getUser = async (userId: number) => {
    try {
      const result: any = await db.query.brandProfiles.findMany({
        where: (fields: any, operators: any) => operators.eq(fields.userId, userId),
        columns: {
          profileId: true,
        },
        with: {
          brandKits: {
            columns: {
              kitData: true,
            },
          },
        },
      });

      if (!result || result.length === 0) {
        console.log("No brand profile found for user:", userId);
        return [];
      }
      console.log(" result................................", result[0]?.brandKits?.kitData);
      const formatted = result.map((profile: any) => {
        const brandKits = profile.brandKits;
        return {
          brandProfileId: profile.profileId,
          kitData: brandKits?.kitData ?? {},
        };
      });

      console.log("Formatted result................................", formatted);
      return formatted;

    } catch (error: any) {
      console.error("Error fetching user data:", error);
      throw new Error("Failed to fetch user data");
    }
  };


  static getCalendarData = async (userId: number, profileId: any) => {
    try {
      const result = await db.query.brandProfiles.findMany({
        where: (fields: any, operators: any) => operators.eq(fields.profileId, profileId),
        columns: { profileId: true },
        with: {
          campaignPlans: {
            columns: { campaignId: true },
            with: {
              contentCalander: { columns: { data: true } },
            },
          },
        },
      });

      // console.log("Raw result:", result);

      if (!result || result.length === 0) return [];

      const formatted = result.map((profile: any) => {
        const campaignPlansArray = Array.isArray(profile.campaignPlans)
          ? profile.campaignPlans
          : profile.campaignPlans
            ? [profile.campaignPlans]
            : [];

        return {
          brandProfileId: profile.profileId,
          campaignPlans: campaignPlansArray.map((campaignPlan: any) => {
            const contentCalanderArray = Array.isArray(campaignPlan.contentCalander)
              ? campaignPlan.contentCalander
              : campaignPlan.contentCalander
                ? [campaignPlan.contentCalander]
                : [];

            return {
              campaignId: campaignPlan.campaignId,
              contentCalander: contentCalanderArray.map((cc: any) => cc.data ?? {}),
            };
          }),
        };
      });

      console.log("Formatted calendar data:", formatted);
      return formatted;

    } catch (error: any) {
      console.error("Error fetching calendar data:", error);
      throw new Error("Failed to fetch calendar data");
    }
  };


}
