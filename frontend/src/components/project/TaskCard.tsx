import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageCircle, Paperclip, User, Flag } from 'lucide-react';
import { Task } from '@/lib/types/project';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

const priorityIcons = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, isDragging }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      onClick={onClick}
      className={`bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm cursor-pointer transition-all ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      {/* Priority & Title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{task.title}</h3>
          {task.description && (
            <div
              className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: task.description }}
            />
          )}
        </div>
        <Flag className={`w-4 h-4 ml-2 flex-shrink-0 ${priorityIcons[task.priority]}`} />
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700 rounded-full border border-gray-200"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-3">
          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(task.dueDate, 'MMM d')}</span>
            </div>
          )}

          {/* Comments */}
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{task.comments.length}</span>
            </div>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center space-x-1">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Assignee */}
        {task.assignee ? (
          <div className="flex items-center space-x-1">
            {task.assignee.avatar ? (
              <img
                src={task.assignee.avatar}
                alt={task.assignee.name}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
                {task.assignee.name.charAt(0)}
              </div>
            )}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
            <User className="w-3 h-3 text-gray-400" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
