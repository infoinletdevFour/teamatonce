import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sectionPaths, extractRouteContext } from '@/lib/navigation-utils';
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  FileText,
  CreditCard,
  Settings,
  Search,
  Menu,
  X,
  User,
  Code,
  Users,
  Calendar,
  TrendingUp,
  Award,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { SimpleMegaMenu } from '@/components/layout/SimpleMegaMenu';
import { useAuth } from '@/contexts/AuthContext';

/**
 * DashboardLayout Component
 * Main layout for authenticated users with sidebar navigation
 * Features responsive design, role-based navigation, and user menu
 */

interface DashboardLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean; // Option to hide sidebar for pages with custom navigation
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  submenu?: NavItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const params = useParams();
  const { companyId } = extractRouteContext(params);
  const { user } = useAuth();

  // Get role from authenticated user
  const role = user?.role === 'developer' ? 'developer' : 'client';

  // Navigation items based on user role - using absolute paths built with navigation utilities
  const clientNavItems: NavItem[] = [
    { name: 'Dashboard', path: sectionPaths.client({ companyId }, 'dashboard'), icon: LayoutDashboard },
    { name: 'My Projects', path: sectionPaths.client({ companyId }, 'projects'), icon: FolderKanban, badge: 3 },
    { name: 'Payments', path: sectionPaths.client({ companyId }, 'payments'), icon: CreditCard },
    {
      name: 'Settings',
      path: sectionPaths.settings({ companyId }),
      icon: Settings,
      submenu: [
        { name: 'Company Profile', path: sectionPaths.settings({ companyId }, 'company'), icon: Building2 },
        { name: 'Team Members', path: sectionPaths.settings({ companyId }, 'team'), icon: Users },
        { name: 'Account Settings', path: sectionPaths.client({ companyId }, 'settings'), icon: User },
      ]
    },
  ];

  const developerNavItems: NavItem[] = [
    { name: 'Dashboard', path: sectionPaths.developer({ companyId }, 'dashboard'), icon: LayoutDashboard },
    { name: 'Browse Projects', path: sectionPaths.developer({ companyId }, 'browse-projects'), icon: Search },
    { name: 'My Projects', path: sectionPaths.developer({ companyId }, 'projects'), icon: Code, badge: 2 },
    { name: 'Team', path: sectionPaths.developer({ companyId }, 'team'), icon: Users },
    { name: 'Messages', path: sectionPaths.developer({ companyId }, 'messages'), icon: MessageSquare, badge: 3 },
    { name: 'Calendar', path: sectionPaths.developer({ companyId }, 'calendar'), icon: Calendar },
    { name: 'Performance', path: sectionPaths.developer({ companyId }, 'performance'), icon: TrendingUp },
    {
      name: 'Settings',
      path: sectionPaths.settings({ companyId }),
      icon: Settings,
      submenu: [
        { name: 'Company Profile', path: sectionPaths.settings({ companyId }, 'company'), icon: Building2 },
        { name: 'Team Members', path: sectionPaths.settings({ companyId }, 'team'), icon: Users },
        { name: 'Account Settings', path: sectionPaths.developer({ companyId }, 'settings'), icon: User },
      ]
    },
  ];

  const navItems = role === 'client' ? clientNavItems : developerNavItems;

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleSubmenu = (itemName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const isSubmenuExpanded = (itemName: string) => {
    return expandedMenus[itemName] || false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Top Header with SimpleMegaMenu */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <SimpleMegaMenu />
      </div>

      {/* Mobile Menu Toggle (only visible on mobile) */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Sidebar Toggle (desktop) */}
      <div className="fixed top-20 left-4 z-50 hidden lg:block">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside
        className={`fixed left-0 top-16 bottom-0 bg-white/80 backdrop-blur-lg border-r border-gray-200 transition-all duration-300 z-30 hidden lg:block ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = isSubmenuExpanded(item.name);

            return (
              <div key={item.path}>
                {hasSubmenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group relative ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="font-semibold flex-1 text-left">{item.name}</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </>
                      )}
                    </button>

                    {/* Submenu Items */}
                    <AnimatePresence>
                      {sidebarOpen && isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-4 mt-1 space-y-1"
                        >
                          {item.submenu?.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = isActivePath(subItem.path);

                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all ${
                                  isSubActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <SubIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm font-medium">{subItem.name}</span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="font-semibold flex-1">{item.name}</span>
                        {item.badge && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {!sidebarOpen && item.badge && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Role Badge at Bottom */}
        {sidebarOpen && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-5 h-5" />
                <span className="font-bold">
                  {role === 'client' ? 'Client Account' : 'Developer Account'}
                </span>
              </div>
              <p className="text-xs text-white/80">
                {role === 'client'
                  ? 'Manage your projects and teams'
                  : 'Build amazing projects'}
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-xl z-50 lg:hidden overflow-y-auto"
            >
              <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);
                  const hasSubmenu = item.submenu && item.submenu.length > 0;
                  const isExpanded = isSubmenuExpanded(item.name);

                  return (
                    <div key={item.path}>
                      {hasSubmenu ? (
                        <>
                          <button
                            onClick={() => toggleSubmenu(item.name)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-semibold flex-1 text-left">{item.name}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {/* Submenu Items */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="ml-4 mt-1 space-y-1"
                              >
                                {item.submenu?.map((subItem) => {
                                  const SubIcon = subItem.icon;
                                  const isSubActive = isActivePath(subItem.path);

                                  return (
                                    <Link
                                      key={subItem.path}
                                      to={subItem.path}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all ${
                                        isSubActive
                                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                          : 'text-gray-600 hover:bg-gray-100'
                                      }`}
                                    >
                                      <SubIcon className="w-4 h-4 flex-shrink-0" />
                                      <span className="text-sm font-medium">{subItem.name}</span>
                                    </Link>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold flex-1">{item.name}</span>
                          {item.badge && (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`pt-20 transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
