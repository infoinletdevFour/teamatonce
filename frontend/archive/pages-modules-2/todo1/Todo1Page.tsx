import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import TaskList from '../../components/todo1/TaskList';
import { Task } from '../../types/todo1';

interface Todo1PageProps {
  tasks?: Task[];
  onAddTask?: () => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  loading?: boolean;
  error?: string | null;
}

const Todo1Page: React.FC<Todo1PageProps> = ({ 
  tasks = [], 
  onAddTask = () => {},
  onEditTask = () => {},
  onDeleteTask = () => {},
  loading = false,
  error = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tasks;
    }
    
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.notes?.toLowerCase().includes(query) ||
      task.status.toLowerCase().includes(query) ||
      task.priority.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
        <button 
          onClick={onAddTask} 
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Task
        </button>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search tasks by title, notes, status, or priority..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Search Results Info */}
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {filteredTasks.length === 0 
              ? `No tasks found matching "${searchQuery}"` 
              : `${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'} found${tasks.length !== filteredTasks.length ? ` out of ${tasks.length}` : ''}`
            }
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading tasks...</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No tasks yet in this category</p>
          <button 
            onClick={onAddTask}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Create your first task
          </button>
        </div>
      ) : filteredTasks.length === 0 && searchQuery ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            No tasks match your search criteria
          </div>
          <button 
            onClick={clearSearch}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Clear search to see all tasks
          </button>
        </div>
      ) : (
        <TaskList tasks={filteredTasks} onEditTask={onEditTask} onDeleteTask={onDeleteTask} />
      )}
    </div>
  );
};

export default Todo1Page;
