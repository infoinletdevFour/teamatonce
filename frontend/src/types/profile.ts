/**
 * Seller Profile Types
 * Shared types for professional profile management
 */

export interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  technologies: string[];
  completedDate: string;
}

export interface Education {
  id?: string;
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  description?: string;
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Experience {
  id?: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Language {
  name: string;
  proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
  verified: boolean;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
}

export interface SellerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  title: string;
  tagline: string;
  bio: string;
  avatar?: string;
  coverImage?: string;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'away';
  responseTime: string;
  location: string;
  timezone: string;
  rating: number;
  totalReviews: number;
  totalEarnings: number;
  completedProjects: number;
  successRate: number;
  onTimeDelivery: number;
  skills: Skill[];
  languages: Language[];
  education: Education[];
  certifications: Certification[];
  experience: Experience[];
  portfolioItems: PortfolioItem[];
  socialLinks: SocialLinks;
  joinedDate: string;
  verified: boolean;
  topRated: boolean;
}

export interface ProfileTabProps {
  profile: SellerProfile;
  editedProfile: SellerProfile;
  isEditing: boolean;
  setEditedProfile: (profile: SellerProfile) => void;
}
