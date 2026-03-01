import { createPool } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

import * as schema from "./schema";

const connectionString =
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/postgres";
const pool = createPool({ connectionString });

export const db = drizzle(pool, { schema });

export { schema };
