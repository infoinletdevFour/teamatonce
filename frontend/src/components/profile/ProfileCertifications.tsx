/**
 * Profile Certifications Tab
 * Professional certifications and credentials
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Trash2, X, Calendar, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileTabProps, Certification } from '@/types/profile';

const ProfileCertifications: React.FC<ProfileTabProps> = ({
  profile,
  editedProfile,
  isEditing,
  setEditedProfile
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCertification, setNewCertification] = useState<Certification>({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: ''
  });

  const addCertification = () => {
    if (!newCertification.name.trim()) {
      toast.error('Certification name is required');
      return;
    }
    if (!newCertification.issuer.trim()) {
      toast.error('Issuing organization is required');
      return;
    }
    if (!newCertification.issueDate) {
      toast.error('Issue date is required');
      return;
    }

    // Validate expiry date if provided
    if (newCertification.expiryDate) {
      const issueDate = new Date(newCertification.issueDate);
      const expiryDate = new Date(newCertification.expiryDate);
      if (expiryDate <= issueDate) {
        toast.error('Expiry date must be after issue date');
        return;
      }
    }

    // Validate URL if provided
    if (newCertification.credentialUrl && newCertification.credentialUrl.trim()) {
      try {
        new URL(newCertification.credentialUrl);
      } catch {
        toast.error('Please enter a valid credential URL');
        return;
      }
    }

    setEditedProfile({
      ...editedProfile,
      certifications: [...editedProfile.certifications, { ...newCertification, id: Date.now().toString() }]
    });

    setNewCertification({
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: ''
    });
    setIsAddingNew(false);
    toast.success('Certification added');
  };

  const removeCertification = (id: string) => {
    setEditedProfile({
      ...editedProfile,
      certifications: editedProfile.certifications.filter(c => c.id !== id)
    });
    toast.success('Certification removed');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Award className="w-7 h-7 text-blue-600" />
          Certifications & Credentials
        </h3>
        {isEditing && !isAddingNew && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Certification
          </motion.button>
        )}
      </div>

      {/* Add New Certification Form */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Add Certification</h4>
              <button onClick={() => setIsAddingNew(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Certification Name *</label>
                <input
                  type="text"
                  value={newCertification.name}
                  onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                  placeholder="E.g., AWS Certified Solutions Architect, PMP"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Issuing Organization *</label>
                <input
                  type="text"
                  value={newCertification.issuer}
                  onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                  placeholder="E.g., Amazon Web Services, PMI"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Date *</label>
                <input
                  type="month"
                  value={newCertification.issueDate}
                  onChange={(e) => setNewCertification({ ...newCertification, issueDate: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date (optional)</label>
                <input
                  type="month"
                  value={newCertification.expiryDate}
                  onChange={(e) => setNewCertification({ ...newCertification, expiryDate: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if it doesn't expire</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Credential ID (optional)</label>
                <input
                  type="text"
                  value={newCertification.credentialId}
                  onChange={(e) => setNewCertification({ ...newCertification, credentialId: e.target.value })}
                  placeholder="E.g., AWS-12345-67890"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Credential URL (optional)</label>
                <input
                  type="url"
                  value={newCertification.credentialUrl}
                  onChange={(e) => setNewCertification({ ...newCertification, credentialUrl: e.target.value })}
                  placeholder="https://verify.example.com/credential"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addCertification}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold"
              >
                Add Certification
              </button>
              <button
                onClick={() => setIsAddingNew(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certifications List */}
      {editedProfile.certifications.length > 0 ? (
        <div className="space-y-6">
          {editedProfile.certifications.map((cert) => (
            <motion.div
              key={cert.id}
              whileHover={{ scale: 1.01 }}
              className="relative pl-8 pb-6 border-l-2 border-blue-200 last:border-l-0"
            >
              {/* Timeline Dot */}
              <div className={`absolute left-0 top-0 w-4 h-4 rounded-full -translate-x-[9px] ring-4 ring-white ${
                isExpired(cert.expiryDate) ? 'bg-gray-400' : 'bg-blue-600'
              }`} />

              <div className={`bg-gradient-to-r rounded-xl p-6 border-2 ${
                isExpired(cert.expiryDate)
                  ? 'from-gray-50 to-gray-100 border-gray-300'
                  : 'from-gray-50 to-blue-50 border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xl font-bold text-gray-900">{cert.name}</h4>
                      {!isExpired(cert.expiryDate) && (
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                      )}
                      {isExpired(cert.expiryDate) && (
                        <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="text-lg text-blue-700 font-semibold">{cert.issuer}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                        title="View Credential"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                    {isEditing && (
                      <button
                        onClick={() => cert.id && removeCertification(cert.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Issued: {formatDate(cert.issueDate)}
                  </div>
                  {cert.expiryDate && (
                    <div className={`flex items-center gap-1 ${isExpired(cert.expiryDate) ? 'text-red-600' : ''}`}>
                      <Calendar className="w-4 h-4" />
                      {isExpired(cert.expiryDate) ? 'Expired' : 'Expires'}: {formatDate(cert.expiryDate)}
                    </div>
                  )}
                  {!cert.expiryDate && (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                      No Expiration
                    </span>
                  )}
                </div>

                {cert.credentialId && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-semibold">Credential ID:</span> {cert.credentialId}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Award className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No certifications added yet</p>
          <p className="text-gray-400 text-sm mt-2">
            {isEditing ? 'Click "Add Certification" to showcase your credentials' : 'Add your certifications to build trust'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileCertifications;
