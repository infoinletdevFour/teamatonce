/**
 * Learning OS Test Data Seeding Script
 * Populates the database with courses, enrollments, and transactions
 */

const { FluxezClient } = require('@fluxez/node-sdk');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const serviceKey = process.env.FLUXEZ_SERVICE_KEY || 'service_acf647031526eccc55b6af6795c5e8b4f68b073c22cb3751f9363ddf443aeb04';

if (!serviceKey) {
  console.error('FLUXEZ_SERVICE_KEY not found');
  process.exit(1);
}

const client = new FluxezClient(serviceKey);

// Get existing user IDs from auth
async function getExistingUsers() {
  const result = await client.auth.listUsers({ limit: 10 });
  return result.users || [];
}

async function seedCourses() {
  console.log('📚 Seeding courses...');

  const users = await getExistingUsers();
  if (users.length === 0) {
    console.log('⚠️ No users found. Please create users first.');
    return [];
  }

  const instructorId = users[0].id; // Use first user as instructor

  const courses = [
    {
      title: 'Introduction to JavaScript',
      description: 'Learn the fundamentals of JavaScript programming',
      category: 'Programming',
      level: 'beginner',
      pricing: { type: 'paid', amount: 49.99, currency: 'USD' },
      instructor_id: instructorId,
      thumbnail: 'https://picsum.photos/seed/js/400/300',
      duration: { total: 10, hours: 10, minutes: 0 },
      status: 'published',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      title: 'Advanced React Patterns',
      description: 'Master advanced React concepts and patterns',
      category: 'Programming',
      level: 'advanced',
      pricing: { type: 'paid', amount: 99.99, currency: 'USD' },
      instructor_id: instructorId,
      thumbnail: 'https://picsum.photos/seed/react/400/300',
      duration: { total: 20, hours: 20, minutes: 0 },
      status: 'published',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      title: 'UI/UX Design Fundamentals',
      description: 'Learn the basics of user interface and experience design',
      category: 'Design',
      level: 'beginner',
      pricing: { type: 'paid', amount: 59.99, currency: 'USD' },
      instructor_id: instructorId,
      thumbnail: 'https://picsum.photos/seed/design/400/300',
      duration: { total: 15, hours: 15, minutes: 0 },
      status: 'published',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      title: 'Python for Data Science',
      description: 'Master Python programming for data analysis',
      category: 'Data Science',
      level: 'intermediate',
      pricing: { type: 'paid', amount: 79.99, currency: 'USD' },
      instructor_id: instructorId,
      thumbnail: 'https://picsum.photos/seed/python/400/300',
      duration: { total: 25, hours: 25, minutes: 0 },
      status: 'published',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      title: 'Machine Learning Basics',
      description: 'Introduction to machine learning concepts',
      category: 'Data Science',
      level: 'intermediate',
      pricing: { type: 'paid', amount: 89.99, currency: 'USD' },
      instructor_id: instructorId,
      thumbnail: 'https://picsum.photos/seed/ml/400/300',
      duration: { total: 30, hours: 30, minutes: 0 },
      status: 'published',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      title: 'Digital Marketing Strategy',
      description: 'Learn effective digital marketing techniques',
      category: 'Marketing',
      level: 'beginner',
      pricing: { type: 'paid', amount: 69.99, currency: 'USD' },
      instructor_id: instructorId,
      thumbnail: 'https://picsum.photos/seed/marketing/400/300',
      duration: { total: 12, hours: 12, minutes: 0 },
      status: 'published',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      title: 'AWS Cloud Practitioner',
      description: 'Prepare for AWS certification',
      category: 'Cloud Computing',
      level: 'intermediate',
      pricing: { type: 'paid', amount: 129.99, currency: 'USD' },
      instructor_id: instructorId,
      thumbnail: 'https://picsum.photos/seed/aws/400/300',
      duration: { total: 40, hours: 40, minutes: 0 },
      status: 'published',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      title: 'Mobile App Development',
      description: 'Build mobile apps with React Native',
      category: 'Programming',
      level: 'intermediate',
      pricing: { type: 'paid', amount: 99.99, currency: 'USD' },
      instructor_id: instructorId,
      thumbnail: 'https://picsum.photos/seed/mobile/400/300',
      duration: { total: 35, hours: 35, minutes: 0 },
      status: 'published',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      title: 'SQL for Beginners',
      description: 'Learn database management with SQL',
      category: 'Database',
      level: 'beginner',
      pricing: { type: 'paid', amount: 39.99, currency: 'USD' },
      instructor_id: instructorId,
      thumbnail: 'https://picsum.photos/seed/sql/400/300',
      duration: { total: 8, hours: 8, minutes: 0 },
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      title: 'DevOps Essentials',
      description: 'Master DevOps tools and practices',
      category: 'DevOps',
      level: 'advanced',
      pricing: { type: 'paid', amount: 119.99, currency: 'USD' },
      instructor_id: instructorId,
      thumbnail: 'https://picsum.photos/seed/devops/400/300',
      duration: { total: 45, hours: 45, minutes: 0 },
      status: 'published',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const courseIds = [];
  for (const course of courses) {
    const result = await client.query.from('courses').insert(course).execute();
    const insertedCourse = result.data && result.data[0] ? result.data[0] : result;
    courseIds.push(insertedCourse.id);
    console.log(`  ✅ Created course: ${course.title}`);
  }

  return courseIds;
}

async function seedEnrollmentsAndTransactions(courseIds) {
  console.log('📝 Seeding enrollments and transactions...');

  const users = await getExistingUsers();
  if (users.length === 0 || courseIds.length === 0) {
    console.log('⚠️ No users or courses found');
    return;
  }

  // Create 10 enrollments with corresponding transactions
  const numEnrollments = 10;

  for (let i = 0; i < numEnrollments; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const courseId = courseIds[Math.floor(Math.random() * courseIds.length)];
    const daysAgo = Math.floor(Math.random() * 60); // Last 60 days
    const enrolledAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Get course details for price
    const courseResult = await client.query.from('courses').select('*').where({ id: courseId }).execute();
    const course = courseResult.data && courseResult.data[0] ? courseResult.data[0] : null;

    if (!course) continue;

    // Create enrollment
    const enrollment = {
      user_id: user.id,
      course_id: courseId,
      enrolled_at: enrolledAt,
      last_accessed_at: new Date(enrolledAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
      progress_percentage: Math.floor(Math.random() * 100),
      time_spent: Math.floor(Math.random() * 3600), // Random time in minutes
    };

    await client.query.from('learning_progress').insert(enrollment).execute();

    // Create corresponding transaction
    const amount = course.pricing && course.pricing.amount ? course.pricing.amount : 0;
    const transaction = {
      order_id: `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      student_id: user.id,
      course_id: courseId,
      instructor_id: course.instructor_id,
      type: 'course_purchase',
      amount: amount,
      currency: 'USD',
      status: 'completed',
      description: `Purchase of course: ${course.title}`,
      metadata: {
        course_id: courseId,
        course_title: course.title,
      },
      created_at: enrolledAt,
      processed_at: enrolledAt,
    };

    await client.query.from('transactions').insert(transaction).execute();
    console.log(`  ✅ Enrolled user ${user.email} in ${course.title}`);
  }
}

async function seedAll() {
  try {
    console.log('🌱 Starting Learning OS test data seeding...\n');

    const courseIds = await seedCourses();
    await seedEnrollmentsAndTransactions(courseIds);

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log('  - 10 courses created (9 published, 1 pending)');
    console.log('  - 10 enrollments created');
    console.log('  - 10 transactions created');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

async function clearAll() {
  console.log('🗑️ Clearing all test data...');

  try {
    await client.query.from('learning_progress').delete().neq('user_id', 'xxx').execute();
    console.log('  ✅ Cleared learning_progress');

    await client.query.from('transactions').delete().neq('user_id', 'xxx').execute();
    console.log('  ✅ Cleared transactions');

    await client.query.from('courses').delete().neq('id', 'xxx').execute();
    console.log('  ✅ Cleared courses');

    console.log('✅ Test data clearing completed');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
}

// CLI
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'seed':
      await seedAll();
      break;
    case 'clear':
      await clearAll();
      break;
    case 'reset':
      await clearAll();
      console.log('');
      await seedAll();
      break;
    default:
      console.log('Learning OS Test Data Seeder');
      console.log('');
      console.log('Usage: node seed-learning-data.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  seed   - Add test data');
      console.log('  clear  - Remove all test data');
      console.log('  reset  - Clear and reseed');
      process.exit(1);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
