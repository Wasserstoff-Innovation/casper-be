import { Request, Response } from "express";
import { envConfigs } from "../config/envConfig";
import axios from "axios";
import AuthService from "../services/auth";
import { generateAccessToken } from "../config/token";
import { appleAuth } from "../config/appleAuth";
import jwt from "jsonwebtoken";

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
      return res.redirect(`${envConfigs.frontendUrl}/auth/callback/google?token=${authToken}&&email=${email}&&name=${name}&&avatar_url=${picture}`);
    } catch (error: any) {
      console.error("Google login error:", error.response?.data || error.message);
      return res.status(500).send({
        status: false,
        message: error.response?.data?.error_description || error.message,
      });
    }
  }

  static appleSignIn = async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      if (!code) return res.status(400).send({ status: false, message: 'Code is required' });

      // Exchange code for Apple tokens
      const accessToken = await appleAuth.accessToken(code);
      const idToken = jwt.decode(accessToken.id_token) as any;

      if (!idToken.email) throw new Error('Unable to fetch email from Apple');

      const { user, newSignUp } = await AuthService.authHandler({
        email: idToken.email,
        name: `${idToken?.name?.firstName || ''} ${idToken?.name?.lastName || ''}`.trim(),
        provider: 'apple'
      });

      // const authToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
      const authToken = generateAccessToken(user.id);

      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback/apple?token=${authToken}&email=${user.email}&name=${user.name}`;
      return res.redirect(redirectUrl);

    } catch (err: any) {
      console.error('Apple login error:', err.message);
      return res.status(500).send({ status: false, message: err.message });
    }
  };


  static getUser = async (req: Request, res: Response) => {
    try {
      const user: any = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: user not authenticated",
          error: { code: "UNAUTHORIZED" },
        });
      }

      const userId = user.userId;
      console.log("userId................................", userId);

      const userData = await AuthService.getUser(userId);
      console.log("userData................................", userData);

      return res.status(200).json({
        success: true,
        message: userData.length === 0 ? "No user data found" : "User data fetched successfully",
        data: userData,
      });

    } catch (error: any) {
      console.error("Error fetching user:", error.message || error);
      return res.status(500).json({
        success: false,
        message: "Error fetching user data",
        error: {
          code: "USER_FETCH_ERROR",
          details: error.message,
        },
      });
    }
  };

  static getCalendarData = async (req: Request, res: Response) => {
    try {
      const user: any = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: user not authenticated",
          error: { code: "UNAUTHORIZED" },
        });
      }

      const userId = user.userId;
      const { profileId } = req.body;

      console.log("userId and profileId", userId, profileId);

      if (!userId || !profileId) {
        return res.status(400).json({
          success: false,
          message: "userId and profileId are required",
          error: { code: "MISSING_PARAMETERS" },
        });
      }

      const calendarData = await AuthService.getCalendarData(userId, profileId);

      return res.status(200).json({
        success: true,
        message: calendarData.length === 0 ? "No calendar data found" : "Calendar data fetched successfully",
        data: calendarData,
      });

    } catch (error: any) {
      console.error("Error fetching calendar data:", error.message || error);
      return res.status(500).json({
        success: false,
        message: "Error fetching calendar data",
        error: {
          code: "CALENDAR_FETCH_ERROR",
          details: error.message,
        },
      });
    }
  };

}
