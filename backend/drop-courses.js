#!/usr/bin/env node

const axios = require('axios');

async function dropCourseTables() {
  try {
    const apiKey = process.env.FLUXEZ_API_KEY || 'service_acf647031526eccc55b6af6795c5e8b4f68b073c22cb3751f9363ddf443aeb04';
    const baseURL = 'https://api.fluxez.com';

    console.log('🗑️  Dropping course-related tables...\n');

    // Drop tables in reverse order of dependencies
    const tablesToDrop = [
      'course_lessons',
      'course_chapters',
      'courses'
    ];

    for (const table of tablesToDrop) {
      try {
        await axios.post(
          `${baseURL}/api/v1/query-builder/execute`,
          {
            query: `DROP TABLE IF EXISTS ${table} CASCADE`
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          }
        );
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not drop ${table}: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n✅ Tables dropped successfully!');
    console.log('Now run: npm run migrate\n');
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

dropCourseTables();
