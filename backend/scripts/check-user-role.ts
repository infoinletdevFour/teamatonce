import { databaseClient } from '@database/node-sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceKey = process.env.DATABASE_SERVICE_KEY;

if (!serviceKey) {
  console.error('DATABASE_SERVICE_KEY not found in environment variables');
  console.error('Current working directory:', process.cwd());
  console.error('Script directory:', __dirname);
  process.exit(1);
}

async function checkUserRole() {
  const client = new databaseClient(serviceKey);

  // Get email from command line or use default
  const userEmail = process.argv[2] || 'user4@example.com';

  console.log(`\nChecking role for user: ${userEmail}\n`);

  try {
    // List all users to find the one with this email
    const result = await client.auth.listUsers();
    const user = result.users?.find((u: any) => u.email === userEmail);

    if (!user) {
      console.error(`User with email ${userEmail} not found`);
      console.log('\nAvailable users:');
      result.users?.forEach((u: any) => {
        console.log(`  - ${u.email} (ID: ${u.id})`);
      });
      process.exit(1);
    }

    console.log('User found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('\nMetadata:', JSON.stringify(user.metadata, null, 2));
    console.log('\nApp Metadata:', JSON.stringify(user.app_metadata, null, 2));
    console.log('\nRole from metadata:', user.metadata?.role || 'NOT SET');
    console.log('Role from app_metadata:', user.app_metadata?.role || 'NOT SET');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUserRole();
