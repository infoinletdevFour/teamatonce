import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelpCircle, Plus, Edit, Trash2, RefreshCw, Eye, EyeOff, GripVertical } from 'lucide-react';
import { getFaqs, deleteFaq, updateFaq } from '@/services/adminService';
import { FAQ } from '@/types/admin';
import { toast } from 'sonner';

const AdminFaqs: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const data = await getFaqs({ includeUnpublished: true });
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const handleDelete = async (faqId: string, question: string) => {
    if (!confirm(`Delete FAQ: "${question.substring(0, 50)}..."?`)) return;
    try {
      await deleteFaq(faqId);
      toast.success('FAQ deleted');
      fetchFaqs();
    } catch {
      toast.error('Failed to delete FAQ');
    }
  };

  const handleTogglePublish = async (faq: FAQ) => {
    try {
      await updateFaq(faq.id, { isPublished: !faq.isPublished });
      toast.success(faq.isPublished ? 'FAQ unpublished' : 'FAQ published');
      fetchFaqs();
    } catch {
      toast.error('Failed to update FAQ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-gray-500 mt-1">Manage help center FAQs</p>
        </div>
        <Link to="/admin/faqs/create" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add FAQ
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : error ? (
          <div className="text-center py-12"><p className="text-red-600 mb-4">{error}</p><button onClick={fetchFaqs} className="text-blue-600">Retry</button></div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No FAQs yet</p>
            <Link to="/admin/faqs/create" className="text-blue-600 hover:underline mt-2 inline-block">Create your first FAQ</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {faqs.map((faq, index) => (
              <div key={faq.id} className="p-4 hover:bg-gray-50 flex items-start gap-4">
                <button className="p-2 text-gray-400 hover:text-gray-600 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">{faq.question}</h3>
                    {!faq.isPublished && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Draft</span>
                    )}
                    {faq.category && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{faq.category}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleTogglePublish(faq)} className={`p-2 rounded-lg transition-colors ${faq.isPublished ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title={faq.isPublished ? 'Unpublish' : 'Publish'}>
                    {faq.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <Link to={`/admin/faqs/${faq.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(faq.id, faq.question)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminFaqs;
