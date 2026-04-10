import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderKanban } from 'lucide-react';

const AdminProjectDetail: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/projects')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Details</h1>
          <p className="text-gray-500">Project ID: {projectId}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
        <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Project detail view with milestones coming soon</p>
      </div>
    </div>
  );
};

export default AdminProjectDetail;
