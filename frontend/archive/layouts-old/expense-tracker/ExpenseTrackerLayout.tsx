import React from 'react';
import { Receipt, Dashboard, Analytics, AccountBalance, Add } from '@mui/icons-material';
import { Button } from '../../components/ui/button';
import { TabType } from '../../types/expense-tracker';
import Header from '../../components/landing/Header';

interface ExpenseTrackerLayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onAddExpense: () => void;
}

export const ExpenseTrackerLayout: React.FC<ExpenseTrackerLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onAddExpense,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Landing Page Header */}
      <Header />
      
      {/* Expense Tracker Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <nav className="flex space-x-8 -mb-px">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Dashboard className="h-5 w-5" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'expenses'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Receipt className="h-5 w-5" />
                My Expenses
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Analytics className="h-5 w-5" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('budget')}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'budget'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <AccountBalance className="h-5 w-5" />
                Budget
              </button>
            </nav>
            
            <Button
              onClick={onAddExpense}
              className="my-2"
            >
              <Add className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};