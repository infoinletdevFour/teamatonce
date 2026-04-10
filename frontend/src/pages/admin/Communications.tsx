import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Bell, Send, History, Users, PenTool } from 'lucide-react';

const AdminCommunications: React.FC = () => {
  const communicationOptions = [
    {
      title: 'Compose Email',
      description: 'Send bulk email to users',
      icon: PenTool,
      link: '/admin/communications/compose',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Send Notification',
      description: 'Send push notifications to users',
      icon: Bell,
      link: '/admin/communications/notification',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Email Campaigns',
      description: 'View sent email campaigns',
      icon: History,
      link: '/admin/communications/campaigns',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
        <p className="text-gray-500 mt-1">Send bulk emails and notifications to users</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {communicationOptions.map((option, index) => (
          <motion.div
            key={option.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {option.comingSoon ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 opacity-60">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center mb-4`}>
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">{option.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                <span className="inline-block mt-3 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Coming Soon</span>
              </div>
            ) : (
              <Link to={option.link} className="block bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center mb-4`}>
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{option.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{option.description}</p>
              </Link>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="font-semibold text-gray-900 mb-4">Target Audiences</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-blue-900">All Users</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-purple-900">Sellers</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-900">Clients</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="font-medium text-orange-900">Pending Users</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminCommunications;
