import { Request, Response } from "express";
import { envConfigs } from "../config/envConfig";
import axios from "axios";
import AuthService from "../services/auth";
import { generateAccessToken } from "../config/token";

export default class AuthController {
  static googleSignInSignUp = async (req: Request, res: Response) => {
    try {
      console.log("Google login initiated");
      const token = req.query.code as string;
      console.log("Received code:", token);

      if (!token) {
        return res.status(400).send({ status: false, message: "Token is required" });
      }

      // Exchange Google code for tokens
      const validateUser = await axios.post("https://oauth2.googleapis.com/token", {
        code: token,
        client_id: envConfigs.googleClientId,
        client_secret: envConfigs.googleClientSecret,
        redirect_uri: envConfigs.redirectUri,
        grant_type: "authorization_code",
      });

      const { access_token } = validateUser.data;

      // Fetch user info
      const { email, name, picture } = await axios
        .get("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
          headers: { Authorization: `Bearer ${access_token}` },
        })
        .then((res) => res.data);

      if (!email) throw new Error("Error fetching email, please try again");

      // Handle user in DB
      const { user, newSignUp } = await AuthService.authHandler({
        email,
        name,
        avatar_url: picture,
        provider: "google",
      });

      const message = newSignUp ? "User Signed Up Successfully" : "User Logged In Successfully";

      // 🔹 Generate access token
      const authToken = generateAccessToken(user.id);
      console.log("Generated Auth Token:", authToken);
      console.log("check url", envConfigs.frontendUrl);
      return res.redirect(`/${envConfigs.frontendUrl}/auth/callback/google?token=${authToken}&&email=${email}&&name=${name}&&avatar_url=${picture}`);
    } catch (error: any) {
      console.error("Google login error:", error.response?.data || error.message);
      return res.status(500).send({
        status: false,
        message: error.response?.data?.error_description || error.message,
      });
    }
  }

  static getUser = async (req: Request, res: Response) => {
    try {
      const user:any = req.user
      if (!req.user) return res.status(401).json({ error: "Unauthorized" })
      const userId = user.userId

      const userData = await AuthService.getUser(userId);

      if (!user) throw new Error("User not found");
      return res.status(200).send({
        status: true,
        message: "User found",
        data: userData,
      });
    } catch (error: any) {
      console.error("Error fetching user:", error.message);
      return res.status(500).send({
        status: false,
        message: error.message,
      });
    }
  }
}
