import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun ./prisma/seed.ts",
  },
  datasource: {
    url: "postgresql://postgres.eidcvnmxnodhkeywigfq:JK4I60hhXFsOTsNN%40%40@db.eidcvnmxnodhkeywigfq.supabase.co:5432/postgres",
  },
});
