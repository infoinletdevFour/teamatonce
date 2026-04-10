/**
 * Script to check and fix user role
 *
 * Usage:
 * node fix-user-role.js <email>
 *
 * Example:
 * node fix-user-role.js infoinlet.debug2@gmail.com
 */

const { FluxezClient } = require('@fluxez/node-sdk');
require('dotenv').config();

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node fix-user-role.js <email>');
  process.exit(1);
}

async function main() {
  try {
    console.log('🔍 Checking user role for:', email);
    console.log('');

    console.log('ℹ️  This script is not needed anymore!');
    console.log('');
    console.log('✅ The backend now automatically fixes user roles on sign-in.');
    console.log('');
    console.log('📋 What to do:');
    console.log('   1. Start your backend server (npm run start:dev)');
    console.log('   2. Go to http://localhost:5176/auth/login');
    console.log('   3. Click "Sign in with Google"');
    console.log('   4. The backend will automatically detect if you have an invalid role');
    console.log('   5. If you have companies, it will update your role to "client"');
    console.log('   6. You will be redirected to your dashboard');
    console.log('');
    console.log('📊 Check backend console logs for:');
    console.log('   [AuthService] User profile role: user');
    console.log('   [AuthService] User has companies: 2');
    console.log('   [AuthService] User has \'user\' role but has companies - inferring role as \'client\'');
    console.log('');
    console.log('🎉 The fix is automatic - just sign in with Google!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
