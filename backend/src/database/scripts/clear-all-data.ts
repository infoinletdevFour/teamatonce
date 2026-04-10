/**
 * Clear All Data Script
 *
 * This script deletes all records from all tables while preserving the schema.
 * Use this to start fresh with clean data.
 *
 * Usage: npm run clear:data
 */

// TODO: Replace with pg Pool
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

if (!process.env.DATABASE_SERVICE_KEY) {
  throw new Error('DATABASE_SERVICE_KEY is required');
}

const database = new databasePool(process.env.DATABASE_SERVICE_KEY, { debug: false });

console.log('🔧 database Configuration Loaded');

// List all tables in reverse order (to handle foreign key dependencies)
// Delete child tables first, then parent tables
const tables = [
  // Child tables first (with foreign keys)
  'task_comments',
  'task_attachments',
  'project_tasks',
  'milestone_deliverables',
  'adjustment_requests',
  'project_milestones',
  'milestone_plans',
  'project_members',
  'project_invitations',
  'payment_milestones',
  'payments',
  'invoices',
  'contracts',
  'contract_signatures',
  'project_proposals',
  'notifications',
  'messages',
  'conversations',
  'company_users',
  'team_invitations',
  'developer_profiles',
  'gig_applications',
  'gigs',
  'support_packages',
  'workspace_members',
  'workspaces',

  // Parent tables last
  'projects',
  'companies',
];

async function clearAllData() {
  console.log('🗑️  Starting data cleanup...\n');

  let totalDeleted = 0;
  const errors: string[] = [];

  for (const table of tables) {
    try {
      console.log(`📋 Processing table: ${table}`);

      // Query all records from the table
      const query = database.query.from(table).select('*');
      const result = await query.execute();
      const records = result.data || [];

      if (records.length === 0) {
        console.log(`   ✓ ${table}: Already empty`);
        continue;
      }

      console.log(`   🔄 Found ${records.length} records, deleting...`);

      // Delete all records one by one
      let deleted = 0;
      for (const record of records) {
        try {
          if (record.id) {
            await database.table(table).where('id', '=', record.id).delete();
            deleted++;
          }
        } catch (delError: any) {
          // Ignore individual delete errors, continue with others
          console.log(`     ⚠️  Could not delete record ${record.id}: ${delError.message}`);
        }
      }

      console.log(`   ✅ ${table}: Deleted ${deleted}/${records.length} records`);
      totalDeleted += deleted;
    } catch (error: any) {
      const errorMsg = `${table}: ${error.message || 'Unknown error'}`;
      errors.push(errorMsg);
      console.log(`   ❌ ${errorMsg}`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Data cleanup complete!`);
  console.log(`📊 Total records deleted: ${totalDeleted}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    errors.forEach((err) => console.log(`   - ${err}`));
  }

  console.log(`\n💡 Next step: Run migrations to ensure schema is up to date:`);
  console.log(`   npm run migrate`);
}

// Run the script
clearAllData()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  });
