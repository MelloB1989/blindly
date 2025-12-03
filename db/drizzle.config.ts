import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
  dbCredentials: {
    host: "10.2.0.130",
    user: "mellob",
    password: "mellob1989",
    database: "lyzn-prod",
    // database: "n8n",
    port: 5432,
    ssl: false,
  },
  // dbCredentials: {
  //   host: "ep-gentle-boat-a83pm7ga-pooler.eastus2.azure.neon.tech",
  //   user: "neondb_owner",
  //   password: "npg_xasbqiC9r2NS",
  //   database: "neondb",
  //   ssl: true,
  // },
} satisfies Config;
