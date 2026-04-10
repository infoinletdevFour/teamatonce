import { databaseClient } from '@database/node-sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Seed Courses Script
 * Creates sample courses for the existing instructor
 *
 * Usage:
 *   npm run seed:courses
 */

async function seedCourses() {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });

  const serviceKey = process.env.DATABASE_API_KEY;

  if (!serviceKey) {
    console.error('❌ DATABASE_API_KEY must be set in .env');
    process.exit(1);
  }

  const database = new databaseClient(serviceKey);

  console.log('🚀 Starting courses seeding...');

  try {
    // Get the instructor profile
    console.log('\n1️⃣  Finding instructor profile...');
    const result = await database.query
      .from('instructors')
      .limit(1)
      .execute();

    if (!result || !result.data || result.data.length === 0) {
      throw new Error('No instructor found. Please run seed:instructor first.');
    }

    const instructor = result.data[0];
    const instructorId = instructor.id;
    console.log('✅ Found instructor:', instructor.display_name);

    // Define 3 courses
    const courses = [
      {
        id: crypto.randomUUID(),
        title: 'Complete Web Development Bootcamp 2025',
        subtitle: 'From Zero to Full Stack Developer in 12 Weeks',
        description: 'Master modern web development with HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build real-world projects and deploy them to production. Perfect for beginners who want to become professional web developers.',
        short_description: 'Learn web development from scratch with hands-on projects',
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
        trailer: null,
        instructor_id: instructorId,
        category: 'Web Development',
        subcategory: 'Full Stack',
        level: 'beginner',
        language: 'en',
        tags: ['web development', 'javascript', 'react', 'node.js', 'full stack', 'bootcamp'],
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
        subtitles: ['en', 'es', 'fr'],
        duration: {
          total: 43200, // 720 hours in minutes
          lectures: 156,
          articles: 24,
          downloadableResources: 48
        },
        rating: {
          average: 4.7,
          count: 2341,
          distribution: {
            '5': 1650,
            '4': 520,
            '3': 121,
            '2': 35,
            '1': 15
          }
        },
        pricing: {
          type: 'paid',
          currency: 'USD',
          price: 89.99,
          discountPrice: 49.99,
          discountExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        enrollment: {
          studentsCount: 12543,
          completionRate: 68,
          averageRating: 4.7
        },
        requirements: [
          'A computer with internet connection',
          'No prior programming experience required',
          'Willingness to learn and practice daily'
        ],
        learning_objectives: [
          'Build responsive websites from scratch',
          'Master JavaScript and modern ES6+ features',
          'Create full-stack applications with React and Node.js',
          'Deploy applications to cloud platforms',
          'Work with databases and APIs',
          'Use Git for version control'
        ],
        target_audience: [
          'Beginners who want to learn web development',
          'Career switchers looking to enter tech',
          'Entrepreneurs who want to build their own websites',
          'Students preparing for tech interviews'
        ],
        features: [
          'Lifetime access',
          'Certificate of completion',
          '30-day money-back guarantee',
          'Q&A support',
          'Downloadable resources'
        ],
        status: 'published',
        certificate: true,
        bundle_id: null,
        ai_recommendation_score: 95.5,
        ai_recommendation_reasons: [
          'Highly rated by students',
          'Comprehensive curriculum',
          'Active instructor support',
          'Recent content updates'
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: 'Advanced React & TypeScript Masterclass',
        subtitle: 'Build Enterprise-Grade Applications',
        description: 'Deep dive into advanced React patterns, TypeScript best practices, state management with Redux, testing, and performance optimization. Learn to build scalable, maintainable applications used by top tech companies.',
        short_description: 'Master advanced React and TypeScript for enterprise apps',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
        trailer: null,
        instructor_id: instructorId,
        category: 'Programming',
        subcategory: 'Frontend Development',
        level: 'advanced',
        language: 'en',
        tags: ['react', 'typescript', 'redux', 'testing', 'advanced', 'frontend'],
        skills: ['React', 'TypeScript', 'Redux', 'Jest', 'Testing Library', 'Performance Optimization'],
        subtitles: ['en'],
        duration: {
          total: 28800, // 480 hours in minutes
          lectures: 98,
          articles: 15,
          downloadableResources: 32
        },
        rating: {
          average: 4.9,
          count: 856,
          distribution: {
            '5': 742,
            '4': 98,
            '3': 12,
            '2': 3,
            '1': 1
          }
        },
        pricing: {
          type: 'paid',
          currency: 'USD',
          price: 129.99,
          discountPrice: 79.99,
          discountExpiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        enrollment: {
          studentsCount: 3421,
          completionRate: 72,
          averageRating: 4.9
        },
        requirements: [
          'Solid understanding of JavaScript and React basics',
          'Experience building React applications',
          'Familiarity with modern development tools'
        ],
        learning_objectives: [
          'Master advanced React patterns and hooks',
          'Build type-safe applications with TypeScript',
          'Implement complex state management with Redux',
          'Write comprehensive tests for React apps',
          'Optimize performance for production',
          'Follow enterprise-level best practices'
        ],
        target_audience: [
          'Intermediate React developers',
          'Frontend engineers at tech companies',
          'Developers preparing for senior roles',
          'Teams adopting TypeScript'
        ],
        features: [
          'Lifetime access',
          'Certificate of completion',
          'Code reviews',
          'Private community access',
          'Interview preparation materials'
        ],
        status: 'published',
        certificate: true,
        bundle_id: null,
        ai_recommendation_score: 98.2,
        ai_recommendation_reasons: [
          'Expert-level content',
          'High completion rate',
          'Excellent student feedback',
          'Industry-relevant skills'
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: 'Python for Data Science & Machine Learning',
        subtitle: 'Complete Data Science Bootcamp with Real Projects',
        description: 'Learn Python programming, data analysis with Pandas, data visualization, machine learning with scikit-learn, and deep learning basics. Build portfolio projects and prepare for data science roles.',
        short_description: 'Master Python, data science, and machine learning',
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
        trailer: null,
        instructor_id: instructorId,
        category: 'Data Science',
        subcategory: 'Machine Learning',
        level: 'intermediate',
        language: 'en',
        tags: ['python', 'data science', 'machine learning', 'pandas', 'numpy', 'scikit-learn'],
        skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Scikit-learn', 'Data Analysis', 'ML'],
        subtitles: ['en', 'es'],
        duration: {
          total: 36000, // 600 hours in minutes
          lectures: 124,
          articles: 18,
          downloadableResources: 56
        },
        rating: {
          average: 4.8,
          count: 1567,
          distribution: {
            '5': 1203,
            '4': 289,
            '3': 54,
            '2': 15,
            '1': 6
          }
        },
        pricing: {
          type: 'paid',
          currency: 'USD',
          price: 99.99,
          discountPrice: 59.99,
          discountExpiry: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        enrollment: {
          studentsCount: 8765,
          completionRate: 65,
          averageRating: 4.8
        },
        requirements: [
          'Basic programming knowledge is helpful but not required',
          'Computer with Python installed',
          'Interest in data and analytics'
        ],
        learning_objectives: [
          'Master Python programming fundamentals',
          'Perform data analysis with Pandas and NumPy',
          'Create stunning visualizations',
          'Build machine learning models',
          'Understand ML algorithms deeply',
          'Complete real-world data science projects'
        ],
        target_audience: [
          'Aspiring data scientists',
          'Python developers entering ML',
          'Business analysts upgrading skills',
          'Students exploring data careers'
        ],
        features: [
          'Lifetime access',
          'Certificate of completion',
          'Jupyter notebooks included',
          'Dataset library',
          'Capstone project'
        ],
        status: 'published',
        certificate: true,
        bundle_id: null,
        ai_recommendation_score: 92.8,
        ai_recommendation_reasons: [
          'High demand field',
          'Practical projects',
          'Strong student outcomes',
          'Comprehensive content'
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      }
    ];

    // Insert courses
    console.log('\n2️⃣  Creating courses...');
    for (const course of courses) {
      await database.query
        .from('courses')
        .insert(course)
        .execute();
      console.log(`✅ Created: ${course.title}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ COURSES SEEDED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`\n📚 Created ${courses.length} courses for instructor: ${instructor.display_name}`);
    console.log('\nCourses:');
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   Level: ${course.level} | Students: ${course.enrollment.studentsCount} | Rating: ${course.rating.average}⭐`);
    });
    console.log('\n' + '='.repeat(60) + '\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error seeding courses:', error.message);
    process.exit(1);
  }
}

seedCourses();
