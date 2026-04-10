import React from 'react';
import { motion } from 'framer-motion';
import {
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Folder,
  Download,
  Eye,
  Trash2,
  Clock,
} from 'lucide-react';
import { FileItem as FileItemType } from '@/lib/types/project';
import { format } from 'date-fns';

interface FileItemProps {
  file: FileItemType;
  view?: 'grid' | 'list';
  onSelect?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onPreview?: () => void;
}

const getFileIcon = (type: string, isFolder?: boolean) => {
  if (isFolder) return Folder;

  const iconMap: Record<string, any> = {
    image: Image,
    video: Video,
    audio: Music,
    document: FileText,
    code: Code,
    archive: Archive,
    other: File,
  };

  return iconMap[type] || File;
};

const getFileColor = (type: string, isFolder?: boolean) => {
  if (isFolder) return 'text-blue-500 bg-blue-50';

  const colorMap: Record<string, string> = {
    image: 'text-purple-500 bg-purple-50',
    video: 'text-red-500 bg-red-50',
    audio: 'text-green-500 bg-green-50',
    document: 'text-blue-500 bg-blue-50',
    code: 'text-orange-500 bg-orange-50',
    archive: 'text-gray-500 bg-gray-50',
    other: 'text-gray-500 bg-gray-50',
  };

  return colorMap[type] || 'text-gray-500 bg-gray-50';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const FileItem: React.FC<FileItemProps> = ({
  file,
  view = 'grid',
  onSelect,
  onDownload,
  onDelete,
  onPreview,
}) => {
  const [showActions, setShowActions] = React.useState(false);
  const IconComponent = getFileIcon(file.type, file.isFolder);
  const colorClasses = getFileColor(file.type, file.isFolder);

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
        onClick={onSelect}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-pointer group transition-colors"
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
            <IconComponent className="w-5 h-5" />
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">{file.name}</h4>
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{format(file.uploadedAt, 'MMM d, yyyy')}</span>
              <span>•</span>
              <span className="truncate">{file.uploadedBy.name}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-1"
          >
            {!file.isFolder && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview?.();
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload?.();
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
              </>
            )}
            {file.version > 1 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                <Clock className="w-3 h-3" />
                <span>v{file.version}</span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="bg-white rounded-xl p-4 border-2 border-gray-200 cursor-pointer group transition-all relative"
    >
      {/* Thumbnail or Icon */}
      <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative">
        {file.thumbnailUrl ? (
          <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${colorClasses}`}>
            <IconComponent className="w-12 h-12" />
          </div>
        )}

        {/* Actions Overlay */}
        {showActions && !file.isFolder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center space-x-2"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview?.();
              }}
              className="p-2 bg-white rounded-lg hover:scale-110 transition-transform"
            >
              <Eye className="w-5 h-5 text-gray-900" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.();
              }}
              className="p-2 bg-white rounded-lg hover:scale-110 transition-transform"
            >
              <Download className="w-5 h-5 text-gray-900" />
            </button>
          </motion.div>
        )}
      </div>

      {/* File Info */}
      <div className="space-y-1">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-gray-900 text-sm truncate flex-1">{file.name}</h4>
          {file.version > 1 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold ml-2 flex-shrink-0">
              v{file.version}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatFileSize(file.size)}</span>
          <span>{format(file.uploadedAt, 'MMM d')}</span>
        </div>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {file.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700 rounded-full border border-gray-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete Button (Always Visible in Grid) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
        className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4 text-red-600" />
      </button>
    </motion.div>
  );
};
