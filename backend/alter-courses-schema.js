#!/usr/bin/env node

const axios = require('axios');

async function alterCoursesSchema() {
  try {
    const apiKey = process.env.FLUXEZ_API_KEY || 'service_acf647031526eccc55b6af6795c5e8b4f68b073c22cb3751f9363ddf443aeb04';
    const baseURL = 'https://api.fluxez.com';

    console.log('🔧 Altering courses table schema...\n');

    // SQL commands to add missing columns
    const alterCommands = [
      // Pricing columns
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS price NUMERIC",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS original_price NUMERIC",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD'",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS refund_policy INTEGER",

      // Media columns
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS promo_video_url TEXT",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS promo_video_type VARCHAR(20)",

      // Array columns
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_outcomes JSONB DEFAULT '[]'",

      // Feature flags
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS discussion_enabled BOOLEAN DEFAULT true",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS qna_enabled BOOLEAN DEFAULT true",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS downloadable_resources BOOLEAN DEFAULT false",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS mobile_access BOOLEAN DEFAULT true",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS lifetime_access BOOLEAN DEFAULT true",

      // Settings
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_settings JSONB DEFAULT '{}'",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS publish_settings JSONB DEFAULT '{}'",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_settings JSONB DEFAULT '{}'",
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS analytics JSONB DEFAULT '{\"views\":0,\"enrollments\":0,\"rating\":0,\"reviews\":0}'",

      // Course chapters (modules)
      "ALTER TABLE course_chapters ADD COLUMN IF NOT EXISTS module_order INTEGER",

      // Course lessons
      "ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS resource_url TEXT",
      "ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS uploaded_file TEXT",
      "ALTER TABLE course_lessons ALTER COLUMN duration TYPE VARCHAR(50)"
    ];

    for (const sql of alterCommands) {
      try {
        // Try using the schema/migrate endpoint with raw SQL
        await axios.post(
          `${baseURL}/api/v1/schema/migrate`,
          {
            schema: {},
            rawSQL: sql
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          }
        );
        console.log(`✅ Executed: ${sql.substring(0, 60)}...`);
      } catch (error) {
        // Ignore errors for columns that already exist
        if (!error.response?.data?.message?.includes('already exists')) {
          console.log(`⚠️  Warning: ${error.response?.data?.message || error.message}`);
        }
      }
    }

    console.log('\n✅ Schema alterations completed!');
    console.log('Try creating a course now.\n');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

alterCoursesSchema();
