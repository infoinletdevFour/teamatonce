import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { sectionPaths, extractRouteContext } from '@/lib/navigation-utils';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  DollarSign,
  Send,
  Sparkles,
  Upload,
  X,
  Calendar,
  Loader2,
  AlertCircle,
  Search,
  Star,
  Briefcase,
  ChevronRight,
  Code,
  Plus,
  Palette,
  TrendingUp,
  PenTool,
  Film,
  Music,
  Laptop,
  BarChart3,
  Camera,
  Bot,
  LucideIcon,
} from 'lucide-react';
import { createProject } from '@/services/projectService';
import type { CreateProjectData } from '@/types/project';
import { useCompanyStore } from '@/stores/companyStore';
import {
  SERVICE_CATEGORIES,
  getCategoryById,
  getSubcategoryById,
  getPopularSubcategories,
  searchCategories,
} from '@/config/service-categories';
import { searchSkills, SKILL_CATEGORIES, getCategoryForSkill } from '@/constants/skills';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface ProjectFormData {
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  skills: string[];
  budgetType: 'fixed' | 'hourly';
  budgetMin: number;
  budgetMax: number;
  duration: string;
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  startDate: string;
  preferredEndDate: string;
  requirements: string[];
  deliverables: string[];
  files: File[];
}

// Icon mapper - converts icon string names to Lucide React components
const getIconComponent = (iconName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    'Palette': Palette,
    'TrendingUp': TrendingUp,
    'PenTool': PenTool,
    'Film': Film,
    'Music': Music,
    'Laptop': Laptop,
    'Briefcase': Briefcase,
    'BarChart3': BarChart3,
    'Camera': Camera,
    'Sparkles': Sparkles,
    'Bot': Bot,
  };
  return iconMap[iconName] || Briefcase; // Default to Briefcase if icon not found
};

const EXPERIENCE_LEVELS = [
  { id: 'entry', name: 'Entry Level', description: 'New freelancers with basic skills', icon: '🌱' },
  { id: 'intermediate', name: 'Intermediate', description: 'Experienced with proven track record', icon: '⭐' },
  { id: 'expert', name: 'Expert', description: 'Top-tier professionals with extensive experience', icon: '🏆' },
];

const DURATION_OPTIONS = [
  { value: 'less-than-1-week', label: 'Less than 1 week' },
  { value: '1-2-weeks', label: '1-2 weeks' },
  { value: '2-4-weeks', label: '2-4 weeks' },
  { value: '1-3-months', label: '1-3 months' },
  { value: '3-6-months', label: '3-6 months' },
  { value: 'more-than-6-months', label: 'More than 6 months' },
  { value: 'ongoing', label: 'Ongoing / Not sure' },
];

