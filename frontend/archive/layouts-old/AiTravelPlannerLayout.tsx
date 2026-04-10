import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Map,
  BarChart3,
  Plus,
  Heart,
  type LucideIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';
import { ToastContainer } from '../components/ui/toast';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Map, label: 'My Plans', path: '/travel-planner' },
  { icon: Heart, label: 'Favorites', path: '/travel-planner/favorites' },
  { icon: BarChart3, label: 'Travel Stats', path: '/travel-planner/stats' },
];

const AiTravelPlannerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <ToastContainer />
      
      {/* Navigation */}
      <nav className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <Button
              onClick={() => navigate('/travel-planner/generate')}
              className="rounded"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Plan
            </Button>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};

export default AiTravelPlannerLayout;