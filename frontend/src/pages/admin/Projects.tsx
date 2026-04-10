import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FolderKanban, Search, RefreshCw, Eye, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { getAdminProjects, forceCloseProject } from '@/services/adminService';
import { AdminProject, PaginatedResponse } from '@/types/admin';
import { toast } from 'sonner';

const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<AdminProject> = await getAdminProjects({ page, limit: 20, search: search || undefined });
      setProjects(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [page]);

  const handleForceClose = async (projectId: string, projectName: string) => {
    const reason = prompt(`Reason for force-closing "${projectName}":`);
    if (!reason) return;
    try {
      await forceCloseProject(projectId, reason);
      toast.success('Project force-closed');
      fetchProjects();
    } catch {
      toast.error('Failed to force-close project');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
        <p className="text-gray-500 mt-1">View and manage all projects</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchProjects()} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg" />
        </div>
        <button onClick={fetchProjects} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : error ? (
          <div className="text-center py-12"><p className="text-red-600 mb-4">{error}</p><button onClick={fetchProjects} className="text-blue-600">Retry</button></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12"><FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No projects found</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{project.name}</div></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{project.clientName}</td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.progressPercentage}%` }}></div></div>
                    <span className="text-xs text-gray-500">{project.progressPercentage}%</span>
                  </td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${project.status === 'completed' ? 'bg-green-100 text-green-700' : project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{project.status}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/projects/${project.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></Link>
                      {project.status !== 'completed' && !project.forceClosedAt && (
                        <button onClick={() => handleForceClose(project.id, project.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Force Close"><XCircle className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !error && projects.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {projects.length} of {total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminProjects;
