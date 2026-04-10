import React from 'react';
import { motion } from 'framer-motion';
import { Cookie, Settings, BarChart3, Shield, FileText, Eye } from 'lucide-react';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import Footer from '../../components/layout/Footer';

const CookiePage: React.FC = () => {
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
              <Cookie className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">Cookie Policy</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              How We Use Cookies
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
                <Cookie className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">What Are Cookies?</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners. Cookies help us understand how you use our platform and improve your experience.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Types of Cookies We Use</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">1. Essential Cookies</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    These cookies are necessary for the platform to function properly. They enable core functionality such as security, network management, and accessibility.
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    Examples: Session management, authentication, security tokens
                  </p>
                </div>

                <div className="bg-purple-50 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-gray-900">2. Analytics Cookies</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    These cookies help us understand how visitors interact with our platform by collecting and reporting information anonymously. This helps us improve our services.
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    Examples: Google Analytics, page view tracking, user behavior analysis
                  </p>
                </div>

                <div className="bg-green-50 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Settings className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-gray-900">3. Functional Cookies</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    These cookies enable enhanced functionality and personalization. They may be set by us or by third-party providers whose services we've added to our pages.
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    Examples: Language preferences, user settings, remembered choices
                  </p>
                </div>

                <div className="bg-orange-50 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Eye className="w-5 h-5 text-orange-600" />
                    <h3 className="font-bold text-gray-900">4. Marketing Cookies</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    These cookies track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad. They may be used to build a profile of your interests.
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    Examples: Ad targeting, retargeting campaigns, conversion tracking
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Third-Party Cookies</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                In addition to our own cookies, we may use various third-party services that set their own cookies to provide specific functionality:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Google Analytics:</strong> Web analytics service to understand user behavior</li>
                <li><strong>Stripe:</strong> Payment processing and fraud prevention</li>
                <li><strong>Intercom/Zendesk:</strong> Customer support and live chat</li>
                <li><strong>OAuth Providers:</strong> Social login functionality (Google, GitHub)</li>
                <li><strong>CDN Providers:</strong> Content delivery and performance optimization</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Eye className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">How We Use Cookies</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies for various purposes, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Keeping you logged in during your session</li>
                <li>Remembering your preferences and settings</li>
                <li>Understanding how you use our platform</li>
                <li>Improving platform performance and user experience</li>
                <li>Providing personalized content and recommendations</li>
                <li>Analyzing traffic patterns and usage statistics</li>
                <li>Preventing fraud and enhancing security</li>
                <li>Delivering relevant advertising</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Managing Your Cookie Preferences</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences through:
                </p>

                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Browser Settings</h3>
                  <p className="mb-3">
                    Most web browsers allow you to control cookies through their settings. You can:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Block all cookies</li>
                    <li>Accept only first-party cookies</li>
                    <li>Delete cookies after each session</li>
                    <li>Accept cookies from specific websites only</li>
                  </ul>
                </div>

                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Platform Cookie Settings</h3>
                  <p className="mb-3">
                    We provide a cookie consent banner where you can customize your preferences:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Essential cookies (always active)</li>
                    <li>Functional cookies (optional)</li>
                    <li>Analytics cookies (optional)</li>
                    <li>Marketing cookies (optional)</li>
                  </ul>
                </div>

                <p className="leading-relaxed italic text-sm">
                  Note: Blocking some types of cookies may impact your experience on our platform and the services we can offer.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Cookie Retention Periods</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Different types of cookies remain on your device for different periods:
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-32 font-semibold text-gray-900">Session Cookies:</div>
                  <div className="text-gray-700">Deleted when you close your browser</div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-32 font-semibold text-gray-900">Persistent Cookies:</div>
                  <div className="text-gray-700">Remain on your device until they expire or you delete them (typically 1 month to 2 years)</div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Your Privacy Rights</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Under data protection laws, you have rights including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-4">
                <li>The right to be informed about cookie usage</li>
                <li>The right to access cookie data</li>
                <li>The right to withdraw consent at any time</li>
                <li>The right to object to processing for marketing purposes</li>
                <li>The right to delete cookies from your device</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Updates to This Policy</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business operations. We will notify you of any material changes by posting the updated policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Cookie className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
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

export default CookiePage;
