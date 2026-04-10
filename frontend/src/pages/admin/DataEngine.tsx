import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Bug,
  Workflow,
  Database,
  Users,
  Building2,
  GitMerge,
  Send,
  Settings,
  RefreshCw,
} from 'lucide-react';

const tabs = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: 'crawling', label: 'Crawling', icon: Bug, end: false },
  { path: 'pipelines', label: 'Pipelines', icon: Workflow, end: false },
  { path: 'data', label: 'Data', icon: Database, end: false },
  { path: 'entities', label: 'Entities', icon: Users, end: false },
  { path: 'companies', label: 'Companies', icon: Building2, end: false },
  { path: 'matching', label: 'Matching', icon: GitMerge, end: false },
  { path: 'outreach', label: 'Outreach', icon: Send, end: false },
  { path: 'settings', label: 'Settings', icon: Settings, end: false },
];

const DataEngine: React.FC = () => {
  const location = useLocation();

  const handleRefresh = () => {
    window.dispatchEvent(new CustomEvent('data-engine-refresh'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Engine</h1>
          <p className="text-gray-500 mt-1">Pipeline management and operations</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tab Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <nav className="flex px-4 -mb-px" aria-label="Tabs">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
      </motion.div>
    </div>
  );
};

export default DataEngine;
