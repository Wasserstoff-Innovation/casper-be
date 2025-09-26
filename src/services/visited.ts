import { eq } from "drizzle-orm";
import { visitedUsers } from "../model/schema";
import db from "../config/db";

export class VisitedUserService {
  static async createVisitedUser(data: any) {
    const existingUser = await db
      .select()
      .from(visitedUsers)
      .where(eq(visitedUsers.email, data.email));

    if (existingUser.length > 0) {
      return { status: "already_submitted", user: existingUser[0] };
    }
    const [newUser] = await db.insert(visitedUsers).values(data).returning();
    return { status: "success", user: newUser };
  }
}
