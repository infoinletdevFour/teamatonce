import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Scale, AlertCircle, CheckCircle2, XCircle, Shield } from 'lucide-react';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import Footer from '../../components/layout/Footer';

const TermsPage: React.FC = () => {
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
              <Scale className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">Terms of Service</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Terms & Conditions
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
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">1. Agreement to Terms</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using Team@Once ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Platform. These Terms apply to all visitors, users, and others who access or use the Platform.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">2. User Accounts</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  When you create an account with us, you must provide accurate, complete, and current information. You are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                  <li>Ensuring your account information is accurate and up-to-date</li>
                </ul>
                <p className="leading-relaxed">
                  We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Scale className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">3. Platform Services</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  Team@Once provides a platform connecting clients with developers. Our services include:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>AI-powered matching between clients and developers</li>
                  <li>Project management tools and collaboration features</li>
                  <li>Secure payment processing and escrow services</li>
                  <li>Communication and file-sharing capabilities</li>
                  <li>Time tracking and milestone management</li>
                </ul>
                <p className="leading-relaxed">
                  We reserve the right to modify, suspend, or discontinue any aspect of the Platform at any time.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">4. User Conduct</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">You agree NOT to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the Platform for any illegal or unauthorized purpose</li>
                  <li>Violate any laws in your jurisdiction</li>
                  <li>Infringe upon intellectual property rights</li>
                  <li>Transmit viruses, malware, or harmful code</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Attempt to bypass security features</li>
                  <li>Scrape, mine, or extract data without permission</li>
                  <li>Impersonate others or provide false information</li>
                  <li>Interfere with the proper functioning of the Platform</li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">5. Payment Terms</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <h3 className="font-semibold text-gray-900">Platform Fees</h3>
                <p className="leading-relaxed">
                  Team@Once charges a service fee of 3-5% on all transactions. This fee covers platform maintenance, payment processing, and customer support.
                </p>
                <h3 className="font-semibold text-gray-900">Escrow and Payments</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All payments are processed through our secure escrow system</li>
                  <li>Clients deposit funds for project milestones</li>
                  <li>Funds are released upon milestone completion and approval</li>
                  <li>Refunds are subject to our refund policy and dispute resolution</li>
                  <li>Payment processing fees are non-refundable</li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">6. Intellectual Property</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  The Platform and its original content, features, and functionality are owned by Team@Once and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
                <h3 className="font-semibold text-gray-900">User Content</h3>
                <p className="leading-relaxed">
                  You retain ownership of content you upload to the Platform. By uploading content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content solely for the purpose of operating and improving the Platform.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Scale className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">7. Dispute Resolution</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  In the event of a dispute between users:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Users are encouraged to resolve disputes directly</li>
                  <li>Team@Once provides mediation services</li>
                  <li>Disputes may be escalated to our support team</li>
                  <li>Escrow funds are held until disputes are resolved</li>
                  <li>Team@Once's decision in disputes is final and binding</li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <XCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">8. Limitation of Liability</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The Platform is provided "AS IS" and "AS AVAILABLE"</li>
                  <li>We make no warranties, express or implied</li>
                  <li>We are not liable for indirect, incidental, or consequential damages</li>
                  <li>Our total liability is limited to the fees paid by you in the past 12 months</li>
                  <li>We are not responsible for the quality of work or conduct of users</li>
                  <li>We do not guarantee project outcomes or success</li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">9. Indemnification</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Team@Once and its affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-4">
                <li>Your use of the Platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Your conduct on the Platform</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">10. Termination</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-4">
                <li>Your right to use the Platform will cease immediately</li>
                <li>Outstanding payments will be processed according to our policies</li>
                <li>Provisions that should survive termination will remain in effect</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Scale className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">11. Governing Law</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of [Your Jurisdiction].
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">12. Changes to Terms</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Platform after such changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">13. Contact Information</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 bg-blue-50 rounded-xl p-4">
                <p className="text-gray-900 font-semibold">Team@Once Legal Team</p>
                <p className="text-gray-700">Email: legal@teamatonce.com</p>
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

export default TermsPage;
