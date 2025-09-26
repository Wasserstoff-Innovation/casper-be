import {envConfigs} from './src/config/envConfig';

console.log("Using the following environment configurations:" ,envConfigs.dburl);
export default ({
  dialect: "postgresql", 
  schema: "./src/model/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // host: envConfigs.db.host,
    // user: envConfigs.db.user,
    // password: envConfigs.db.password,
    // database: envConfigs.db.database,
    // port: envConfigs.db.port,
    // ssl: true ,
    url:envConfigs.dburl+ '?sslmode=require'
  },
});