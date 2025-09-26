import { Pool } from 'pg';
import { envConfigs } from './envConfig';
import logger from './logger';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../model/schema";


export const pool = new Pool({
  connectionString: envConfigs.dburl,
  max:10,
  ssl: {
    rejectUnauthorized: false, 
  },
});


export const connectDB = async () => {
  try {
    const client = await pool.connect();
    logger.info(`✅ PostgreSQL connected successfully`);
    client.release();
    return true;
  } catch (err: any) {
    logger.error(`❌ Error connecting to database: ${err.message}`);
    return false;
  }
};

const db:any = drizzle(pool,{
  schema:{...schema}
})

export default db;
