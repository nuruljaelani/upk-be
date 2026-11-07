import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema/index.js";
import { env } from "../config/env.js";

// Menggunakan Neon Pool (WebSockets) untuk mendukung interactive transactions (db.transaction)
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle({ client: pool, schema });
