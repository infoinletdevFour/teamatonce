import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Plus, Clock, ChefHat } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useCreateMealPlan } from '../../hooks/useMealPlans';
import { CreateMealPlanDto, MealPlanMeal, MealType } from '../../types/mealPlan';
import { toast } from '../../components/ui/use-toast';
import { useTheme } from '../../contexts/ThemeContext';

const CreateMealPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [selectedStartDate, setSelectedStartDate] = useState(new Date());
  
  const createMealPlan = useCreateMealPlan(() => {
    // On success, navigate back to meal planner
    navigate('/recipe-builder?tab=meal-plan');
  });

  // Initialize weekly meals structure
  const getWeekDates = (start: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedStartDate);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleCreatePlan = async () => {
    // Validate required fields
    if (!planName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your meal plan',
        variant: 'destructive',
      });
      return;
    }

    if (!planDescription.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please enter a description for your meal plan',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Calculate end date (6 days after start date for a week)
      const endDate = new Date(selectedStartDate);
      endDate.setDate(endDate.getDate() + 6);

      const planData: CreateMealPlanDto = {
        name: planName.trim(),
        description: planDescription.trim(),
        planType: 'weekly',
        startDate: selectedStartDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        meals: [],
        tags: []
      };

      await createMealPlan.mutateAsync(planData);

      toast({
        title: 'Success',
        description: 'Meal plan created successfully!',
      });

      // Reset form
      setPlanName('');
      setPlanDescription('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create meal plan',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/recipe-builder?tab=meal-plan')}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Create Meal Plan</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Plan your weekly meals</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-8">
          {/* Basic Information */}
          <Card className="rounded-2xl">
            <CardContent className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Meal Plan Details</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter the basic information for your meal plan
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meal Plan Name *
                  </label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g., Healthy Week Plan"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description *
                  </label>
                  <textarea
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    placeholder="Add notes about this meal plan..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Week Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={selectedStartDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedStartDate(new Date(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Week Preview */}
          <Card className="rounded-2xl">
            <CardContent className="p-8 space-y-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5" />
                  Week Overview
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your meal plan will cover the following week
                </p>
              </div>
              
              <div className="grid grid-cols-7 gap-4 text-center">
                {weekDates.map((date, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="font-medium text-sm">{dayNames[date.getDay()]}</div>
                    <div className="text-gray-500 text-xs mt-1">
                      {date.getDate()}/{date.getMonth() + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create Plan Card */}
          <Card className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-primary transition-colors">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Create Your Meal Plan</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create an empty meal plan and add recipes later through the edit functionality
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/recipe-builder?tab=meal-plan')}
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePlan}
                  disabled={createMealPlan.loading}
                  className="px-8"
                >
                  {createMealPlan.loading ? 'Creating...' : 'Create Meal Plan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateMealPlanPage;