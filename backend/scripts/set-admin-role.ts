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

async function setAdminRole() {
  const client = new databaseClient(serviceKey);

  // Get email and role from command line
  const userEmail = process.argv[2] || 'user4@example.com';
  const newRole = process.argv[3] || 'super_admin';

  console.log(`\nSetting role for user: ${userEmail} to: ${newRole}\n`);

  try {
    // List all users to find the one with this email
    const result = await client.auth.listUsers();
    const user = result.users?.find((u: any) => u.email === userEmail);

    if (!user) {
      console.error(`User with email ${userEmail} not found`);
      process.exit(1);
    }

    console.log('User found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Current role in metadata:', user.metadata?.role || 'NOT SET');

    // Update user metadata with new role
    await client.auth.updateUser(user.id, {
      metadata: {
        ...(user.metadata || {}),
        role: newRole,
      },
      app_metadata: {
        ...(user.app_metadata || {}),
        role: newRole,
      },
    });

    console.log(`\n✅ Successfully updated role to: ${newRole}`);

    // Verify the update
    const updatedUsers = await client.auth.listUsers();
    const updatedUser = updatedUsers.users?.find((u: any) => u.id === user.id);

    console.log('\nVerification:');
    console.log('  Role in metadata:', updatedUser?.metadata?.role);
    console.log('  Role in app_metadata:', updatedUser?.app_metadata?.role);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

setAdminRole();
