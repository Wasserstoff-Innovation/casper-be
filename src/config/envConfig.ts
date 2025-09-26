
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
})
const parsedEnv = envVariableSchema.parse(process.env);

export const envConfigs = {
  port : parsedEnv.PORT,
  node_env : parsedEnv.NODE_ENV,
  dburl : parsedEnv.DATABASE_URL, 
  jwt_secret : parsedEnv.JWT_SECRET,
  googleClientId : process.env.GOOGLE_CLIENT_ID,
  googleClientSecret : process.env.GOOGLE_CLIENT_SECRET,
  redirectUri : process.env.REDIRECT_URI,
  frontendUrl : process.env.FRONTEND_URL,
  accessExpirationMinutes : parseInt(parsedEnv.ACCESS_TOKEN_EXPIRY) || 60,
}