/**
 * Landing Page Data Configuration
 * Contains all data structures for the hero slider and visual mockups
 */

export interface HeroSlide {
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  visual: 'search' | 'dashboard' | 'payment' | 'global';
  stats: string[];
}

export interface Developer {
  name: string;
  role: string;
  rate: string;
}

export interface DashboardColumn {
  status: string;
  color: 'blue' | 'purple' | 'green';
  tasks: string[];
}

export interface Milestone {
  milestone: string;
  amount: string;
  status: string;
  color: 'green' | 'blue' | 'gray';
}

export interface Location {
  name: string;
  time: string;
  flag: string;
  color: 'red' | 'blue' | 'purple' | 'green';
}

// Hero slides configuration
export const heroSlides: HeroSlide[] = [
  {
    title: "AI Matches Perfect Developers",
    subtitle: "In Under 2 Minutes",
    description: "Type your project needs naturally. Our AI instantly finds developers with exact skills.",
    gradient: "from-sky-800 via-sky-700 to-sky-600",
    visual: "search",
    stats: ["10K+ Developers", "50+ Technologies", "95% Match Rate"]
  },
  {
    title: "All-In-One Project Hub",
    subtitle: "From Chat to Payment",
    description: "Manage everything: Kanban boards, time tracking, video calls, files - no switching tools.",
    gradient: "from-sky-800 via-sky-700 to-sky-600",
    visual: "dashboard",
    stats: ["Kanban Boards", "Time Tracking", "Team Chat"]
  },
  {
    title: "Secure Milestone Payments",
    subtitle: "Pay As You Progress",
    description: "Funds held in escrow. Release payments by milestone. Multi-currency. Automatic invoicing.",
    gradient: "from-sky-800 via-sky-700 to-sky-600",
    visual: "payment",
    stats: ["Escrow Protected", "170+ Countries", "Auto Invoicing"]
  },
  {
    title: "Built for Global Teams",
    subtitle: "Work From Anywhere",
    description: "Automatic timezone detection. Multi-language support. Real-time collaboration across continents.",
    gradient: "from-sky-800 via-sky-700 to-sky-600",
    visual: "global",
    stats: ["8 Languages", "All Timezones", "24/7 Support"]
  }
];

// Mock data for visual components
export const mockDevelopers: Developer[] = [
  { name: "Sarah Chen", role: "React Expert", rate: "$85/hr" },
  { name: "Mike Johnson", role: "Full Stack Dev", rate: "$72/hr" },
  { name: "Anna Lee", role: "TypeScript Pro", rate: "$90/hr" }
];

export const mockDashboardColumns: DashboardColumn[] = [
  { status: 'To Do', color: 'blue', tasks: ['Design mockups', 'API planning'] },
  { status: 'In Progress', color: 'purple', tasks: ['Frontend dev', 'Database setup'] },
  { status: 'Done', color: 'green', tasks: ['Requirements', 'Kickoff meeting'] }
];

export const mockMilestones: Milestone[] = [
  { milestone: "Design Phase", amount: "$2,500", status: "Released", color: "green" },
  { milestone: "Development", amount: "$5,000", status: "In Progress", color: "blue" },
  { milestone: "Testing", amount: "$1,500", status: "Pending", color: "gray" }
];

export const mockLocations: Location[] = [
  { name: "Tokyo", time: "09:00 AM", flag: "🇯🇵", color: "red" },
  { name: "New York", time: "08:00 PM", flag: "🇺🇸", color: "blue" },
  { name: "London", time: "01:00 AM", flag: "🇬🇧", color: "purple" },
  { name: "Sydney", time: "11:00 AM", flag: "🇦🇺", color: "green" }
];

// Gradient configurations for easy reuse
export const gradientClasses = {
  blue: "from-blue-600 via-cyan-500 to-teal-400",
  purple: "from-purple-600 via-pink-500 to-rose-400",
  emerald: "from-emerald-600 via-teal-500 to-cyan-400",
  orange: "from-orange-600 via-amber-500 to-yellow-400"
};
