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
  const userData = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      brandProfiles: {
        with: {
          brandKits: true,
          campaignPlans: {
            with: {
              contentCalander: true,
            },
          },
        },
      },
    },
  });
  console.log("userData...................",userData);
  return {
    userId,
    brands: userData?.brandProfiles.map((bp:any) => ({
      id: bp.id,
      jobId: bp.jobId,
      profileId: bp.profileId,
      status: bp.data?.status ?? "unknown",
      createdAt: bp.created_at,
      brandKits: bp.brandKits.map((kit:any) => ({
        id: kit.id,
        kitData: kit.kitData,
        createdAt: kit.created_at,
        updatedAt: kit.updated_at,
      })),
      campaigns: bp.campaignPlans.map((cp:any) => ({
        id: cp.id,
        campaignId: cp.campaignId,
        data: cp.data,
        createdAt: cp.created_at,
        contentCalander: cp.contentCalander.map((cal:any) => ({
          id: cal.id,
          data: cal.data,
          createdAt: cal.created_at,
        })),
      })),
    })),
    activeBrandId: userData?.brandProfiles[0]?.profileId || null,
    loading: false,
    error: null,
  };
};
}
