import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon, User, Bell, Lock, CreditCard,
  Globe, Mail, Smartphone, Shield, Eye, EyeOff, Save,
  Moon, Sun, Monitor,
  Languages, Clock, MapPin, Download, Trash2,
  X, Plus, Edit2, Users, Building2,
  UserPlus, Loader2
} from 'lucide-react';
import { useCompanyStore } from '../../stores/companyStore';
import CompanyProfile from '../../components/company/CompanyProfile';
import CompanyStats from '../../components/company/CompanyStats';
import { getDeveloperProfile, updateDeveloperProfile } from '@/services/developerService';
import { useAuth } from '@/contexts/AuthContext';
import { StripeConnectSettings } from '@/components/payment';

type TabType = 'profile' | 'account' | 'notifications' | 'privacy' | 'billing' | 'preferences' | 'company';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('America/New_York');
  const [saving, setSaving] = useState(false);

  // Company Store
  const {
    currentCompany,
    members,
    invitations,
    fetchUserCompanies,
    fetchCompanyMembers,
    fetchCompanyInvitations,
    createInvitation,
    isLoading,
  } = useCompanyStore();

  // Company & Team state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [newMember, setNewMember] = useState({
    email: '',
    role: 'member' as 'admin' | 'member',
  });

  // Profile data state - initialized empty, loaded from API
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    github: '',
    linkedin: '',
  });

  // Load profile data from API on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getDeveloperProfile();

        // Parse name into first/last
        const nameParts = (profile.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setProfileData({
          firstName,
          lastName,
          email: profile.email || user?.email || '',
          phone: '', // Not in current API, could be added
          location: profile.location || '',
          bio: profile.bio || '',
          website: '', // Not in current API
          github: '', // Not in current API
          linkedin: '', // Not in current API
        });

        setTimezone(profile.timezone || 'America/New_York');
      } catch (error) {
        console.error('Error loading profile:', error);
        // Use auth context user data as fallback
        if (user) {
          const nameParts = (user.name || '').split(' ');
          setProfileData({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: user.email || '',
            phone: '',
            location: '',
            bio: '',
            website: '',
            github: '',
            linkedin: '',
          });
        }
      }
    };

    loadProfile();
  }, [user]);

  // Load user companies on mount
  useEffect(() => {
    fetchUserCompanies();
  }, [fetchUserCompanies]);

  // Load company members and invitations when company is selected
  useEffect(() => {
    if (currentCompany?.id) {
      fetchCompanyMembers(currentCompany.id);
      fetchCompanyInvitations(currentCompany.id);
    }
  }, [currentCompany?.id, fetchCompanyMembers, fetchCompanyInvitations]);

  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: {
        newProjects: true,
        messages: true,
        milestones: true,
        payments: true,
        reviews: false,
        marketing: false,
      },
      pushNotifications: {
        newProjects: true,
        messages: true,
        milestones: true,
        payments: true,
        reviews: true,
      },
      smsNotifications: {
        urgentMessages: true,
        payments: true,
      },
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      showLocation: true,
      allowMessagesFromAnyone: true,
      showOnlineStatus: true,
    },
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company & Team', icon: Building2 },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'ar', name: 'العربية' },
    { code: 'ru', name: 'Русский' },
  ];

  const timezones = [
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      // Combine first and last name
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();

      // Update profile via API
      await updateDeveloperProfile({
        name: fullName,
        bio: profileData.bio,
        location: profileData.location,
        timezone,
      });

      toast.success('Settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!currentCompany?.id) {
      toast.error('Please create or select a company first');
      return;
    }

    if (!newMember.email) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await createInvitation(currentCompany.id, {
        invited_email: newMember.email,
        role: newMember.role === 'admin' ? 'admin' as any : 'member' as any,
      });
      toast.success('Invitation sent successfully');
      setNewMember({ email: '', role: 'member' });
      setShowInviteModal(false);

      // Refresh invitations list
      fetchCompanyInvitations(currentCompany.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your account settings and preferences
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-xl font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden xl:inline text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
      >
        {/* Company & Team Tab */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Company & Team Management</h2>
              {!currentCompany && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCompanyForm(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-bold"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Company</span>
                </motion.button>
              )}
            </div>

            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading company data...</p>
              </div>
            )}

            {!isLoading && !currentCompany && !showCompanyForm && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200 text-center">
                <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Company Profile Yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your company profile to start building your team and managing projects professionally.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowCompanyForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold"
                >
                  Create Company Profile
                </motion.button>
              </div>
            )}

            {showCompanyForm && (
              <div>
                <CompanyProfile
                  company={currentCompany}
                  onSuccess={() => {
                    toast.success(currentCompany ? 'Company updated!' : 'Company created!');
                    setShowCompanyForm(false);
                  }}
                  onCancel={() => setShowCompanyForm(false)}
                />
              </div>
            )}

            {!showCompanyForm && currentCompany && (
              <div className="space-y-6">
                {/* Company Overview Card */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{currentCompany.display_name}</h3>
                        {currentCompany.company_name && (
                          <p className="text-gray-600">{currentCompany.company_name}</p>
                        )}
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold uppercase">
                            {currentCompany.account_type}
                          </span>
                          <span className="text-sm text-gray-600">
                            {currentCompany.company_size} team size
                          </span>
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setShowCompanyForm(true)}
                      className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-xl font-bold border-2 border-blue-200"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </motion.button>
                  </div>
                </div>

                {/* Company Stats Dashboard */}
                <CompanyStats companyId={currentCompany.id} />

                {/* Team Members Section */}
                <div className="border-t-2 border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                      <Users className="w-6 h-6 text-purple-600" />
                      <span>Team Members</span>
                      <span className="text-sm font-normal text-gray-600">({members.length})</span>
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-bold"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Invite Team Member</span>
                    </motion.button>
                  </div>

                  {members.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-gray-200">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No team members yet. Start by inviting your first team member!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {members.map((member) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all"
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                              <User className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-900">
                                {member.user?.name || 'User'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {member.user?.email || 'No email'}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {member.status}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  {member.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Pending Invitations */}
                  {invitations.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-bold text-gray-900 mb-3">Pending Invitations ({invitations.length})</h4>
                      <div className="space-y-2">
                        {invitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                          >
                            <div>
                              <div className="font-semibold text-gray-900">{invitation.invited_email}</div>
                              <div className="text-xs text-gray-600">
                                Invited • {invitation.role}
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                              Pending
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Security</h2>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200 mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-gray-900">Two-Factor Authentication</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Add an extra layer of security to your account
              </p>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${twoFactorEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    twoFactorEnabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      twoFactorEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    className="w-full pl-11 pr-11 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold"
              >
                Update Password
              </motion.button>
            </div>

            <div className="border-t-2 border-gray-200 pt-6 mt-6">
              <h3 className="font-bold text-gray-900 mb-4">Danger Zone</h3>
              <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-red-900 mb-1">Delete Account</h4>
                    <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>Email Notifications</span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(settings.notifications.emailNotifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Receive email notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            emailNotifications: {
                              ...settings.notifications.emailNotifications,
                              [key]: !value,
                            },
                          },
                        })}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          value ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <span>Push Notifications</span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(settings.notifications.pushNotifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Receive push notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            pushNotifications: {
                              ...settings.notifications.pushNotifications,
                              [key]: !value,
                            },
                          },
                        })}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          value ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Settings</h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Profile Visibility</div>
                    <div className="text-sm text-gray-600">Control who can see your profile</div>
                  </div>
                  <select
                    value={settings.privacy.profileVisibility}
                    onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, profileVisibility: e.target.value } })}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="public">Public</option>
                    <option value="clients">Clients Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              {Object.entries(settings.privacy).slice(1).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <div className="font-semibold text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {key === 'showEmail' && 'Display your email on your profile'}
                      {key === 'showPhone' && 'Display your phone number on your profile'}
                      {key === 'showLocation' && 'Display your location on your profile'}
                      {key === 'allowMessagesFromAnyone' && 'Allow anyone to send you messages'}
                      {key === 'showOnlineStatus' && 'Show when you are online'}
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, privacy: { ...settings.privacy, [key]: !value } })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      value ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing & Payments</h2>

            {/* Stripe Connect Settings for receiving payments */}
            <StripeConnectSettings />
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Preferences</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Monitor },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setTheme(option.value as any)}
                        className={`flex flex-col items-center space-y-2 p-4 rounded-xl border-2 transition-all ${
                          theme === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-8 h-8 ${theme === option.value ? 'text-blue-600' : 'text-gray-600'}`} />
                        <span className={`font-semibold ${theme === option.value ? 'text-blue-600' : 'text-gray-900'}`}>
                          {option.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                <div className="relative">
                  <Languages className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-semibold"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-semibold"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Invite Team Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as 'admin' | 'member' })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-semibold"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-gray-600">
                  An invitation email will be sent to <span className="font-semibold text-blue-600">{newMember.email || 'the email address'}</span> with instructions to join your team.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInviteMember}
                  disabled={!newMember.email || isLoading}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>{isLoading ? 'Sending...' : 'Send Invitation'}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowInviteModal(false);
                    setNewMember({ email: '', role: 'member' });
                  }}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Settings;
