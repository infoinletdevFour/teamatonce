import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, X, Plus, Users, User } from 'lucide-react';
import { sendBulkEmail } from '@/services/adminService';
import { toast } from 'sonner';

type SendMode = 'audience' | 'individual';

const AdminComposeEmail: React.FC = () => {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>('audience');
  const [individualEmails, setIndividualEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    contentHtml: '',
    targetAudience: 'all' as 'all' | 'clients' | 'sellers' | 'pending_approval',
  });

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (individualEmails.includes(email)) {
      toast.error('Email already added');
      return;
    }

    setIndividualEmails([...individualEmails, email]);
    setEmailInput('');
  };

  const removeEmail = (emailToRemove: string) => {
    setIndividualEmails(individualEmails.filter(e => e !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.contentHtml) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (sendMode === 'individual' && individualEmails.length === 0) {
      toast.error('Please add at least one email recipient');
      return;
    }

    try {
      setSending(true);
      await sendBulkEmail({
        ...formData,
        targetAudience: sendMode === 'individual' ? 'individual' : formData.targetAudience,
        individualEmails: sendMode === 'individual' ? individualEmails : undefined,
      });
      toast.success(sendMode === 'individual'
        ? `Email sent to ${individualEmails.length} recipient(s)`
        : 'Email campaign created successfully'
      );
      navigate('/admin/communications/campaigns');
    } catch {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/communications')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compose Email</h1>
          <p className="text-gray-500">Send email to users or specific recipients</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., December Newsletter"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Send Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Send To *</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSendMode('audience')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                sendMode === 'audience'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-5 h-5 ${sendMode === 'audience' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-semibold text-gray-900">User Group</div>
                  <div className="text-sm text-gray-500">Send to all users or a specific group</div>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSendMode('individual')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                sendMode === 'individual'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className={`w-5 h-5 ${sendMode === 'individual' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-semibold text-gray-900">Individual Emails</div>
                  <div className="text-sm text-gray-500">Send to specific email addresses</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Target Audience (for group mode) */}
        {sendMode === 'audience' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience *</label>
            <select
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as typeof formData.targetAudience })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="clients">Clients Only</option>
              <option value="sellers">Sellers Only</option>
              <option value="pending_approval">Pending Approval Users</option>
            </select>
          </div>
        )}

        {/* Individual Emails (for individual mode) */}
        {sendMode === 'individual' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Recipients * ({individualEmails.length} added)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter email address and press Enter"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {individualEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {individualEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="p-0.5 hover:bg-gray-100 rounded-full"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {individualEmails.length === 0 && (
              <p className="text-sm text-gray-500 italic">No recipients added yet. Add email addresses above.</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Email subject line"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Content (HTML) *</label>
          <textarea
            value={formData.contentHtml}
            onChange={(e) => setFormData({ ...formData, contentHtml: e.target.value })}
            placeholder="Enter your email content in HTML format..."
            rows={10}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/admin/communications')}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : sendMode === 'individual' ? `Send to ${individualEmails.length} recipient(s)` : 'Send Email'}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default AdminComposeEmail;
