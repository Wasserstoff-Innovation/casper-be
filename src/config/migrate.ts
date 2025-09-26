import 'dotenv/config'; 
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import db, { pool } from './db';
async function migrateData() {
  try {
    await migrate(db, { migrationsFolder: `./drizzle` });
    console.log("Migrations completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
    console.log("Database connection closed.");
  }
}

migrateData().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1); 
});
