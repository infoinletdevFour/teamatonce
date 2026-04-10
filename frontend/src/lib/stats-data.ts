import { Users, Briefcase, DollarSign, Star } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface StatItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const statsData: StatItem[] = [
  { value: "50K+", label: "Active Developers", icon: Users },
  { value: "100K+", label: "Projects Completed", icon: Briefcase },
  { value: "$50M+", label: "Paid Out", icon: DollarSign },
  { value: "4.9/5", label: "Average Rating", icon: Star }
];
