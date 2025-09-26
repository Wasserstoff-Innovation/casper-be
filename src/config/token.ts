import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import { envConfigs } from "../config/envConfig";
import { TokenTypes } from "./utils";

// 🔹 Generate Access Token
export const generateAccessToken = (userId: number) => {
  const expiresInMinutes = envConfigs.accessExpirationMinutes || 60; // default 1h
  const exp = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;

  const accessToken = jwt.sign(
    {
      userId,
      type: TokenTypes.ACCESS,
      exp,
    },
    envConfigs.jwt_secret
  );

  return accessToken;
};

const jwtOptions = {
  secretOrKey: envConfigs.jwt_secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload: any, done: any) => {
  try {
    if (payload.type !== TokenTypes.ACCESS) {
      throw new Error("Invalid token type");
    }
    done(null, payload);
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
