import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import TodoNavbar from '../components/todo1/TodoNavbar';
import CategorySidebar from '../components/todo1/CategorySidebar';
import Modal from '../components/todo1/Modal';
import CategoryForm from '../components/todo1/CategoryForm';
import TaskForm from '../components/todo1/TaskForm';
import { Category, Task } from '../types/todo1';
import { useCategoryManager } from '../hooks/todo1/useCategories';
import { useTaskManager } from '../hooks/todo1/useTasks';

const Todo1Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  // Use API hooks instead of local state
  const categoryManager = useCategoryManager();
  const taskManager = useTaskManager(categoryManager.selectedCategoryId);
  
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Category Handlers
  const handleOpenCategoryModal = (category: Category | null = null) => {
    setEditingCategory(category);
    setCategoryModalOpen(true);
  };
  const handleCloseCategoryModal = () => {
    setCategoryModalOpen(false);
    setEditingCategory(null);
  };
  const handleCategorySubmit = async (categoryData: Partial<Category>) => {
    try {
      if (editingCategory) {
        await categoryManager.updateCategory(editingCategory.id, categoryData);
      } else {
        await categoryManager.createCategory(categoryData as Omit<Category, 'id' | 'createdAt' | 'updatedAt'>);
      }
      handleCloseCategoryModal();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };
  const handleDeleteCategory = async (id: string) => {
    try {
      await categoryManager.deleteCategory(id);
      // Auto-select another category if the deleted one was selected
      if (categoryManager.selectedCategoryId === id && categoryManager.categories.length > 1) {
        const remainingCategories = categoryManager.categories.filter(c => c.id !== id);
        if (remainingCategories.length > 0) {
          categoryManager.selectCategory(remainingCategories[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  // Task Handlers
  const handleOpenTaskModal = (task: Task | null = null) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };
  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
  };
  const handleTaskSubmit = async (taskData: Partial<Task>) => {
    if (!categoryManager.selectedCategoryId) return;
    
    try {
      if (editingTask) {
        await taskManager.updateTask(editingTask.id, taskData);
      } else {
        await taskManager.createTask({
          ...taskData,
          categoryId: categoryManager.selectedCategoryId,
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          isActive: true,
        } as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
      }
      handleCloseTaskModal();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };
  const handleDeleteTask = async (id: string) => {
    try {
      await taskManager.deleteTask(id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        tasks: taskManager.tasks,
        onAddTask: () => handleOpenTaskModal(),
        onEditTask: handleOpenTaskModal,
        onDeleteTask: handleDeleteTask,
        loading: taskManager.loading,
        error: taskManager.error,
      } as any);
    }
    return child;
  });

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <CategorySidebar 
        categories={categoryManager.categories} 
        onSelectCategory={categoryManager.selectCategory}
        onAddCategory={() => handleOpenCategoryModal()}
        onEditCategory={handleOpenCategoryModal}
        onDeleteCategory={handleDeleteCategory}
        selectedCategoryId={categoryManager.selectedCategoryId}
        loading={categoryManager.loading}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TodoNavbar theme={theme} toggleTheme={toggleTheme} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-950 p-4">
          {childrenWithProps}
        </main>
      </div>
      <Modal isOpen={isCategoryModalOpen} onClose={handleCloseCategoryModal} title={editingCategory ? 'Edit Category' : 'Add Category'}>
        <CategoryForm onSubmit={handleCategorySubmit} category={editingCategory} />
      </Modal>
      <Modal isOpen={isTaskModalOpen} onClose={handleCloseTaskModal} title={editingTask ? 'Edit Task' : 'Add Task'}>
        <TaskForm onSubmit={handleTaskSubmit} task={editingTask} />
      </Modal>
    </div>
  );
};

export default Todo1Layout;
