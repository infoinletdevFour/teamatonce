import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, HelpCircle, RefreshCw } from 'lucide-react';
import { createFaq, updateFaq, getFaq } from '@/services/adminService';
import { toast } from 'sonner';

const FAQ_CATEGORIES = ['General', 'Account', 'Billing', 'Projects', 'Jobs', 'Technical', 'Other'];

const AdminFaqForm: React.FC = () => {
  const { faqId } = useParams<{ faqId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(faqId);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    isPublished: false,
  });

  useEffect(() => {
    if (isEditing && faqId) {
      fetchFaq();
    }
  }, [faqId, isEditing]);

  const fetchFaq = async () => {
    try {
      setFetching(true);
      const faq = await getFaq(faqId!);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || 'General',
        isPublished: faq.isPublished,
      });
    } catch (err) {
      toast.error('Failed to load FAQ');
      navigate('/admin/faqs');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    try {
      setLoading(true);
      if (isEditing && faqId) {
        await updateFaq(faqId, formData);
        toast.success('FAQ updated successfully');
      } else {
        await createFaq(formData);
        toast.success('FAQ created successfully');
      }
      navigate('/admin/faqs');
    } catch (err) {
      toast.error(isEditing ? 'Failed to update FAQ' : 'Failed to create FAQ');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/faqs')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit FAQ' : 'Create FAQ'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Update the FAQ details' : 'Add a new FAQ to the help center'}
          </p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter the FAQ question..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Answer <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            rows={8}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter the answer..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">You can use plain text. Markdown is not supported.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {FAQ_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Publish immediately</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.isPublished
                ? 'This FAQ will be visible in the help center'
                : 'This FAQ will be saved as a draft'}
            </p>
          </div>
        </div>

        {/* Preview */}
        {(formData.question || formData.answer) && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">{formData.question || 'Your question here...'}</h4>
                  <p className="text-gray-600 mt-2 whitespace-pre-wrap">{formData.answer || 'Your answer here...'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/faqs')}
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? 'Update FAQ' : 'Create FAQ'}
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default AdminFaqForm;
