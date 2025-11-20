import { VisitedUser } from "../models";

export class VisitedUserService {
  static async createVisitedUser(data: any) {
    const existingUser = await VisitedUser.findOne({ email: data.email });

    if (existingUser) {
      return { status: "already_submitted", user: existingUser };
    }

    const newUser = await VisitedUser.create(data);
    return { status: "success", user: newUser };
  }
}
