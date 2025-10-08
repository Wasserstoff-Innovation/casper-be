import AppleAuth, { AppleAuthConfig } from 'apple-auth';
import fs from 'fs';
import path from 'path';
import { envConfigs } from './envConfig';

const privateKey = fs.readFileSync(path.join(__dirname, '../config/AuthKey_PA2257KZH7.p8')).toString();
const config: AppleAuthConfig = {
  client_id: envConfigs.appleClientId,
  team_id: envConfigs.appleTeamId,
  key_id: envConfigs.appleKeyId,
  redirect_uri: envConfigs.appleRedirectUri,
  scope: envConfigs.scope,
};

export const appleAuth = new AppleAuth(config, privateKey, 'text');