const PostProject: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { companyId } = extractRouteContext(params);
  const { currentCompany, isLoading: companyLoading, fetchUserCompanies } = useCompanyStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    skills: [],
    budgetType: 'fixed',
    budgetMin: 0,
    budgetMax: 0,
    duration: '',
    experienceLevel: 'intermediate',
    startDate: '',
    preferredEndDate: '',
    requirements: [''],
    deliverables: [''],
    files: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Skill autocomplete state
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(-1);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const skillSuggestionsRef = useRef<HTMLDivElement>(null);
  const subcategoriesSectionRef = useRef<HTMLDivElement>(null);
  const nextStepButtonRef = useRef<HTMLDivElement>(null);

  const totalSteps = 5;

  // Get selected category and subcategory
  const selectedCategory = useMemo(() =>
    getCategoryById(formData.categoryId), [formData.categoryId]);

  const selectedSubcategory = useMemo(() =>
    getSubcategoryById(formData.categoryId, formData.subcategoryId),
    [formData.categoryId, formData.subcategoryId]
  );

  // Get available skills for selected category/subcategory
  const availableSkills = useMemo(() => {
    if (selectedSubcategory?.skills) {
      return selectedSubcategory.skills;
    }
    if (selectedCategory) {
      const skillSet = new Set<string>();
      selectedCategory.subcategories.forEach(sub => {
        sub.skills?.forEach(skill => skillSet.add(skill));
      });
      return Array.from(skillSet);
    }
    return [];
  }, [selectedCategory, selectedSubcategory]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchCategories(searchQuery).slice(0, 10);
  }, [searchQuery]);

  // Popular subcategories
  const popularServices = useMemo(() => getPopularSubcategories().slice(0, 12), []);

  // Load company data on mount
  useEffect(() => {
    fetchUserCompanies().catch(console.error);
  }, [fetchUserCompanies]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.categoryId && formData.subcategoryId;
      case 2:
        return formData.name.trim() && formData.description.trim();
      case 3:
        return formData.budgetMin > 0 && formData.budgetMax > 0 && formData.budgetMax > formData.budgetMin;
      case 4:
        return formData.duration && formData.experienceLevel;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!currentCompany) {
      setSubmitError('No company selected. Please ensure you are part of a company.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Parse duration to days
      const durationToDays: Record<string, number> = {
        'less-than-1-week': 5,
        '1-2-weeks': 10,
        '2-4-weeks': 21,
        '1-3-months': 60,
        '3-6-months': 120,
        'more-than-6-months': 180,
        'ongoing': 90,
      };

      const estimatedDays = durationToDays[formData.duration] || 30;

      // Prepare project data for backend
      const projectData: CreateProjectData = {
        name: formData.name,
        description: formData.description,
        projectType: formData.subcategoryId || formData.categoryId,
        techStack: formData.skills,
        frameworks: [],
        features: [
          ...formData.requirements.filter(r => r.trim() !== ''),
          ...formData.deliverables.filter(d => d.trim() !== ''),
        ],
        estimatedCost: formData.budgetMax || formData.budgetMin,
        budgetMin: formData.budgetMin || undefined,
        budgetMax: formData.budgetMax || undefined,
        currency: 'USD',
        estimatedDurationDays: estimatedDays,
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        expectedCompletionDate: new Date(
          Date.now() + estimatedDays * 24 * 60 * 60 * 1000
        ).toISOString().split('T')[0],
        requirements: {
          categoryId: formData.categoryId,
          subcategoryId: formData.subcategoryId,
          budgetType: formData.budgetType,
          budgetRange: {
            min: formData.budgetMin,
            max: formData.budgetMax,
          },
          duration: formData.duration,
          experienceLevel: formData.experienceLevel,
          skills: formData.skills,
          deliverables: formData.deliverables.filter(d => d.trim() !== ''),
        },
        preferredEndDate: formData.preferredEndDate || undefined,
      };

      // Create project via API
      const createdProject = await createProject(currentCompany.id, projectData);

      // Navigate to project dashboard page
      navigate(`/company/${companyId}/project/${createdProject.id}/dashboard`);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setSubmitError(err?.response?.data?.message || 'Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
  };

  const selectCategory = (categoryId: string, subcategoryId?: string) => {
    setFormData(prev => ({
      ...prev,
      categoryId,
      subcategoryId: subcategoryId || '',
      skills: [], // Reset skills when category changes
    }));
    if (subcategoryId) {
      // Auto-add suggested skills from subcategory
      const sub = getSubcategoryById(categoryId, subcategoryId);
      if (sub?.skills) {
        setFormData(prev => ({
          ...prev,
          skills: sub.skills?.slice(0, 3) || [],
        }));
      }
      // Scroll to Next Step button when subcategory is selected
      setTimeout(() => {
        nextStepButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    } else {
      // Scroll to subcategories section when only category is selected
      setTimeout(() => {
        subcategoriesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const addListItem = (field: 'requirements' | 'deliverables') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const updateListItem = (field: 'requirements' | 'deliverables', index: number, value: string) => {
    setFormData(prev => {
      const newList = [...prev[field]];
      newList[index] = value;
      return { ...prev, [field]: newList };
    });
  };

  const removeListItem = (field: 'requirements' | 'deliverables', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...Array.from(e.target.files!)],
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  // Skill autocomplete handlers
  const handleSkillSearchChange = (value: string) => {
    setSkillSearchQuery(value);
    setSelectedSkillIndex(-1);

    if (value.trim().length >= 2) {
      const suggestions = searchSkills(value, 15).filter(
        (skill) => !formData.skills.includes(skill)
      );
      setSkillSuggestions(suggestions);
      setShowSkillSuggestions(suggestions.length > 0);
    } else {
      setSkillSuggestions([]);
      setShowSkillSuggestions(false);
    }
  };

  const handleAddSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
    }
    setSkillSearchQuery('');
    setSkillSuggestions([]);
    setShowSkillSuggestions(false);
    setSelectedSkillIndex(-1);
    skillInputRef.current?.focus();
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSkillSuggestions) {
      if (e.key === 'Enter' && skillSearchQuery.trim()) {
        e.preventDefault();
        handleAddSkill(skillSearchQuery.trim());
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSkillIndex(prev =>
          prev < skillSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSkillIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSkillIndex >= 0 && skillSuggestions[selectedSkillIndex]) {
          handleAddSkill(skillSuggestions[selectedSkillIndex]);
        } else if (skillSearchQuery.trim()) {
          handleAddSkill(skillSearchQuery.trim());
        }
        break;
      case 'Escape':
        setShowSkillSuggestions(false);
        setSelectedSkillIndex(-1);
        break;
    }
  };

  // Close skill suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        skillSuggestionsRef.current &&
        !skillSuggestionsRef.current.contains(event.target as Node) &&
        skillInputRef.current &&
        !skillInputRef.current.contains(event.target as Node)
      ) {
        setShowSkillSuggestions(false);
        setSelectedSkillIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get category color for skill badge
  const getSkillCategoryColor = (skillName: string): string => {
    const category = getCategoryForSkill(skillName);
    if (!category) return 'from-gray-500 to-gray-600';

    const colorMap: Record<string, string> = {
      'graphics-design': 'from-pink-500 to-rose-500',
      'digital-marketing': 'from-orange-500 to-amber-500',
      'writing-translation': 'from-emerald-500 to-green-500',
      'video-animation': 'from-red-500 to-pink-500',
      'music-audio': 'from-purple-500 to-violet-500',
      'programming-tech': 'from-blue-500 to-cyan-500',
      'business': 'from-indigo-500 to-blue-500',
      'data-analytics': 'from-teal-500 to-cyan-500',
      'photography': 'from-amber-500 to-yellow-500',
      'lifestyle': 'from-rose-500 to-pink-500',
      'ai-services': 'from-violet-500 to-purple-500',
    };

    return colorMap[category.id] || 'from-gray-500 to-gray-600';
  };

  // ============================================
  // STEP RENDERERS
  // ============================================

  const renderStep1_CategorySelection = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">What service do you need?</h2>
        <p className="text-gray-600">Choose a category to find the right freelancer</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for any service... (e.g., logo design, web development)"
          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
        />
      </div>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg"
        >
          {searchResults.map((result, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (result.type === 'subcategory' && result.subcategory) {
                  selectCategory(result.category.id, result.subcategory.id);
                } else {
                  selectCategory(result.category.id);
                }
                setSearchQuery('');
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
            >
              {(() => {
                const IconComponent = getIconComponent(result.category.icon);
                return <IconComponent className="w-6 h-6 text-gray-600" />;
              })()}
              <div>
                <div className="font-semibold text-gray-900">
                  {result.type === 'subcategory' ? result.subcategory?.name : result.category.name}
                </div>
                <div className="text-sm text-gray-500">
                  {result.type === 'subcategory'
                    ? `in ${result.category.name}`
                    : result.category.description}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </button>
          ))}
        </motion.div>
      )}

      {/* Popular Services */}
      {!searchQuery && (
        <>
          <div>
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Quick Select - Popular Services
              </h3>
              <p className="text-sm text-gray-600">
                Click any service below to quickly select it, or browse all categories
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {popularServices.map((service) => (
                <motion.button
                  key={`${service.categoryId}-${service.id}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectCategory(service.categoryId, service.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.subcategoryId === service.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-900 text-sm">{service.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{service.categoryName}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* All Categories */}
          <div>
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 mb-2">Browse All Categories</h3>
              <p className="text-sm text-gray-600">
                Or select a category to explore all services within it
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {SERVICE_CATEGORIES.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectCategory(category.id)}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    formData.categoryId === category.id
                      ? `border-${category.color}-500 bg-gradient-to-br ${category.gradient} text-white`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="mb-3">
                    {(() => {
                      const IconComponent = getIconComponent(category.icon);
                      return (
                        <IconComponent
                          className={`w-10 h-10 ${
                            formData.categoryId === category.id ? 'text-white' : 'text-gray-700'
                          }`}
                        />
                      );
                    })()}
                  </div>
                  <div className={`font-bold ${formData.categoryId === category.id ? 'text-white' : 'text-gray-900'}`}>
                    {category.name}
                  </div>
                  <div className={`text-xs mt-1 ${formData.categoryId === category.id ? 'text-white/80' : 'text-gray-500'}`}>
                    {category.subcategories.length} services
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Subcategories for selected category */}
      {formData.categoryId && !formData.subcategoryId && selectedCategory && (
        <motion.div
          ref={subcategoriesSectionRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200"
        >
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">{selectedCategory.icon}</span>
            Choose a service in {selectedCategory.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {selectedCategory.subcategories.map((sub) => (
              <motion.button
                key={sub.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectCategory(formData.categoryId, sub.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.subcategoryId === sub.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-gray-900 text-sm">{sub.name}</div>
                <div className="text-xs text-gray-500 mt-1">{sub.description}</div>
                {sub.popular && (
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                    Popular
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Selected Service Summary */}
      {formData.subcategoryId && selectedSubcategory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${selectedCategory?.gradient} rounded-2xl p-6 text-white`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/80 text-sm">Selected Service</div>
              <div className="text-xl font-bold">{selectedSubcategory.name}</div>
              <div className="text-white/80 text-sm mt-1">in {selectedCategory?.name}</div>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, subcategoryId: '', skills: [] }))}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep2_ProjectDetails = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Describe Your Project</h2>
        <p className="text-gray-600">Tell freelancers what you need</p>
      </div>

      {/* Project Title */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Project Title *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={`e.g., ${selectedSubcategory?.name || 'Professional'} for my business`}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
        />
        <p className="text-sm text-gray-500 mt-1">Be specific and descriptive</p>
      </div>

      {/* Project Description */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Project Description *
        </label>
        <RichTextEditor
          value={formData.description}
          onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
          placeholder="Describe your project in detail. Include your goals, target audience, style preferences, and any specific requirements..."
          height={250}
          minHeight={200}
        />
        <p className="text-sm text-gray-500 mt-1">
          Use formatting to make your description clear and easy to read
        </p>
      </div>

      {/* Required Skills with Autocomplete */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Required Skills
        </label>

        {/* Selected Skills */}
        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.skills.map((skill) => {
              const category = getCategoryForSkill(skill);
              return (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl"
                >
                  <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${getSkillCategoryColor(skill)} flex items-center justify-center`}>
                    <Code className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{skill}</span>
                  {category && (
                    <span className="text-xs text-gray-500">{category.name}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Skill Search Input */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={skillInputRef}
                type="text"
                value={skillSearchQuery}
                onChange={(e) => handleSkillSearchChange(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onFocus={() => {
                  if (skillSuggestions.length > 0) {
                    setShowSkillSuggestions(true);
                  }
                }}
                placeholder="Search skills (e.g., React, Logo Design, SEO)"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSkillSuggestions && skillSuggestions.length > 0 && (
                  <motion.div
                    ref={skillSuggestionsRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl border-2 border-gray-200 shadow-xl max-h-64 overflow-y-auto"
                  >
                    {skillSuggestions.map((suggestion, index) => {
                      const category = getCategoryForSkill(suggestion);
                      return (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleAddSkill(suggestion)}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group ${
                            index === selectedSkillIndex ? 'bg-blue-50' : ''
                          } ${index === 0 ? 'rounded-t-xl' : ''} ${
                            index === skillSuggestions.length - 1 ? 'rounded-b-xl' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getSkillCategoryColor(suggestion)} flex items-center justify-center`}>
                              <Code className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">{suggestion}</span>
                              {category && (
                                <span className="block text-xs text-gray-500">
                                  {category.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (skillSearchQuery.trim()) {
                  handleAddSkill(skillSearchQuery.trim());
                }
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </motion.button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Search from {SKILL_CATEGORIES.length} categories with 500+ skills. Press Enter or click Add to add a custom skill.
        </p>

        {/* Category Quick Links */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SKILL_CATEGORIES.slice(0, 6).map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setSkillSearchQuery('');
                setSkillSuggestions(
                  category.skills
                    .filter((skill) => !formData.skills.includes(skill))
                    .slice(0, 15)
                );
                setShowSkillSuggestions(true);
                skillInputRef.current?.focus();
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Suggested Skills from Category (if available) */}
        {availableSkills.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Suggested skills for {selectedSubcategory?.name || selectedCategory?.name}:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableSkills.filter(s => !formData.skills.includes(s)).slice(0, 10).map((skill) => (
                <motion.button
                  key={skill}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddSkill(skill)}
                  className="px-3 py-1.5 rounded-full border border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all text-sm"
                >
                  + {skill}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Deliverables */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Expected Deliverables
        </label>
        <div className="space-y-3">
          {formData.deliverables.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateListItem('deliverables', index, e.target.value)}
                placeholder="e.g., Final design files in PNG and SVG format"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
              {formData.deliverables.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeListItem('deliverables', index)}
                  className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addListItem('deliverables')}
          className="mt-3 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Add Deliverable
        </button>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Reference Files (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-600 font-semibold mb-1">
              Click to upload or drag and drop
            </div>
            <div className="text-sm text-gray-500">
              Examples, references, or any helpful materials
            </div>
          </label>
        </div>

        {formData.files.length > 0 && (
          <div className="mt-4 space-y-2">
            {formData.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderStep3_Budget = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Set Your Budget</h2>
        <p className="text-gray-600">How much are you willing to pay?</p>
      </div>

      {/* Budget Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Minimum Budget ($) *
          </label>
          <input
            type="number"
            value={formData.budgetMin || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, budgetMin: Number(e.target.value) }))}
            placeholder="500"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Maximum Budget ($) *
          </label>
          <input
            type="number"
            value={formData.budgetMax || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, budgetMax: Number(e.target.value) }))}
            placeholder="5000"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Budget Summary */}
      {(formData.budgetMin > 0 || formData.budgetMax > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-6 border-2 ${
            formData.budgetMin > 0 && formData.budgetMax > 0 && formData.budgetMax > formData.budgetMin
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
              : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
          }`}
        >
          <h3 className={`font-bold mb-2 ${
            formData.budgetMin > 0 && formData.budgetMax > 0 && formData.budgetMax > formData.budgetMin
              ? 'text-green-900'
              : 'text-red-900'
          }`}>Your Budget</h3>
          <div className={`text-3xl font-black bg-clip-text text-transparent ${
            formData.budgetMin > 0 && formData.budgetMax > 0 && formData.budgetMax > formData.budgetMin
              ? 'bg-gradient-to-r from-green-600 to-emerald-600'
              : 'bg-gradient-to-r from-red-600 to-orange-600'
          }`}>
            ${formData.budgetMin.toLocaleString()} - ${formData.budgetMax.toLocaleString()}
          </div>
          {formData.budgetMax > 0 && formData.budgetMin > 0 && formData.budgetMax <= formData.budgetMin && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Maximum budget must be greater than minimum budget
            </p>
          )}
        </motion.div>
      )}

      {/* Budget Tips */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 mb-1">Budget Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Higher budgets attract more experienced freelancers</li>
              <li>• Be realistic about complexity and required skills</li>
              <li>• Consider the market rate for your service category</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep4_Timeline = () => (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Timeline & Preferences</h2>
        <p className="text-gray-600">When do you need this completed?</p>
      </div>

      {/* Project Duration */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Expected Duration *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DURATION_OPTIONS.map((option) => (
            <motion.button
              key={option.value}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFormData(prev => ({ ...prev, duration: option.value }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.duration === option.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="font-semibold text-gray-900 text-sm">{option.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Freelancer Experience Level *
        </label>
        <div className="space-y-3">
          {EXPERIENCE_LEVELS.map((level) => (
            <motion.button
              key={level.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setFormData(prev => ({ ...prev, experienceLevel: level.id as any }))}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                formData.experienceLevel === level.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="text-3xl">{level.icon}</div>
              <div>
                <div className="font-bold text-gray-900">{level.name}</div>
                <div className="text-sm text-gray-600">{level.description}</div>
              </div>
              {formData.experienceLevel === level.id && (
                <Check className="w-6 h-6 text-purple-600 ml-auto" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Preferred Start Date (Optional)
        </label>
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => {
            const newStartDate = e.target.value;
            setFormData(prev => ({
              ...prev,
              startDate: newStartDate,
              // Clear end date if it's now before the new start date
              preferredEndDate: prev.preferredEndDate && prev.preferredEndDate < newStartDate ? '' : prev.preferredEndDate,
            }));
          }}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Preferred End Date */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Preferred End Date (Optional)
        </label>
        <input
          type="date"
          value={formData.preferredEndDate}
          onChange={(e) => setFormData(prev => ({ ...prev, preferredEndDate: e.target.value }))}
          min={formData.startDate || new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
            formData.preferredEndDate && formData.startDate && formData.preferredEndDate < formData.startDate
              ? 'border-red-300 focus:border-red-500 bg-red-50'
              : 'border-gray-200 focus:border-purple-500'
          }`}
        />
        {formData.preferredEndDate && formData.startDate && formData.preferredEndDate < formData.startDate && (
          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            End date cannot be before start date
          </p>
        )}
      </div>

      {/* Additional Requirements */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Additional Requirements (Optional)
        </label>
        <div className="space-y-3">
          {formData.requirements.map((req, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={req}
                onChange={(e) => updateListItem('requirements', index, e.target.value)}
                placeholder="e.g., Must be available for video calls"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
              />
              {formData.requirements.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeListItem('requirements', index)}
                  className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addListItem('requirements')}
          className="mt-3 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-semibold hover:border-purple-400 hover:text-purple-600 transition-colors"
        >
          + Add Requirement
        </button>
      </div>
    </motion.div>
  );

  const renderStep5_Review = () => (
    <motion.div
      key="step5"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Review & Post</h2>
        <p className="text-gray-600">Make sure everything looks good</p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
        {/* Category & Service */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-black text-gray-900 mb-4">Service Category</h3>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br ${selectedCategory?.gradient} text-white`}>
            <span className="text-xl">{selectedCategory?.icon}</span>
            <span className="font-semibold">{selectedSubcategory?.name}</span>
            <span className="text-white/70">in {selectedCategory?.name}</span>
          </div>
        </div>

        {/* Project Details */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-black text-gray-900 mb-4">Project Details</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">Title</div>
              <div className="font-bold text-gray-900">{formData.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Description</div>
              <div
                className="text-gray-900 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.description }}
              />
            </div>
            {formData.skills.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Required Skills</div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Budget & Timeline */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-black text-gray-900 mb-4">Budget & Timeline</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-gray-500">Budget</div>
              <div className="font-bold text-gray-900">
                ${formData.budgetMin.toLocaleString()} - ${formData.budgetMax.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Duration</div>
              <div className="font-bold text-gray-900">
                {DURATION_OPTIONS.find(d => d.value === formData.duration)?.label || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Experience</div>
              <div className="font-bold text-gray-900 capitalize">{formData.experienceLevel}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Start Date</div>
              <div className="font-bold text-gray-900">
                {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'ASAP'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">End Date</div>
              <div className="font-bold text-gray-900">
                {formData.preferredEndDate ? new Date(formData.preferredEndDate).toLocaleDateString() : 'Flexible'}
              </div>
            </div>
          </div>
        </div>

        {/* Deliverables & Requirements */}
        <div className="p-6">
          <h3 className="text-lg font-black text-gray-900 mb-4">Deliverables & Requirements</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {formData.deliverables.filter(d => d.trim()).length > 0 && (
              <div>
                <div className="text-sm font-bold text-gray-700 mb-2">Deliverables</div>
                <ul className="space-y-2">
                  {formData.deliverables.filter(d => d.trim()).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {formData.requirements.filter(r => r.trim()).length > 0 && (
              <div>
                <div className="text-sm font-bold text-gray-700 mb-2">Requirements</div>
                <ul className="space-y-2">
                  {formData.requirements.filter(r => r.trim()).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {formData.files.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-bold text-gray-700 mb-2">Attached Files ({formData.files.length})</div>
              <div className="flex flex-wrap gap-2">
                {formData.files.map((file, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg text-sm">
                    <FileText className="w-4 h-4 text-gray-500" />
                    {file.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What happens next */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-blue-900 mb-2">What happens next?</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Your project will be visible to qualified freelancers</li>
              <li>• Freelancers can submit proposals with their quotes</li>
              <li>• Review proposals, chat with candidates, and hire the best fit</li>
              <li>• Work together with milestone-based payments and full protection</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-200 rounded-xl p-6"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-red-900 mb-1">Submission Error</h4>
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1_CategorySelection();
      case 2: return renderStep2_ProjectDetails();
      case 3: return renderStep3_Budget();
      case 4: return renderStep4_Timeline();
      case 5: return renderStep5_Review();
      default: return null;
    }
  };

  // Loading state
  if (companyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-600">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // No company error
  if (!currentCompany && !companyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-12 text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">No Company Found</h2>
          <p className="text-red-700 mb-6">You need to be part of a company to post projects.</p>
          <button
            onClick={() => navigate(sectionPaths.client({ companyId }, 'dashboard'))}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: currentStep === step ? 1.1 : 1,
                    backgroundColor: currentStep >= step ? 'rgb(147, 51, 234)' : 'rgb(229, 231, 235)',
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white z-10 ${
                    currentStep >= step ? 'shadow-lg' : ''
                  }`}
                >
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </motion.div>
                {step < 5 && (
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: currentStep > step ? 'rgb(147, 51, 234)' : 'rgb(229, 231, 235)',
                    }}
                    className="flex-1 h-1 mx-2"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className="text-sm font-semibold text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          ref={nextStepButtonRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-8 py-4 rounded-xl font-bold flex items-center space-x-2 transition-all ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </motion.button>

          {currentStep < totalSteps ? (
            <motion.button
              whileHover={{ scale: canProceed() ? 1.05 : 1 }}
              whileTap={{ scale: canProceed() ? 0.95 : 1 }}
              animate={canProceed() ? {
                boxShadow: [
                  '0 10px 30px rgba(59, 130, 246, 0.3)',
                  '0 10px 40px rgba(168, 85, 247, 0.4)',
                  '0 10px 30px rgba(59, 130, 246, 0.3)',
                ],
              } : {}}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-8 py-4 rounded-xl font-bold flex items-center space-x-2 shadow-lg transition-all ${
                canProceed()
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>Next Step</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold flex items-center space-x-2 shadow-lg transition-all ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Posting Project...</span>
                </>
              ) : (
                <>
                  <span>Post Project</span>
                  <Send className="w-5 h-5" />
                </>
              )}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PostProject;
