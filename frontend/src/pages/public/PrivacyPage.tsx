import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Users, FileText } from 'lucide-react';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import Footer from '../../components/layout/Footer';

const PrivacyPage: React.FC = () => {
  return (
    <>
      <UnifiedHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center space-x-3 bg-blue-100 rounded-full px-6 py-3 mb-6">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">Privacy Policy</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Privacy Matters
            </h1>
            <p className="text-base text-gray-600">
              Last updated: January 27, 2025
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 space-y-8"
          >
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Eye className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Introduction</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Team@Once ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Name, email address, and contact information</li>
                    <li>Professional profile information (skills, experience, portfolio)</li>
                    <li>Payment and billing information</li>
                    <li>Communication records and messages</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Usage Information</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Device information (IP address, browser type, operating system)</li>
                    <li>Usage patterns and interactions with our platform</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>To provide and maintain our services</li>
                <li>To match clients with developers using AI-powered algorithms</li>
                <li>To process payments and manage transactions</li>
                <li>To communicate with you about your account and services</li>
                <li>To improve our platform and user experience</li>
                <li>To comply with legal obligations</li>
                <li>To prevent fraud and ensure platform security</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Information Sharing</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform (payment processors, hosting providers, analytics services)</li>
                <li><strong>Other Users:</strong> Profile information visible to potential clients or developers for matching purposes</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-4">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Encrypted storage of sensitive data</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Secure payment processing through trusted providers</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restriction:</strong> Limit how we use your information</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Data Retention</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We retain your information for as long as necessary to provide our services and comply with legal obligations. When you close your account, we will delete or anonymize your personal information within a reasonable timeframe, except where we are required to retain it by law.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Children's Privacy</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Our platform is not intended for users under the age of 18. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">International Data Transfers</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Changes to This Policy</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our platform after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="mt-4 bg-blue-50 rounded-xl p-4">
                <p className="text-gray-900 font-semibold">Team@Once Privacy Team</p>
                <p className="text-gray-700">Email: privacy@teamatonce.com</p>
                <p className="text-gray-700">Address: Nissho II 1F Room 1-B, 6-5-5 Nagatsuta, Midori-ku, Yokohama, Kanagawa, Japan</p>
                <p className="text-gray-700">Phone: +81-45-508-9779</p>
              </div>
            </section>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPage;
