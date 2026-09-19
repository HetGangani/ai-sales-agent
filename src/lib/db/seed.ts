import { db } from './repository';
import { getDbPool } from './pool';
import fs from 'fs';
import path from 'path';

/**
 * Main database seed and migration executor
 */
export async function runDatabaseSeed() {
  console.log('🚀 [Seed Runner] Starting database initialization...');

  // 1. Initialize In-Memory DAL
  db.init();
  console.log('✅ [Seed Runner] In-memory repository initialized with Acme Technologies demo data:');
  console.log(`   - Organizations: ${db.organizations.size}`);
  console.log(`   - Users: ${db.users.size}`);
  console.log(`   - Products/Services: ${db.productsServices.size}`);
  console.log(`   - Leads & Opportunities: ${db.leads.size}`);
  console.log(`   - Campaigns: ${db.campaigns.size}`);
  console.log(`   - Calls & Transcripts: ${db.calls.size}`);

  // 2. If PostgreSQL connection exists, execute DDL and sync
  const pool = getDbPool();
  if (pool) {
    try {
      console.log('🐘 [Seed Runner] PostgreSQL connection detected. Running DDL migrations...');
      const migrationPath = path.join(process.cwd(), 'src/lib/db/migrations/001_initial_schema.sql');
      if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(sql);
        console.log('✅ [Seed Runner] PostgreSQL tables & indexes created successfully.');
      }
    } catch (err) {
      console.error('⚠️ [Seed Runner] PostgreSQL migration warning:', err instanceof Error ? err.message : String(err));
    }
  } else {
    console.log('ℹ️ [Seed Runner] DATABASE_URL not set; running in self-contained zero-config mode.');
  }

  console.log('🎉 [Seed Runner] Database seed completed successfully.');
}

if (require.main === module) {
  runDatabaseSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ [Seed Runner Error]:', err);
      process.exit(1);
    });
}
