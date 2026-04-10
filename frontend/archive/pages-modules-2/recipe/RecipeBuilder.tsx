import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRecipes, useRecipeActions, type Recipe } from '../../hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { RecipeHeader } from '../../components/recipe/RecipeHeader';
import { RecipeTabs } from '../../components/recipe/RecipeTabs';
import { RecipeDashboard } from '../../components/recipe/RecipeDashboard';
import { RecipeList } from '../../components/recipe/RecipeList';
import { AllRecipesList } from '../../components/recipe/AllRecipesList';
import { RecipeCategories } from '../../components/recipe/RecipeCategories';
import { RecipeMealPlan } from '../../components/recipe/RecipeMealPlan';
import { RecipeAIChat } from '../../components/recipe/RecipeAIChat';
import { MealPlanList } from '../../components/meal-plan/MealPlanList';
import { ChatMessage, MealPlan } from '../../types/recipe';

const RecipeBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Only fetch user recipes if authenticated
  const { data: recipesData, loading: recipesLoading, error, refetch: refetchRecipes } = useRecipes();
  const recipes: Recipe[] = isAuthenticated ? (recipesData?.data || []) : [];
  const { toggleFavorite } = useRecipeActions(refetchRecipes);

  const loading = authLoading || (isAuthenticated && recipesLoading);

  // Get initial tab from URL params, default to 'dashboard' for auth users or 'all-recipes' for guests
  const getInitialTab = (): 'dashboard' | 'recipes' | 'all-recipes' | 'categories' | 'meal-plan' | 'ai-chat' => {
    const tab = searchParams.get('tab');
    const validTabs = ['dashboard', 'recipes', 'all-recipes', 'categories', 'meal-plan', 'ai-chat'];

    if (validTabs.includes(tab || '')) {
      // If unauthenticated and trying to access protected tab, redirect to all-recipes
      if (!isAuthenticated && tab !== 'all-recipes') {
        return 'all-recipes';
      }
      return tab as any;
    }

    // Default: authenticated users see dashboard, guests see all-recipes
    return isAuthenticated ? 'dashboard' : 'all-recipes';
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'recipes' | 'all-recipes' | 'categories' | 'meal-plan' | 'ai-chat'>(getInitialTab());

  // Function to change tab and update URL
  const changeTab = (tab: 'dashboard' | 'recipes' | 'all-recipes' | 'categories' | 'meal-plan' | 'ai-chat') => {
    // If not authenticated and trying to access protected tabs, redirect to login
    if (!isAuthenticated && tab !== 'all-recipes') {
      navigate('/login');
      return;
    }
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Sync tab with URL changes (browser back/forward)
  useEffect(() => {
    const currentTab = getInitialTab();
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  // Check authentication - only redirect if not loading, not authenticated, and not on all-recipes tab
  useEffect(() => {
    if (!authLoading && !isAuthenticated && activeTab !== 'all-recipes') {
      navigate('/login');
      return;
    }
  }, [authLoading, isAuthenticated, activeTab, navigate]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCuisine, setFilterCuisine] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  
  // Meal plan state
  const [mealPlan, setMealPlan] = useState<MealPlan>({
    Monday: {},
    Tuesday: {},
    Wednesday: {},
    Thursday: {},
    Friday: {},
    Saturday: {},
    Sunday: {}
  });

  // AI Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI cooking assistant. I can help you find recipes, suggest meal plans, answer cooking questions, and more. What would you like to cook today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleToggleFavorite = async (recipeId: string, isCurrentlyFavorited: boolean) => {
    try {
      await toggleFavorite(recipeId, isCurrentlyFavorited, () => {
        // Force refetch of recipes to update the UI
        refetchRecipes();
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                         (recipe.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                         (recipe.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) || false);
    const matchesCuisine = filterCuisine === 'all' || recipe.cuisine === filterCuisine;
    const matchesDifficulty = filterDifficulty === 'all' || recipe.difficulty === filterDifficulty;
    return matchesSearch && matchesCuisine && matchesDifficulty;
  });

  // Get unique cuisines and difficulties
  const cuisines = Array.from(new Set(recipes.map(recipe => recipe.cuisine).filter(Boolean))) as string[];

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(message),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    if (message.includes('recipe') || message.includes('cook')) {
      return "I'd be happy to help you with recipes! Based on your preferences, I can suggest some delicious options. Are you looking for something quick and easy, or do you have time for a more elaborate dish?";
    } else if (message.includes('ingredient')) {
      return "Great question about ingredients! I can help you substitute ingredients, suggest alternatives, or find recipes based on what you have. What ingredients are you working with?";
    } else if (message.includes('meal plan')) {
      return "I can definitely help you create a meal plan! Would you like me to suggest a weekly plan based on your preferences, dietary requirements, or cooking time available?";
    }
    return "That's interesting! I'm here to help with all your cooking and recipe needs. Feel free to ask me about recipes, cooking techniques, meal planning, or ingredient substitutions.";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <RecipeHeader 
        title="Recipe Builder"
        subtitle="Create, manage and discover amazing recipes"
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <RecipeTabs
            activeTab={activeTab}
            onTabChange={changeTab}
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="ml-4 text-lg">
              {authLoading ? 'Checking authentication...' : 'Loading recipes...'}
            </span>
          </div>
        )}

        {/* Error State - Only show for authenticated users on protected tabs */}
        {error && isAuthenticated && activeTab !== 'all-recipes' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading recipes
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Not Authenticated - Only show on protected tabs */}
        {!authLoading && !isAuthenticated && activeTab !== 'all-recipes' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Please log in to access Recipe Builder
            </h2>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'dashboard' && !authLoading && isAuthenticated && !recipesLoading && (
          <RecipeDashboard
            recipes={recipes}
            onNavigate={navigate}
          />
        )}

        {activeTab === 'recipes' && !authLoading && isAuthenticated && !recipesLoading && (
          <RecipeList
            recipes={filteredRecipes}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterCuisine={filterCuisine}
            onCuisineChange={setFilterCuisine}
            filterDifficulty={filterDifficulty}
            onDifficultyChange={setFilterDifficulty}
            cuisines={cuisines}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={navigate}
          />
        )}

        {activeTab === 'all-recipes' && (
          <AllRecipesList />
        )}

        {activeTab === 'categories' && !authLoading && isAuthenticated && !recipesLoading && (
          <RecipeCategories
            recipes={recipes}
            onNavigate={navigate}
          />
        )}

        {activeTab === 'meal-plan' && !authLoading && isAuthenticated && !recipesLoading && (
          <div className="space-y-6">
            <MealPlanList 
              onViewDetails={(mealPlan) => {
                // Handle view details - could open a dialog or navigate
                console.log('View meal plan:', mealPlan);
              }}
              onEdit={(mealPlan) => {
                // Handle edit - could open edit dialog
                console.log('Edit meal plan:', mealPlan);
              }}
            />
          </div>
        )}

        {activeTab === 'ai-chat' && !authLoading && isAuthenticated && (
          <RecipeAIChat
            messages={messages}
            inputMessage={inputMessage}
            onInputChange={setInputMessage}
            onSendMessage={handleSendMessage}
            messagesEndRef={messagesEndRef}
          />
        )}
      </main>
    </div>
  );
};

export default RecipeBuilder;