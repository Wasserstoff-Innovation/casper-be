
import { z } from 'zod';
import * as dotenv from "dotenv";
import { access } from 'fs';
dotenv.config();

const envVariableSchema = z.object({
  PORT: z.string().default('3000').transform((val)=> parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(10, { message: 'JWT_SECRET must be at least 10 characters long' }),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  REDIRECT_URI: z.string(),
  FRONTEND_URL: z.string(),
  ACCESS_TOKEN_EXPIRY: z.string().default('60m'),
  AI_BACKEND_URL: z.string(),
  APPLE_CLIENT_ID: z.string(),
  APPLE_TEAM_ID: z.string(),
  APPLE_KEY_ID: z.string(),
  APPLE_REDIRECT_URI: z.string(),
  SCOPE: z.string().default('name email'),
  AI_IMAGE_GENERATION_URL: z.string(),
  AI_TEXT_GENERATION_URL: z.string(),
})
const parsedEnv = envVariableSchema.parse(process.env);

export const envConfigs = {
  port : parsedEnv.PORT,
  node_env : parsedEnv.NODE_ENV,
  dburl : parsedEnv.DATABASE_URL, 
  jwt_secret : parsedEnv.JWT_SECRET,
  googleClientId : parsedEnv.GOOGLE_CLIENT_ID,
  googleClientSecret : parsedEnv.GOOGLE_CLIENT_SECRET,
  redirectUri : parsedEnv.REDIRECT_URI,
  frontendUrl : parsedEnv.FRONTEND_URL,
  accessExpirationMinutes : parseInt(parsedEnv.ACCESS_TOKEN_EXPIRY) || 60,
  aiBackendUrl : parsedEnv.AI_BACKEND_URL,
  appleClientId : parsedEnv.APPLE_CLIENT_ID,
  appleTeamId : parsedEnv.APPLE_TEAM_ID,
  appleKeyId : parsedEnv.APPLE_KEY_ID,
  appleRedirectUri : parsedEnv.APPLE_REDIRECT_URI,
  scope : parsedEnv.SCOPE,
  aiImageGenerationUrl : parsedEnv.AI_IMAGE_GENERATION_URL,
  aiTextGenerationUrl : parsedEnv.AI_TEXT_GENERATION_URL,
}