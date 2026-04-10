import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Menu,
  X,
  User,
  Users,
  Settings,
  LogOut,
  Briefcase,
  ChevronDown,
  FileText,
  MessageSquare,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyStore } from '../../stores/companyStore';
import { NotificationBell } from '../notifications/NotificationBell';
import LanguageSwitcher from '../shared/LanguageSwitcher';

interface UnifiedHeaderProps {
  className?: string;
}

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId?: string }>();
  const { user, isAuthenticated, logout } = useAuth();
  const { currentCompany } = useCompanyStore();

  // Get the active company ID (from URL or current company)
  const activeCompanyId = companyId || currentCompany?.id;

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleGetStarted = () => {
    navigate('/auth/signup');
  };

  const handleLogin = () => {
    navigate('/auth/login');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { label: t('header.findTalent'), href: '/browse-talent' },
    { label: t('header.findJobs'), href: '/browse-jobs' },
    { label: t('header.howItWorks'), href: '/#how-it-works' },
    { label: t('header.pricing'), href: '/pricing' },
  ];

  return (
    <>
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200 z-50 shadow-sm ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-3 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              // Always navigate to landing page when clicking logo
              navigate('/');
            }}
          >
            <img
              src="/assets/logo.png"
              alt="Team@Once Logo"
              className="h-12 w-auto"
            />
            <div className="flex items-center space-x-3">
              <div>
                <div className="text-2xl font-black bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent">
                  Team@Once
                </div>
                <div className="text-xs text-gray-500">AI-Powered Marketplace</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-sky-600 text-white px-2.5 py-0.5 rounded flex items-center space-x-1.5">
                  <div className="text-[11px] font-bold uppercase">Beta</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-gray-700 hover:text-sky-700 transition-colors text-sm font-semibold relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 group-hover:w-full transition-all" />
              </a>
            ))}

            {/* Language Switcher */}
            <LanguageSwitcher variant="header" showLabel={true} showFlag={true} />

            {isAuthenticated && user ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* User Avatar Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border-2 border-sky-600"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-600 to-sky-700 flex items-center justify-center text-white font-bold text-lg border-2 border-sky-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left hidden lg:block">
                      <div className="text-sm font-bold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden z-50"
                      >
                        {/* User Info */}
                        <div className="p-4 bg-gradient-to-r from-sky-600 to-sky-700 text-white">
                          <div className="flex items-center space-x-3">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-12 h-12 rounded-full border-2 border-white"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl border-2 border-white">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold">{user.name}</div>
                              <div className="text-xs text-white/80">{user.email}</div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <button
                            onClick={() => {
                              if (activeCompanyId && user) {
                                // Map 'developer' role to 'seller' dashboard
                                const dashboardRole = user.role === 'developer' ? 'seller' : user.role;
                                navigate(`/company/${activeCompanyId}/${dashboardRole}/dashboard`);
                              } else {
                                toast.info('Please select a company first');
                                navigate('/select-company');
                              }
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 rounded-xl transition-colors text-left"
                          >
                            <Briefcase className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">Dashboard</span>
                          </button>

                          <button
                            onClick={() => {
                              if (activeCompanyId && user) {
                                navigate(`/company/${activeCompanyId}/${user.role}/profile`);
                              } else {
                                toast.info('Please select a company first');
                                navigate('/select-company');
                              }
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 rounded-xl transition-colors text-left"
                          >
                            <User className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">My Profile</span>
                          </button>

                          <div className="border-t border-gray-200 my-2"></div>

                          <button
                            onClick={() => {
                              navigate('/browse-talent');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 rounded-xl transition-colors text-left"
                          >
                            <Users className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">Find Talent</span>
                          </button>

                          <button
                            onClick={() => {
                              navigate('/browse-jobs');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 rounded-xl transition-colors text-left"
                          >
                            <Briefcase className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">Find Jobs</span>
                          </button>

                          <div className="border-t border-gray-200 my-2"></div>

                          {/* Role-specific section */}
                          {user?.role === 'developer' && (
                            <>
                              <div className="px-4 py-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Developer Portal</span>
                              </div>

                              <button
                                onClick={() => {
                                  if (activeCompanyId) {
                                    navigate(`/company/${activeCompanyId}/developer/projects`);
                                  }
                                  setIsUserMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-sky-50 rounded-xl transition-colors text-left"
                              >
                                <FileText className="w-4 h-4 text-sky-600" />
                                <span className="text-sm font-medium text-gray-900">My Projects</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (activeCompanyId) {
                                    navigate(`/company/${activeCompanyId}/developer/messages`);
                                  }
                                  setIsUserMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-sky-50 rounded-xl transition-colors text-left"
                              >
                                <MessageSquare className="w-4 h-4 text-sky-600" />
                                <span className="text-sm font-medium text-gray-900">Messages</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (activeCompanyId) {
                                    navigate(`/company/${activeCompanyId}/developer/performance`);
                                  }
                                  setIsUserMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-sky-50 rounded-xl transition-colors text-left"
                              >
                                <TrendingUp className="w-4 h-4 text-sky-600" />
                                <span className="text-sm font-medium text-gray-900">Performance</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (activeCompanyId) {
                                    navigate(`/company/${activeCompanyId}/developer/calendar`);
                                  }
                                  setIsUserMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-sky-50 rounded-xl transition-colors text-left"
                              >
                                <Calendar className="w-4 h-4 text-sky-600" />
                                <span className="text-sm font-medium text-gray-900">Calendar</span>
                              </button>
                            </>
                          )}

                          <div className="border-t border-gray-200 my-2"></div>

                          <button
                            onClick={() => {
                              if (activeCompanyId && user) {
                                navigate(`/company/${activeCompanyId}/${user.role}/settings`);
                              } else {
                                toast.info('Please select a company first');
                                navigate('/select-company');
                              }
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 rounded-xl transition-colors text-left"
                          >
                            <Settings className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">Settings</span>
                          </button>

                          <div className="border-t-2 border-gray-200 my-2"></div>

                          <button
                            onClick={() => {
                              handleLogout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-xl transition-colors text-left"
                          >
                            <LogOut className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-red-600">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogin}
                  className="text-gray-700 hover:text-sky-700 transition-colors text-sm font-semibold"
                >
                  {t('header.login')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-2xl"
                >
                  {t('common.getStartedFree')}
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-6 space-y-4">
              {isAuthenticated && user && (
                <>
                  {/* User Info in Mobile Menu */}
                  <div className="p-4 bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl text-white mb-4">
                    <div className="flex items-center space-x-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full border-2 border-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl border-2 border-white">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-bold">{user.name}</div>
                        <div className="text-xs text-white/80">{user.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <button
                    onClick={() => {
                      if (activeCompanyId && user) {
                        navigate(`/company/${activeCompanyId}/${user.role}/dashboard`);
                      } else {
                        toast.info('Please select a company first');
                        navigate('/select-company');
                      }
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <Briefcase className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Dashboard</span>
                  </button>

                  <div className="border-t-2 border-gray-200 my-2"></div>
                </>
              )}

              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block text-gray-700 hover:text-sky-700 py-2 font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}

              {/* Language Switcher for Mobile */}
              <div className="py-2">
                <LanguageSwitcher variant="mobile" showLabel={true} showFlag={true} />
              </div>

              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      handleLogin();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left text-gray-700 hover:text-sky-700 py-2 font-semibold"
                  >
                    {t('header.login')}
                  </button>
                  <button
                    onClick={() => {
                      handleGetStarted();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-2xl"
                  >
                    {t('common.getStartedFree')}
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t-2 border-gray-200 my-2"></div>

                  <button
                    onClick={() => {
                      if (activeCompanyId && user) {
                        navigate(`/company/${activeCompanyId}/${user.role}/profile`);
                      } else {
                        toast.info('Please select a company first');
                        navigate('/select-company');
                      }
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activeCompanyId && user) {
                        navigate(`/company/${activeCompanyId}/${user.role}/settings`);
                      } else {
                        toast.info('Please select a company first');
                        navigate('/select-company');
                      }
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Settings className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-600">Logout</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>

    </>
  );
};

export default UnifiedHeader;
