import { Injectable } from '@nestjs/common';

@Injectable()
export class LandingService {
  async getLandingPageData() {
    // This returns all the data needed for the landing page in a single response
    return {
      hero: {
        title: 'Your Complete Life Management System',
        subtitle: 'Manage health, fitness, finance, and more in one place',
        features: [
          'AI-Powered Insights',
          'Real-time Tracking',
          'Personalized Recommendations',
          'Privacy-First Approach'
        ]
      },
      apps: [
        {
          category: 'Finance & Nutrition',
          apps: [
            {
              id: 'money-management',
              name: 'Money Management',
              icon: 'AttachMoney',
              link: '/expense-tracker',
              description: 'Track expenses and manage budgets',
              color: '#10b981' // emerald-500
            },
            {
              id: 'nutrition-tracker',
              name: 'AI Nutrition Tracker',
              icon: 'Restaurant',
              link: '/calories-tracker',
              description: 'Track calories and nutrition with AI',
              color: '#f97316' // orange-500
            }
          ]
        },
        {
          category: 'Fitness & Health',
          apps: [
            {
              id: 'workout-planner',
              name: 'AI Workout Planner',
              icon: 'FitnessCenter',
              link: '/fitness',
              description: 'Personalized workout plans',
              color: '#3b82f6' // blue-500
            },
            {
              id: 'health-fitness',
              name: 'Health & Fitness',
              icon: 'Favorite',
              link: '/health',
              description: 'Track health metrics and records',
              color: '#ec4899' // pink-500
            }
          ]
        },
        {
          category: 'Mental Wellness',
          apps: [
            {
              id: 'meditation-guide',
              name: 'AI Meditation Guide',
              icon: 'SelfImprovement',
              link: '/meditation',
              description: 'Guided meditation sessions',
              color: '#a855f7' // purple-500
            },
            {
              id: 'mental-health',
              name: 'AI Mental Health Journal',
              icon: 'Psychology',
              link: '/mental-health',
              description: 'Track mood and mental wellness',
              color: '#14b8a6' // teal-500
            }
          ]
        },
        {
          category: 'Travel Planning',
          apps: [
            {
              id: 'travel-planner',
              name: 'AI Travel Planner',
              icon: 'FlightTakeoff',
              link: '/travel-planner',
              description: 'Plan trips with AI assistance',
              color: '#0ea5e9' // sky-500
            },
            {
              id: 'expense-tracker-travel',
              name: 'Expense Tracker',
              icon: 'Receipt',
              link: '/expense-tracker',
              description: 'Track travel expenses',
              color: '#6366f1' // indigo-500
            }
          ]
        }
      ],
      stats: {
        totalUsers: '10,000+',
        activeFeatures: '12',
        dataProcessed: '1M+',
        satisfaction: '98%'
      },
      features: [
        {
          title: 'All-in-One Platform',
          description: 'Manage every aspect of your life from a single dashboard',
          icon: 'Dashboard'
        },
        {
          title: 'AI-Powered',
          description: 'Get intelligent insights and recommendations',
          icon: 'AutoAwesome'
        },
        {
          title: 'Privacy First',
          description: 'Your data is encrypted and never shared',
          icon: 'Lock'
        },
        {
          title: 'Real-time Sync',
          description: 'Access your data from any device, anywhere',
          icon: 'Sync'
        }
      ],
      pricing: [
        {
          name: 'Free',
          price: 0,
          period: 'forever',
          features: [
            'Basic health tracking',
            'Up to 3 fitness plans',
            'Budget tracking',
            'Limited AI features'
          ],
          recommended: false
        },
        {
          name: 'Pro',
          price: 9.99,
          period: 'month',
          features: [
            'Unlimited everything',
            'Advanced AI features',
            'Priority support',
            'Data export',
            'Custom integrations'
          ],
          recommended: true
        },
        {
          name: 'Team',
          price: 29.99,
          period: 'month',
          features: [
            'Everything in Pro',
            'Up to 5 team members',
            'Team analytics',
            'Admin controls',
            'API access'
          ],
          recommended: false
        }
      ]
    };
  }
}