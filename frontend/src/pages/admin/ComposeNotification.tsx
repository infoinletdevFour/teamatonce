import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, X, Plus, Users, User, Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { sendBulkNotification } from '@/services/adminService';
import { toast } from 'sonner';

type SendMode = 'audience' | 'individual';
type Priority = 'low' | 'normal' | 'high';

const AdminComposeNotification: React.FC = () => {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>('audience');
  const [individualEmails, setIndividualEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'all' as 'all' | 'clients' | 'sellers',
    actionUrl: '',
    priority: 'normal' as Priority,
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
    if (!formData.title || !formData.message) {
      toast.error('Please fill in title and message');
      return;
    }

    if (sendMode === 'individual' && individualEmails.length === 0) {
      toast.error('Please add at least one email address');
      return;
    }

    try {
      setSending(true);
      const result = await sendBulkNotification({
        title: formData.title,
        message: formData.message,
        targetAudience: formData.targetAudience,
        actionUrl: formData.actionUrl || undefined,
        priority: formData.priority,
        ...(sendMode === 'individual' && { individualEmails }),
      });

      toast.success(`Notification sent to ${result.sentCount} user(s)`);
      navigate('/admin/communications');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'normal':
        return <Info className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/communications')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Send Notification</h1>
          <p className="text-gray-500">Send push notifications to users</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6"
      >
        {/* Send Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Send To *</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSendMode('audience')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                sendMode === 'audience'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-5 h-5 ${sendMode === 'audience' ? 'text-purple-600' : 'text-gray-400'}`} />
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
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className={`w-5 h-5 ${sendMode === 'individual' ? 'text-purple-600' : 'text-gray-400'}`} />
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
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Users</option>
              <option value="clients">Clients Only</option>
              <option value="sellers">Sellers Only</option>
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={addEmail}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
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

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notification Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., New Feature Available!"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Enter your notification message..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <div className="grid grid-cols-3 gap-3">
            {(['low', 'normal', 'high'] as Priority[]).map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => setFormData({ ...formData, priority })}
                className={`p-3 rounded-lg border-2 text-center transition-all flex items-center justify-center gap-2 ${
                  formData.priority === priority
                    ? priority === 'high'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : priority === 'normal'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                {getPriorityIcon(priority)}
                <span className="capitalize font-medium">{priority}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action URL (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Action URL (Optional)</label>
          <input
            type="text"
            value={formData.actionUrl}
            onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
            placeholder="e.g., /dashboard or /projects/123"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="mt-1 text-xs text-gray-500">Where the user will be taken when clicking the notification</p>
        </div>

        {/* Preview */}
        <div className="border-t border-gray-100 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Preview</label>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                formData.priority === 'high' ? 'bg-red-100' :
                formData.priority === 'normal' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <Bell className={`w-5 h-5 ${
                  formData.priority === 'high' ? 'text-red-600' :
                  formData.priority === 'normal' ? 'text-blue-600' : 'text-green-600'
                }`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {formData.title || 'Notification Title'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.message || 'Your notification message will appear here...'}
                </p>
                {formData.actionUrl && (
                  <p className="text-xs text-blue-600 mt-2">Click to open: {formData.actionUrl}</p>
                )}
              </div>
            </div>
          </div>
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
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default AdminComposeNotification;
