import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Plus,
  X,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Edit,
  RefreshCw,
  Users,
  Mail,
  MousePointerClick,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import StatsCard from '@/components/data-engine/StatsCard';
import DataTable, { Column } from '@/components/data-engine/DataTable';
import * as api from '@/services/dataEngineService';
import type {
  OutreachCampaign,
  OutreachRecipient,
  OutreachStats,
  CreateCampaignRequest,
} from '@/types/data-engine';

const campaignStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
};

const recipientStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  opened: 'bg-green-100 text-green-700',
  clicked: 'bg-purple-100 text-purple-700',
  bounced: 'bg-red-100 text-red-700',
  unsubscribed: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-700',
};

const Outreach: React.FC = () => {
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OutreachStats | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<OutreachCampaign | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = { limit: 20, offset };
      if (statusFilter) params.status = statusFilter;
      const result = await api.getCampaigns(params as any);
      setCampaigns(result.data || []);
      setTotal(result.meta?.total ?? result.data?.length ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [offset, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await api.getOutreachStats();
      setStats(s);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchCampaigns(); fetchStats(); }, [fetchCampaigns, fetchStats]);

  useEffect(() => {
    const handler = () => { fetchCampaigns(); fetchStats(); };
    window.addEventListener('data-engine-refresh', handler);
    return () => window.removeEventListener('data-engine-refresh', handler);
  }, [fetchCampaigns, fetchStats]);

  const handleAction = async (campaignId: string, action: 'send' | 'pause' | 'resume' | 'delete') => {
    try {
      switch (action) {
        case 'send': await api.sendCampaign(campaignId); break;
        case 'pause': await api.pauseCampaign(campaignId); break;
        case 'resume': await api.resumeCampaign(campaignId); break;
        case 'delete': await api.deleteCampaign(campaignId); break;
      }
      toast.success(`Campaign ${action === 'delete' ? 'deleted' : action === 'send' ? 'sending started' : action + 'd'}`);
      fetchCampaigns();
      fetchStats();
      if (action === 'delete') setSelectedCampaign(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} campaign`);
    }
  };

  const campaignColumns: Column<OutreachCampaign>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => <span className="font-medium">{c.name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${campaignStatusColors[c.status] || 'bg-gray-100 text-gray-700'}`}>
          {c.status}
        </span>
      ),
    },
    {
      key: 'totalRecipients',
      header: 'Recipients',
    },
    {
      key: 'sent',
      header: 'Sent/Total',
      render: (c) => `${c.sentCount}/${c.totalRecipients}`,
    },
    {
      key: 'openRate',
      header: 'Open Rate',
      render: (c) => c.sentCount > 0 ? `${((c.openedCount / c.sentCount) * 100).toFixed(1)}%` : '-',
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (c) => new Date(c.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={Send} label="Total Campaigns" value={stats.totalCampaigns} gradient="from-blue-500 to-cyan-500" delay={0} />
          <StatsCard icon={Mail} label="Total Sent" value={stats.totalSent} gradient="from-purple-500 to-pink-500" delay={0.05} />
          <StatsCard icon={Eye} label="Open Rate" value={`${(stats.openRate ?? 0).toFixed(1)}%`} gradient="from-green-500 to-emerald-500" delay={0.1} />
          <StatsCard icon={MousePointerClick} label="Click Rate" value={`${(stats.clickRate ?? 0).toFixed(1)}%`} gradient="from-orange-500 to-red-500" delay={0.15} />
        </div>
      )}

      {/* Campaign List */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable
          columns={campaignColumns}
          data={campaigns}
          loading={loading}
          error={error || undefined}
          total={total}
          limit={20}
          offset={offset}
          onPageChange={setOffset}
          onRowClick={setSelectedCampaign}
          onRetry={fetchCampaigns}
          emptyMessage="No campaigns yet"
        />
      </div>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCampaignModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => { setShowCreateModal(false); fetchCampaigns(); fetchStats(); }}
          />
        )}
      </AnimatePresence>

      {/* Campaign Detail Panel */}
      <AnimatePresence>
        {selectedCampaign && (
          <CampaignDetailPanel
            campaign={selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
            onAction={handleAction}
            onRefresh={() => { fetchCampaigns(); fetchStats(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// Create Campaign Modal
// ============================================

const CreateCampaignModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
}> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState<CreateCampaignRequest>({
    name: '',
    templateSubject: '',
    templateHtml: '',
    templateText: '',
    fromAddress: '',
    fromName: '',
    replyTo: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.templateSubject || !form.templateHtml) {
      toast.error('Name, subject, and HTML template are required');
      return;
    }
    try {
      setSaving(true);
      const cleanForm: Record<string, unknown> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v) cleanForm[k] = v;
      });
      await api.createCampaign(cleanForm as CreateCampaignRequest);
      toast.success('Campaign created');
      onCreated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-auto p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">New Campaign</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              type="text"
              value={form.templateSubject}
              onChange={(e) => setForm({ ...form, templateSubject: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HTML Template *</label>
            <textarea
              value={form.templateHtml}
              onChange={(e) => setForm({ ...form, templateHtml: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text Template</label>
            <textarea
              value={form.templateText}
              onChange={(e) => setForm({ ...form, templateText: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
              <input
                type="email"
                value={form.fromAddress}
                onChange={(e) => setForm({ ...form, fromAddress: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
              <input
                type="text"
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reply-To</label>
              <input
                type="email"
                value={form.replyTo}
                onChange={(e) => setForm({ ...form, replyTo: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// Campaign Detail Panel
// ============================================

const CampaignDetailPanel: React.FC<{
  campaign: OutreachCampaign;
  onClose: () => void;
  onAction: (id: string, action: 'send' | 'pause' | 'resume' | 'delete') => Promise<void>;
  onRefresh: () => void;
}> = ({ campaign, onClose, onAction, onRefresh }) => {
  const [recipients, setRecipients] = useState<OutreachRecipient[]>([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [recipientsOffset, setRecipientsOffset] = useState(0);
  const [recipientsLoading, setRecipientsLoading] = useState(true);
  const [recipientStatusFilter, setRecipientStatusFilter] = useState('');
  const [showAddRecipients, setShowAddRecipients] = useState(false);
  const [manualEmails, setManualEmails] = useState('');

  const fetchRecipients = useCallback(async () => {
    try {
      setRecipientsLoading(true);
      const params: Record<string, unknown> = { limit: 20, offset: recipientsOffset };
      if (recipientStatusFilter) params.status = recipientStatusFilter;
      const result = await api.getRecipients(campaign.id, params as any);
      setRecipients(result.data || []);
      setRecipientsTotal(result.meta?.total ?? result.data?.length ?? 0);
    } catch {
      // non-critical
    } finally {
      setRecipientsLoading(false);
    }
  }, [campaign.id, recipientsOffset, recipientStatusFilter]);

  useEffect(() => { fetchRecipients(); }, [fetchRecipients]);

  const handleAddManualRecipients = async () => {
    const lines = manualEmails.split('\n').filter(Boolean);
    const manualRecipients = lines.map((line) => {
      const [email, name] = line.split(',').map((s) => s.trim());
      return { email, name };
    });
    if (manualRecipients.length === 0) return;
    try {
      await api.addRecipients(campaign.id, { manualRecipients });
      toast.success(`Added ${manualRecipients.length} recipients`);
      setShowAddRecipients(false);
      setManualEmails('');
      fetchRecipients();
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add recipients');
    }
  };

  const handleAddFromEntities = async () => {
    try {
      await api.addRecipients(campaign.id, { entityFilter: {} });
      toast.success('Recipients added from entities');
      setShowAddRecipients(false);
      fetchRecipients();
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add recipients');
    }
  };

  const recipientColumns: Column<OutreachRecipient>[] = [
    { key: 'email', header: 'Email', render: (r) => <span className="font-medium">{r.email}</span> },
    { key: 'name', header: 'Name', render: (r) => r.name || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${recipientStatusColors[r.status] || 'bg-gray-100 text-gray-700'}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'sentAt',
      header: 'Sent At',
      render: (r) => r.sentAt ? new Date(r.sentAt).toLocaleString() : '-',
    },
    {
      key: 'openedAt',
      header: 'Opened At',
      render: (r) => r.openedAt ? new Date(r.openedAt).toLocaleString() : '-',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${campaignStatusColors[campaign.status]}`}>
              {campaign.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === 'draft' && (
              <>
                <button
                  onClick={() => onAction(campaign.id, 'send')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
                >
                  <Play className="w-3.5 h-3.5" /> Send
                </button>
                <button
                  onClick={() => onAction(campaign.id, 'delete')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}
            {campaign.status === 'active' && (
              <button
                onClick={() => onAction(campaign.id, 'pause')}
                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white text-xs font-medium rounded-lg hover:bg-yellow-700"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            )}
            {campaign.status === 'paused' && (
              <button
                onClick={() => onAction(campaign.id, 'resume')}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Resume
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Campaign Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-xs text-gray-500 mb-1">Subject</p>
            <p className="font-medium">{campaign.templateSubject}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-xs text-gray-500 mb-1">From</p>
            <p className="font-medium">{campaign.fromName ? `${campaign.fromName} <${campaign.fromAddress}>` : campaign.fromAddress || 'Default'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-blue-700">{campaign.sentCount}</p>
            <p className="text-xs text-blue-600">Sent</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-green-700">{campaign.openedCount}</p>
            <p className="text-xs text-green-600">Opened</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-purple-700">{campaign.clickedCount}</p>
            <p className="text-xs text-purple-600">Clicked</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-red-700">{campaign.bouncedCount}</p>
            <p className="text-xs text-red-600">Bounced</p>
          </div>
        </div>

        {/* Recipients */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Recipients ({recipientsTotal})</h4>
            <div className="flex items-center gap-2">
              <select
                value={recipientStatusFilter}
                onChange={(e) => { setRecipientStatusFilter(e.target.value); setRecipientsOffset(0); }}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="opened">Opened</option>
                <option value="clicked">Clicked</option>
                <option value="bounced">Bounced</option>
              </select>
              <button
                onClick={() => setShowAddRecipients(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Recipients
              </button>
            </div>
          </div>
          <DataTable
            columns={recipientColumns}
            data={recipients}
            loading={recipientsLoading}
            total={recipientsTotal}
            limit={20}
            offset={recipientsOffset}
            onPageChange={setRecipientsOffset}
            emptyMessage="No recipients yet"
          />
        </div>

        {/* Add Recipients Sub-modal */}
        <AnimatePresence>
          {showAddRecipients && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4"
              onClick={() => setShowAddRecipients(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Add Recipients</h4>
                <div className="space-y-4">
                  <button
                    onClick={handleAddFromEntities}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">From Entities</p>
                        <p className="text-xs text-gray-500">Add all entities with email addresses</p>
                      </div>
                    </div>
                  </button>
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manual (one per line: email, name)
                    </label>
                    <textarea
                      value={manualEmails}
                      onChange={(e) => setManualEmails(e.target.value)}
                      rows={5}
                      placeholder={"john@example.com, John Doe\njane@example.com, Jane Doe"}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <button
                      onClick={handleAddManualRecipients}
                      disabled={!manualEmails.trim()}
                      className="mt-2 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add Manual Recipients
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default Outreach;
