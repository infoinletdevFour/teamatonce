import { databaseClient } from '@database/node-sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Seed Instructor User Script
 * Creates an instructor user for the Learning OS platform
 *
 * Usage:
 *   npm run seed:instructor
 *
 * Environment Variables:
 *   INSTRUCTOR_EMAIL - Email for instructor user (default: instructor@learningos.com)
 *   INSTRUCTOR_PASSWORD - Password for instructor user (default: Instructor@123456)
 *   INSTRUCTOR_NAME - Full name for instructor user (default: John Instructor)
 */

async function seedInstructor() {
  // Load environment variables from .env file
  dotenv.config({ path: path.resolve(__dirname, '../.env') });

  // Get database keys
  const serviceKey = process.env.DATABASE_API_KEY;
  const anonKey = process.env.DATABASE_ANON_KEY;

  if (!serviceKey || !anonKey) {
    console.error('❌ DATABASE_API_KEY and DATABASE_ANON_KEY must be set in .env');
    process.exit(1);
  }

  // Initialize database clients
  const serviceClient = new databaseClient(serviceKey);
  const authClient = new databaseClient(anonKey);

  // Get instructor credentials from environment or use defaults
  const instructorEmail = process.env.INSTRUCTOR_EMAIL || 'instructor@learningos.com';
  const instructorPassword = process.env.INSTRUCTOR_PASSWORD || '12345678';
  const instructorName = process.env.INSTRUCTOR_NAME || 'John Instructor';

  console.log('🚀 Starting instructor user seeding...');
  console.log('📧 Email:', instructorEmail);

  try {
    // Step 1: Try to register instructor user
    console.log('\n1️⃣  Creating instructor user account...');
    const response = await authClient.auth.register({
      email: instructorEmail,
      password: instructorPassword,
      name: instructorName,
    });

    if (!response || !response.user) {
      throw new Error('Failed to create instructor user - no user returned');
    }

    const userId = response.user.id;
    console.log('✅ Instructor user created with ID:', userId);

    // Step 2: Update user metadata with instructor role and permissions
    console.log('\n2️⃣  Setting instructor role and permissions...');

    // Learning-specific metadata for instructor
    const instructorMetadata = {
      role: 'instructor', // Store in metadata for custom logic
      permissions: [
        'create_courses',
        'edit_courses',
        'delete_courses',
        'view_analytics',
        'view_earnings',
        'manage_students',
        'respond_to_questions',
      ],
      is_instructor: true,
      created_by: 'system',
      created_via: 'seed_script',
      seeded_at: new Date().toISOString(),
      learning_level: 'expert',
      xp_points: 5000,
      current_streak: 0,
      longest_streak: 0,
      total_study_time: 0,
      preferred_language: 'en',
      timezone: 'UTC',
      learning_goals: ['teach_and_inspire', 'create_quality_content'],
      interests: ['education', 'technology', 'teaching', 'course_creation'],
      skills: {
        teaching: 95,
        course_creation: 90,
        content_development: 85,
        student_engagement: 90,
      },
      achievements: ['instructor_account_created', 'first_course_ready'],
      settings: {
        notifications_enabled: true,
        daily_reminder_time: '09:00',
        weekly_goal_hours: 20,
      },
      // Instructor-specific fields
      instructor_bio: 'Passionate educator with years of experience in online teaching.',
      instructor_expertise: ['Web Development', 'Programming', 'Software Engineering'],
      instructor_verified: true,
      total_students: 0,
      total_courses: 0,
      average_rating: 0,
    };

    // System-level metadata (database's built-in system for roles)
    const instructorAppMetadata = {
      role: 'instructor', // Store in app_metadata (database native way)
      permissions: [
        'create_courses',
        'edit_courses',
        'delete_courses',
        'view_analytics',
        'view_earnings',
      ],
      is_instructor: true,
    };

    await serviceClient.auth.updateUser(userId, {
      metadata: instructorMetadata, // User-editable metadata
      app_metadata: instructorAppMetadata, // System-level metadata (not editable by user)
    });

    console.log('✅ Instructor role and permissions set in both metadata and app_metadata');

    // Step 3: Create instructor profile in instructors table (optional)
    console.log('\n3️⃣  Creating instructor profile in database...');

    try {
      const instructorProfile = {
        id: crypto.randomUUID(),
        user_id: userId,
        display_name: instructorName,
        bio: 'Passionate educator with years of experience in online teaching.',
        expertise: ['Web Development', 'Programming', 'Software Engineering'],
        hourly_rate: 50.00,
        currency: 'USD',
        availability: {
          monday: ['09:00-17:00'],
          tuesday: ['09:00-17:00'],
          wednesday: ['09:00-17:00'],
          thursday: ['09:00-17:00'],
          friday: ['09:00-17:00'],
        },
        timezone: 'UTC',
        languages: ['English'],
        video_intro_url: null,
        credentials: ['Certified Professional Educator', 'Software Engineering Degree'],
        total_students: 0,
        total_sessions: 0,
        average_rating: 0,
        response_time: '< 1 hour',
        verification_status: 'verified',
        is_accepting_students: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await serviceClient.query
        .from('instructors')
        .insert(instructorProfile)
        .execute();

      console.log('✅ Instructor profile created in database');
    } catch (dbError: any) {
      console.log('⚠️  Could not create instructor profile in database');
      console.log('   This is optional - the instructor can still access the platform');
      console.log('   Error:', dbError.message);
    }

    // Step 4: Success summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ INSTRUCTOR USER SEEDED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📋 Instructor Credentials:');
    console.log('   Email:    ', instructorEmail);
    console.log('   Password: ', instructorPassword);
    console.log('   Name:     ', instructorName);
    console.log('   User ID:  ', userId);
    console.log('   Role:     ', 'instructor');
    console.log('\n🎓 Instructor Permissions:');
    console.log('   ✅ Create courses');
    console.log('   ✅ Edit courses');
    console.log('   ✅ Delete courses');
    console.log('   ✅ View analytics');
    console.log('   ✅ View earnings');
    console.log('   ✅ Manage students');
    console.log('   ❌ NO admin access');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🔗 Login at: http://localhost:5173/auth/login');
    console.log('🎯 Instructor Dashboard: http://localhost:5173/instructor/dashboard');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error seeding instructor user:');

    // Handle "user already exists" error
    if (
      error.message?.includes('already exists') ||
      error.message?.includes('duplicate') ||
      error.response?.data?.message?.includes('already')
    ) {
      console.log('\n⚠️  Instructor user already exists!');
      console.log('📧 Email:', instructorEmail);

      try {
        console.log('\n3️⃣  Attempting to update existing user role...');
        console.log('ℹ️  Cannot automatically update existing user role via database SDK');
        console.log('ℹ️  Please use one of these options:');
        console.log('   1. Delete the existing user and run this script again');
        console.log('   2. Manually update the user metadata in database dashboard');
        console.log('   3. Use a different email address (set INSTRUCTOR_EMAIL env var)');

        process.exit(1);
      } catch (updateError) {
        console.error('❌ Could not update existing user:', updateError);
        process.exit(1);
      }
    } else {
      // Other errors
      console.error('Error details:', error.message);
      if (error.response?.data) {
        console.error('API Response:', JSON.stringify(error.response.data, null, 2));
      }
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Check if DATABASE_API_KEY and DATABASE_ANON_KEY are set in .env');
      console.log('   2. Verify database service is accessible');
      console.log('   3. Check if the password meets requirements (min 6 chars)');
      console.log('   4. Review backend logs for more details');

      process.exit(1);
    }
  }
}

// Run the seeding function
seedInstructor();
