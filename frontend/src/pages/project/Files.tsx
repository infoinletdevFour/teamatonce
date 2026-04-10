import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Search,
  Grid3x3,
  List,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  Code,
  File as FileIcon,
  X,
  Share2,
  Loader2,
} from 'lucide-react';
import * as fileService from '@/services/fileService';
import { getProjectStats } from '@/services/projectService';
import { useProjectRole } from '@/hooks/useProjectRole';
import { AccessDenied, AccessLoading } from '@/components/project';

/**
 * File Manager Page
 * Comprehensive file management with upload, preview, and version control
 */

export const Files: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  // Check project membership using backend API
  const { hasAccess, loading: roleLoading } = useProjectRole(projectId);

  const [files, setFiles] = useState<fileService.ProjectFile[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<fileService.ProjectFile | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [filterType, setFilterType] = useState<string | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [projectStatus, setProjectStatus] = useState<string>('active');

  // Check if user is a project member (from backend)
  const isProjectMember = hasAccess;

  // Check if project is completed/ended
  const isProjectCompleted = projectStatus === 'completed' || projectStatus === 'ended';

  // Load files on component mount (only if user is a project member)
  useEffect(() => {
    if (projectId && !roleLoading && isProjectMember) {
      loadFiles();
      // Fetch project status
      getProjectStats(projectId).then((data) => {
        setProjectStatus(data.project?.status || 'active');
      }).catch(console.error);
    } else if (!roleLoading && !isProjectMember) {
      setIsLoading(false);
    }
  }, [projectId, roleLoading, isProjectMember]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fileService.getProjectFiles(projectId!);
      setFiles(response.files);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (uploadedFiles: FileList | File[]) => {
    const fileArray = Array.from(uploadedFiles);

    for (const file of fileArray) {
      // Validate file
      const validation = fileService.validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        continue;
      }

      try {
        setIsUploading(true);
        await fileService.uploadProjectFile(projectId!, file, {
          isPublic: false,
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file: ' + file.name);
      } finally {
        setIsUploading(false);
      }
    }

    // Reload files after upload
    loadFiles();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Handle file download
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await fileService.downloadFile(projectId!, fileId, fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  // Handle file delete
  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await fileService.deleteFile(projectId!, fileId);
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  // Filter and sort files
  const filteredFiles = files
    .filter((file) => {
      const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || file.fileType === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fileName.localeCompare(b.fileName);
        case 'date':
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'size':
          return b.fileSize - a.fileSize;
        case 'type':
          return a.fileType.localeCompare(b.fileType);
        default:
          return 0;
      }
    });

  const storageUsed = files.reduce((acc, file) => acc + file.fileSize, 0);
  const storageLimit = 10737418240; // 10GB
  const storagePercentage = (storageUsed / storageLimit) * 100;

  const fileTypeStats = {
    images: files.filter((f) => f.fileType === 'image').length,
    videos: files.filter((f) => f.fileType === 'video').length,
    documents: files.filter((f) => f.fileType === 'document').length,
    code: files.filter((f) => f.fileType === 'code').length,
    other: files.filter((f) => !['image', 'video', 'document', 'code'].includes(f.fileType)).length,
  };

  // Show loading while checking membership
  if (roleLoading) {
    return <AccessLoading />;
  }

  // Show access denied if user is not a project member
  if (!isProjectMember) {
    return <AccessDenied message="You don't have permission to access files for this project." />;
  }

  // Show loading while loading files
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                File Manager
              </h1>
              <p className="text-gray-600 mt-1">Organize and share project files</p>
            </div>

            {/* Storage Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-lg font-bold text-gray-900">
                  {fileService.formatFileSize(storageUsed)} / {fileService.formatFileSize(storageLimit)}
                </p>
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${storagePercentage}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {/* Search */}
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                />
              </div>

              {/* Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-semibold text-gray-700"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
                <option value="code">Code</option>
                <option value="audio">Audio</option>
                <option value="archive">Archives</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-semibold text-gray-700"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="type">Sort by Type</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Mode */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Upload - Only show if project is not completed */}
              {!isProjectCompleted && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Upload Files</span>
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-4 mt-4">
            {[
              { label: 'Images', value: fileTypeStats.images, icon: ImageIcon, color: 'purple' },
              { label: 'Videos', value: fileTypeStats.videos, icon: Video, color: 'red' },
              { label: 'Documents', value: fileTypeStats.documents, icon: FileText, color: 'blue' },
              { label: 'Code Files', value: fileTypeStats.code, icon: Code, color: 'orange' },
              { label: 'Other', value: fileTypeStats.other, icon: FileIcon, color: 'gray' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 border-2 border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
                    <p className="text-xl font-black text-gray-900 mt-0.5">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Drag & Drop Upload Zone - Only show if project is not completed */}
        <AnimatePresence>
          {isDragging && !isProjectCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="bg-white rounded-2xl p-12 shadow-2xl border-4 border-dashed border-blue-500">
                <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <p className="text-2xl font-bold text-gray-900 text-center">Drop files here to upload</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="min-h-[600px]"
        >
          {/* Files Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-500 transition-all cursor-pointer"
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      <FileIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="font-semibold text-gray-900 text-center text-sm truncate w-full">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{fileService.formatFileSize(file.fileSize)}</p>
                    <div className="flex items-center space-x-2 mt-3 w-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file.id, file.fileName);
                        }}
                        className="flex-1 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Download className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.id);
                        }}
                        className="flex-1 p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 grid grid-cols-12 gap-4 text-sm font-bold text-gray-600">
                <div className="col-span-5">Name</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Modified</div>
                <div className="col-span-1">Actions</div>
              </div>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="px-4 py-3 border-b border-gray-100 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-5 flex items-center space-x-3">
                    <FileIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-gray-900 truncate">{file.fileName}</span>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">
                    {fileService.formatFileSize(file.fileSize)}
                  </div>
                  <div className="col-span-2 text-sm text-gray-600 capitalize">{file.fileType}</div>
                  <div className="col-span-2 text-sm text-gray-600">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                  <div className="col-span-1 flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(file.id, file.fileName)}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                    >
                      <Download className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredFiles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-600 mb-6">
                {isProjectCompleted ? 'This project has been completed' : 'Upload files or adjust your filters'}
              </p>
              {!isProjectCompleted && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Upload Your First File
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFile(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedFile.fileName}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{fileService.formatFileSize(selectedFile.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(selectedFile.uploadedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Version {selectedFile.version}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* Tags */}
                {selectedFile.tags && selectedFile.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedFile.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700 rounded-full text-sm font-semibold border border-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* File Preview */}
                <div className="bg-gray-100 rounded-xl p-2 mb-6 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden">
                  {selectedFile.fileType === 'image' ? (
                    <img
                      src={selectedFile.fileUrl}
                      alt={selectedFile.fileName}
                      className="max-w-full max-h-[480px] object-contain rounded-lg"
                    />
                  ) : selectedFile.fileType === 'video' ? (
                    <video
                      src={selectedFile.fileUrl}
                      controls
                      className="max-w-full max-h-[480px] rounded-lg"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : selectedFile.fileType === 'audio' ? (
                    <div className="text-center p-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileIcon className="w-12 h-12 text-white" />
                      </div>
                      <audio src={selectedFile.fileUrl} controls className="w-full mt-4">
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : selectedFile.mimeType === 'application/pdf' ? (
                    <iframe
                      src={selectedFile.fileUrl}
                      title={selectedFile.fileName}
                      className="w-full h-[480px] rounded-lg"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <FileIcon className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">File type: {selectedFile.fileType}</p>
                      <p className="text-sm text-gray-500 mt-2">{selectedFile.mimeType}</p>
                    </div>
                  )}
                </div>

                {/* File Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-bold text-gray-600 mb-2">Uploaded By</h4>
                    <p className="text-gray-900 font-semibold">{selectedFile.uploadedBy}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-600 mb-2">File Type</h4>
                    <p className="text-gray-900 font-semibold capitalize">{selectedFile.fileType}</p>
                    <p className="text-xs text-gray-500">{selectedFile.mimeType}</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center space-x-2">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDelete(selectedFile.id)}
                    className="px-4 py-2 border-2 border-red-200 text-red-700 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => handleDownload(selectedFile.id, selectedFile.fileName)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Files;
