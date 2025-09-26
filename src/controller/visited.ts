import { Request, Response } from "express";
import { VisitedUserService } from "../services/visited";

export class VisitedUserController {
  static async create(req: Request, res: Response) {
    try {
      const result = await VisitedUserService.createVisitedUser(req.body);

      if (result.status === "already_submitted") {
        return res.status(200).json({
          message: "Already submitted",
          user: result.user,
        });
      }

      return res.status(201).json({
        message: "User created successfully",
        user: result.user,
      });
    } catch (error) {
      console.error("❌ Error creating visited user:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}
