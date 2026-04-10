#!/usr/bin/env node

// This script adds the new columns to the courses table using direct database access
// Run with: node add-course-columns.js

const { Pool } = require('pg');

async function addColumns() {
  // Connection string from Fluxez - you may need to update this
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/learning_os';

  const pool = new Pool({ connectionString });

  try {
    console.log('🔧 Adding new columns to courses table...\n');

    const alterCommands = [
      // Pricing columns
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS price NUMERIC", desc: "price column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS original_price NUMERIC", desc: "original_price column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD'", desc: "currency column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS refund_policy INTEGER", desc: "refund_policy column" },

      // Media columns
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS promo_video_url TEXT", desc: "promo_video_url column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS promo_video_type VARCHAR(20)", desc: "promo_video_type column" },

      // Array columns
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'", desc: "prerequisites column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_outcomes JSONB DEFAULT '[]'", desc: "learning_outcomes column" },

      // Feature flags
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS discussion_enabled BOOLEAN DEFAULT true", desc: "discussion_enabled column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS qna_enabled BOOLEAN DEFAULT true", desc: "qna_enabled column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS downloadable_resources BOOLEAN DEFAULT false", desc: "downloadable_resources column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS mobile_access BOOLEAN DEFAULT true", desc: "mobile_access column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS lifetime_access BOOLEAN DEFAULT true", desc: "lifetime_access column" },

      // Settings
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_settings JSONB DEFAULT '{}'", desc: "certificate_settings column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS publish_settings JSONB DEFAULT '{}'", desc: "publish_settings column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_settings JSONB DEFAULT '{}'", desc: "seo_settings column" },
      { sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS analytics JSONB DEFAULT '{\"views\":0,\"enrollments\":0,\"rating\":0,\"reviews\":0}'", desc: "analytics column" },

      // Course chapters (modules)
      { sql: "ALTER TABLE course_chapters ADD COLUMN IF NOT EXISTS module_order INTEGER", desc: "module_order column to course_chapters" },

      // Course lessons
      { sql: "ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS resource_url TEXT", desc: "resource_url column to course_lessons" },
      { sql: "ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS uploaded_file TEXT", desc: "uploaded_file column to course_lessons" },
    ];

    for (const { sql, desc } of alterCommands) {
      try {
        await pool.query(sql);
        console.log(`✅ Added ${desc}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Skipped ${desc} (already exists)`);
        } else {
          console.error(`❌ Error adding ${desc}:`, error.message);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addColumns();
