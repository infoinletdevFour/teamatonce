import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Shield,
  Send,
  Trash2,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import DataTable, { Column } from '@/components/data-engine/DataTable';
import * as api from '@/services/dataEngineService';
import type { SesConfig, BlocklistEntry } from '@/types/data-engine';

const reasonColors: Record<string, string> = {
  unsubscribed: 'bg-orange-100 text-orange-700',
  bounced: 'bg-red-100 text-red-700',
  manual: 'bg-gray-100 text-gray-700',
  complaint: 'bg-purple-100 text-purple-700',
};

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <SesConfigSection />
      <BlocklistSection />
    </div>
  );
};

// ============================================
// SES Configuration
// ============================================

const SesConfigSection: React.FC = () => {
  const [config, setConfig] = useState<SesConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendForm, setSendForm] = useState({
    to: '',
    subject: '',
    html: '',
    text: '',
    from: '',
    fromName: '',
    replyTo: '',
  });
  const [sendLoading, setSendLoading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const c = await api.getSesConfig();
        setConfig(c);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load SES config');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSendTest = async () => {
    if (!testEmail) return;
    try {
      setTestLoading(true);
      await api.sendTestEmail({ email: testEmail });
      toast.success('Test email sent');
      setTestEmail('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!sendForm.to || !sendForm.subject || !sendForm.html) {
      toast.error('To, subject, and HTML are required');
      return;
    }
    try {
      setSendLoading(true);
      const cleanForm: Record<string, unknown> = {};
      Object.entries(sendForm).forEach(([k, v]) => {
        if (v) cleanForm[k] = v;
      });
      await api.sendEmail(cleanForm as any);
      toast.success('Email sent');
      setShowSendForm(false);
      setSendForm({ to: '', subject: '', html: '', text: '', from: '', fromName: '', replyTo: '' });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
        <Mail className="w-5 h-5 text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-900">SES Configuration</h2>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        ) : config ? (
          <>
            {/* Config Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">SMTP Host</p>
                <p className="text-sm font-medium text-gray-900">{config.host || 'Not configured'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Status</p>
                <p className={`text-sm font-medium ${config.configured ? 'text-green-600' : 'text-red-600'}`}>
                  {config.configured ? 'Configured' : 'Not Configured'}
                </p>
              </div>
            </div>

            {/* Test Email */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Send Test Email</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendTest}
                  disabled={testLoading || !testEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {testLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Test
                </button>
              </div>
            </div>

            {/* Send Email Form */}
            <div>
              <button
                onClick={() => setShowSendForm(!showSendForm)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {showSendForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Send Custom Email
              </button>

              {showSendForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">To *</label>
                      <input
                        type="email"
                        value={sendForm.to}
                        onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
                      <input
                        type="text"
                        value={sendForm.subject}
                        onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">HTML *</label>
                    <textarea
                      value={sendForm.html}
                      onChange={(e) => setSendForm({ ...sendForm, html: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text (optional)</label>
                    <textarea
                      value={sendForm.text}
                      onChange={(e) => setSendForm({ ...sendForm, text: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                      <input
                        type="email"
                        value={sendForm.from}
                        onChange={(e) => setSendForm({ ...sendForm, from: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">From Name</label>
                      <input
                        type="text"
                        value={sendForm.fromName}
                        onChange={(e) => setSendForm({ ...sendForm, fromName: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Reply-To</label>
                      <input
                        type="email"
                        value={sendForm.replyTo}
                        onChange={(e) => setSendForm({ ...sendForm, replyTo: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSendEmail}
                    disabled={sendLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sendLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Email
                  </button>
                </motion.div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  );
};

// ============================================
// Blocklist
// ============================================

const BlocklistSection: React.FC = () => {
  const [entries, setEntries] = useState<BlocklistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState('manual');
  const [addLoading, setAddLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchBlocklist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getBlocklist({ limit: 20, offset });
      setEntries(result.data || []);
      setTotal(result.meta?.total ?? result.data?.length ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load blocklist');
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => { fetchBlocklist(); }, [fetchBlocklist]);

  useEffect(() => {
    const handler = () => fetchBlocklist();
    window.addEventListener('data-engine-refresh', handler);
    return () => window.removeEventListener('data-engine-refresh', handler);
  }, [fetchBlocklist]);

  const handleAdd = async () => {
    if (!newEmail) return;
    try {
      setAddLoading(true);
      await api.addToBlocklist({ email: newEmail, reason: newReason });
      toast.success('Added to blocklist');
      setNewEmail('');
      fetchBlocklist();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add to blocklist');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (email: string) => {
    try {
      await api.removeFromBlocklist(email);
      toast.success('Removed from blocklist');
      setConfirmDelete(null);
      fetchBlocklist();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove from blocklist');
    }
  };

  const columns: Column<BlocklistEntry>[] = [
    {
      key: 'email',
      header: 'Email',
      render: (e) => <span className="font-medium">{e.email}</span>,
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (e) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${reasonColors[e.reason] || 'bg-gray-100 text-gray-700'}`}>
          {e.reason}
        </span>
      ),
    },
    {
      key: 'sourceCampaignId',
      header: 'Campaign',
      render: (e) => e.sourceCampaignId ? <span className="text-xs font-mono">{e.sourceCampaignId.slice(0, 8)}...</span> : '-',
    },
    {
      key: 'createdAt',
      header: 'Blocked At',
      render: (e) => new Date(e.createdAt).toLocaleString(),
    },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <button
          onClick={(ev) => { ev.stopPropagation(); setConfirmDelete(e.email); }}
          className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-600" />
          <h2 className="text-sm font-semibold text-gray-900">Email Blocklist</h2>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{total}</span>
        </div>
      </div>

      {/* Add Form */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="manual">Manual</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
            <option value="complaint">Complaint</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={addLoading || !newEmail}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {addLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        error={error || undefined}
        total={total}
        limit={20}
        offset={offset}
        onPageChange={setOffset}
        onRetry={fetchBlocklist}
        emptyMessage="Blocklist is empty"
      />

      {/* Confirm Delete Dialog */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove from Blocklist</h3>
              <p className="text-sm text-gray-600 mb-4">
                Remove <strong>{confirmDelete}</strong> from the blocklist? This will allow emails to be sent to this address again.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={() => handleRemove(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Settings;
