import db from "../config/db";
import { users } from "../model/schema";
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
}
