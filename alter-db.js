import { Client } from 'pg';

const connectionString = "postgresql://postgres.eidcvnmxnodhkeywigfq:JK4I60hhXFsOTsNN%40%40@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('ALTER TABLE "WorkerProfile" ADD COLUMN IF NOT EXISTS "aadhaarNumber" TEXT;');
    console.log('Successfully added aadhaarNumber column.');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await client.end();
  }
}

main();
