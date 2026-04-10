import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Flag,
  Mail,
  HelpCircle,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  Database,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    path: '/admin/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Overview & stats',
  },
  {
    path: '/admin/users',
    icon: Users,
    label: 'Users',
    description: 'Manage all users',
  },
  {
    path: '/admin/jobs',
    icon: Briefcase,
    label: 'Projects',
    description: 'Manage all projects',
  },
  {
    path: '/admin/reports',
    icon: Flag,
    label: 'Reports',
    description: 'Content moderation',
  },
  {
    path: '/admin/communications',
    icon: Mail,
    label: 'Communications',
    description: 'Bulk email & notifications',
  },
  {
    path: '/admin/data-engine',
    icon: Database,
    label: 'Data Engine',
    description: 'Pipeline operations',
  },
  {
    path: '/admin/faqs',
    icon: HelpCircle,
    label: 'FAQs',
    description: 'Help center content',
  },
  {
    path: '/admin/settings',
    icon: Settings,
    label: 'Settings',
    description: 'Admin settings',
  },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const isActiveRoute = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-slate-900 text-white
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold"
              >
                Admin Panel
              </motion.span>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = isActiveRoute(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${item.indent && !sidebarCollapsed ? 'ml-4' : ''}
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{item.label}</span>
                        {item.badge && (
                          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      {!item.indent && (
                        <span className="text-xs text-slate-400 truncate block">
                          {item.description}
                        </span>
                      )}
                    </motion.div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-700 p-4">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user?.name || 'Admin User'}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {user?.email}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`
              mt-4 flex items-center gap-2 w-full px-3 py-2 rounded-lg
              text-slate-300 hover:bg-slate-800 hover:text-white transition-colors
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            {/* Search */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-64">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-gray-600 w-full placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationBell />

            {/* User Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
