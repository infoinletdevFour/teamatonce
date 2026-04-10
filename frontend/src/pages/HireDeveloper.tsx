import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Paperclip,
  X,
  CheckCircle2,
  Star,
  MapPin,
  Loader2,
  FolderOpen,
  Plus,
  Briefcase,
} from 'lucide-react';
import UnifiedHeader from '../components/layout/UnifiedHeader';
import Footer from '../components/layout/Footer';
import { publicService, PublicDeveloperDetail } from '../services/publicService';
import { hireRequestService, CreateHireRequestData } from '../services/hireRequestService';
import { apiClient } from '../lib/api-client';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useCompanyOptional } from '../contexts/CompanyContext';
import { SKILL_CATEGORIES } from '../constants/skills';

type PaymentType = 'hourly' | 'fixed';

interface ProjectData {
  title: string;
  description: string;
  category: string;
  paymentType: PaymentType;
  hourlyRate?: number;
  estimatedHours?: number;
  fixedBudget?: number;
  startDate: string;
  duration: string;
  additionalDetails: string;
  attachments: File[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  estimated_cost?: number;
  project_type?: string;
  created_at: string;
}

const HireDeveloper: React.FC = () => {
  const { developerId } = useParams<{ developerId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const companyContext = useCompanyOptional();
  const companyId = companyContext?.companyId || null;
  const [developer, setDeveloper] = useState<PublicDeveloperDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Project selection state
  const [projectSelection, setProjectSelection] = useState<'new' | 'existing' | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Helper function to strip HTML tags
  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    description: '',
    category: '',
    paymentType: 'hourly',
    hourlyRate: 50,
    estimatedHours: 40,
    fixedBudget: 2000,
    startDate: '',
    duration: '1-3 months',
    additionalDetails: '',
    attachments: [],
  });

  useEffect(() => {
    const fetchDeveloper = async () => {
      if (!developerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await publicService.getDeveloperById(developerId);
        setDeveloper(data);
        if (data?.hourlyRate) {
          setProjectData(prev => ({ ...prev, hourlyRate: data.hourlyRate }));
        }
      } catch (error) {
        console.error('Failed to fetch developer:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeveloper();
  }, [developerId]);

  // Fetch user projects - filtered by company if in company context
  const fetchUserProjects = async () => {
    if (!isAuthenticated) return;

    try {
      setLoadingProjects(true);

      // Use company-specific endpoint if user is in a company context
      const endpoint = companyId
        ? `/projects/company/${companyId}`
        : '/projects';

      const response = await apiClient.get<Project[]>(endpoint);
      setUserProjects(response.data || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load your projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && projectSelection === 'existing') {
      fetchUserProjects();
    }
  }, [isAuthenticated, projectSelection, companyId]);

  // Get categories from skills.ts
  const categories = SKILL_CATEGORIES.map(cat => cat.name);

  const durations = [
    'Less than 1 month',
    '1-3 months',
    '3-6 months',
    '6+ months',
    'Ongoing',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProjectData({ ...projectData, attachments: [...projectData.attachments, ...files] });
  };

  const removeFile = (index: number) => {
    const newAttachments = projectData.attachments.filter((_, i) => i !== index);
    setProjectData({ ...projectData, attachments: newAttachments });
  };

  const calculateTotal = () => {
    if (projectData.paymentType === 'hourly') {
      return (projectData.hourlyRate || 0) * (projectData.estimatedHours || 0);
    }
    return projectData.fixedBudget || 0;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Project selection step
        if (projectSelection === 'new') return true;
        if (projectSelection === 'existing') return selectedProject !== null;
        return false;
      case 2:
        return projectData.title.trim() && projectData.description.trim() && projectData.category;
      case 3:
        return projectData.paymentType === 'hourly'
          ? projectData.hourlyRate && projectData.estimatedHours
          : projectData.fixedBudget;
      case 4:
        return projectData.startDate && projectData.duration;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to send a hire request');
      navigate('/login');
      return;
    }

    if (!developerId) {
      toast.error('Invalid developer');
      return;
    }

    setSubmitting(true);
    try {
      const hireRequestData: CreateHireRequestData = {
        companyId: developerId, // developerId is actually the company ID
        projectId: projectSelection === 'existing' && selectedProject ? selectedProject.id : undefined,
        title: projectSelection === 'existing' && selectedProject ? selectedProject.name : projectData.title,
        description: projectSelection === 'existing' && selectedProject ? selectedProject.description : projectData.description,
        category: projectData.category,
        paymentType: projectData.paymentType,
        hourlyRate: projectData.paymentType === 'hourly' ? projectData.hourlyRate : undefined,
        estimatedHours: projectData.paymentType === 'hourly' ? projectData.estimatedHours : undefined,
        fixedBudget: projectData.paymentType === 'fixed' ? projectData.fixedBudget : undefined,
        startDate: projectData.startDate,
        duration: projectData.duration,
        additionalDetails: projectData.additionalDetails || undefined,
        // Note: File attachments would need to be uploaded separately and URLs passed here
        attachmentUrls: [],
      };

      await hireRequestService.createHireRequest(hireRequestData);

      toast.success('Hire request sent successfully! The seller will review your offer.');
      setTimeout(() => {
        navigate(`/developer/${developerId}`);
      }, 2000);
    } catch (error: any) {
      console.error('Failed to submit hire request:', error);
      toast.error(error.message || 'Failed to send hire request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <UnifiedHeader />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-sky-700" />
        </div>
        <Footer />
      </>
    );
  }

  if (!developer) {
    return (
      <>
        <UnifiedHeader />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center pt-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Developer Not Found</h1>
            <button
              onClick={() => navigate('/browse-talent')}
              className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
            >
              Browse All Developers
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <UnifiedHeader />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link
            to={`/developer/${developerId}`}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Developer Profile</span>
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-black text-gray-900 mb-2">Hire {developer.name}</h1>
            <p className="text-gray-600">Complete the details below to send your project proposal</p>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      step < currentStep
                        ? 'bg-green-500 text-white'
                        : step === currentStep
                        ? 'bg-sky-700 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step < currentStep ? <Check className="w-5 h-5" /> : step}
                  </div>
                  {step < 6 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-all ${
                        step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Project</span>
              <span>Details</span>
              <span>Budget</span>
              <span>Timeline</span>
              <span>Additional</span>
              <span>Review</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
              >
                <AnimatePresence mode="wait">
                  {/* Step 1: Project Selection */}
                  {currentStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <Briefcase className="w-6 h-6 text-sky-700" />
                        <h2 className="text-xl font-bold text-gray-900">Select Project</h2>
                      </div>

                      <p className="text-gray-600 mb-6">
                        Choose whether to create a new project or link this hire request to an existing one.
                      </p>

                      <div className="space-y-4">
                        {/* New Project Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setProjectSelection('new');
                            setSelectedProject(null);
                            // Clear form when switching to new project
                            setProjectData({
                              title: '',
                              description: '',
                              category: '',
                              paymentType: 'hourly',
                              hourlyRate: developer?.hourlyRate || 50,
                              estimatedHours: 40,
                              fixedBudget: 2000,
                              startDate: '',
                              duration: '1-3 months',
                              additionalDetails: '',
                              attachments: [],
                            });
                          }}
                          className={`w-full p-6 border-2 rounded-xl transition-all text-left ${
                            projectSelection === 'new'
                              ? 'border-sky-700 bg-sky-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-600 to-sky-700 flex items-center justify-center">
                                <Plus className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                Create New Project
                              </h3>
                              <p className="text-sm text-gray-600">
                                Start fresh with a new project. You'll fill out all project details in the next steps.
                              </p>
                            </div>
                            {projectSelection === 'new' && (
                              <Check className="w-6 h-6 text-sky-700 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {/* Existing Project Option */}
                        <button
                          type="button"
                          onClick={() => setProjectSelection('existing')}
                          className={`w-full p-6 border-2 rounded-xl transition-all text-left ${
                            projectSelection === 'existing'
                              ? 'border-sky-700 bg-sky-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                                <FolderOpen className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                Select Existing Project
                              </h3>
                              <p className="text-sm text-gray-600">
                                Link this hire request to one of your existing projects. Great for sending multiple hire requests for the same project.
                              </p>
                            </div>
                            {projectSelection === 'existing' && (
                              <Check className="w-6 h-6 text-sky-700 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {/* Existing Projects List */}
                        {projectSelection === 'existing' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6"
                          >
                            {loadingProjects ? (
                              <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-sky-700" />
                              </div>
                            ) : userProjects.length === 0 ? (
                              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600">No projects found. Please create a new project instead.</p>
                              </div>
                            ) : (
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                <p className="text-sm font-semibold text-gray-700 mb-3">
                                  Select a project ({userProjects.length}):
                                </p>
                                {userProjects.map((project) => (
                                  <button
                                    key={project.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedProject(project);
                                      // Pre-fill form with project details
                                      setProjectData(prev => ({
                                        ...prev,
                                        title: project.name,
                                        description: stripHtml(project.description),
                                      }));
                                    }}
                                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                                      selectedProject?.id === project.id
                                        ? 'border-sky-700 bg-sky-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{project.name}</h4>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                          {stripHtml(project.description)}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                          <span className="px-2 py-1 bg-gray-100 rounded capitalize">
                                            {project.status}
                                          </span>
                                          {project.estimated_cost && (
                                            <span>${project.estimated_cost.toLocaleString()}</span>
                                          )}
                                          <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                      {selectedProject?.id === project.id && (
                                        <Check className="w-5 h-5 text-sky-700 flex-shrink-0" />
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Project Details */}
                  {currentStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <FileText className="w-6 h-6 text-sky-700" />
                        <h2 className="text-xl font-bold text-gray-900">Project Details</h2>
                      </div>

                      {projectSelection === 'existing' && selectedProject && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> This hire request will be linked to your existing project "{selectedProject.name}".
                            The fields below are pre-filled but you can modify them for this specific hire request.
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Title *
                          </label>
                          <input
                            type="text"
                            value={projectData.title}
                            onChange={(e) =>
                              setProjectData({ ...projectData, title: e.target.value })
                            }
                            placeholder="e.g., Build a responsive e-commerce website"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Description *
                          </label>
                          <textarea
                            value={projectData.description}
                            onChange={(e) =>
                              setProjectData({ ...projectData, description: e.target.value })
                            }
                            placeholder="Describe your project requirements, features, and goals in detail..."
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Category *
                          </label>
                          <select
                            value={projectData.category}
                            onChange={(e) =>
                              setProjectData({ ...projectData, category: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Budget */}
                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <DollarSign className="w-6 h-6 text-sky-700" />
                        <h2 className="text-xl font-bold text-gray-900">Budget & Payment</h2>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Payment Type *
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() =>
                                setProjectData({ ...projectData, paymentType: 'hourly' })
                              }
                              className={`p-4 border-2 rounded-lg transition-all ${
                                projectData.paymentType === 'hourly'
                                  ? 'border-sky-700 bg-sky-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Clock className="w-6 h-6 mx-auto mb-2 text-sky-700" />
                              <p className="font-semibold text-gray-900">Hourly Rate</p>
                              <p className="text-xs text-gray-600 mt-1">Pay by the hour</p>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setProjectData({ ...projectData, paymentType: 'fixed' })
                              }
                              className={`p-4 border-2 rounded-lg transition-all ${
                                projectData.paymentType === 'fixed'
                                  ? 'border-sky-700 bg-sky-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <DollarSign className="w-6 h-6 mx-auto mb-2 text-sky-700" />
                              <p className="font-semibold text-gray-900">Fixed Price</p>
                              <p className="text-xs text-gray-600 mt-1">One-time payment</p>
                            </button>
                          </div>
                        </div>

                        {projectData.paymentType === 'hourly' ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Hourly Rate *
                              </label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                  $
                                </span>
                                <input
                                  type="number"
                                  value={projectData.hourlyRate}
                                  onChange={(e) =>
                                    setProjectData({
                                      ...projectData,
                                      hourlyRate: Number(e.target.value),
                                    })
                                  }
                                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Developer's rate: ${developer.hourlyRate}/hour
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Estimated Hours *
                              </label>
                              <input
                                type="number"
                                value={projectData.estimatedHours}
                                onChange={(e) =>
                                  setProjectData({
                                    ...projectData,
                                    estimatedHours: Number(e.target.value),
                                  })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                              />
                            </div>

                            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-900">
                                  Estimated Total:
                                </span>
                                <span className="text-2xl font-black text-sky-700">
                                  ${calculateTotal().toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Fixed Budget *
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                $
                              </span>
                              <input
                                type="number"
                                value={projectData.fixedBudget}
                                onChange={(e) =>
                                  setProjectData({
                                    ...projectData,
                                    fixedBudget: Number(e.target.value),
                                  })
                                }
                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                              />
                            </div>
                            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mt-4">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-900">Project Budget:</span>
                                <span className="text-2xl font-black text-sky-700">
                                  ${calculateTotal().toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Timeline */}
                  {currentStep === 4 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <Calendar className="w-6 h-6 text-sky-700" />
                        <h2 className="text-xl font-bold text-gray-900">Timeline</h2>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Desired Start Date *
                          </label>
                          <input
                            type="date"
                            value={projectData.startDate}
                            onChange={(e) =>
                              setProjectData({ ...projectData, startDate: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Expected Duration *
                          </label>
                          <select
                            value={projectData.duration}
                            onChange={(e) =>
                              setProjectData({ ...projectData, duration: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          >
                            {durations.map((dur) => (
                              <option key={dur} value={dur}>
                                {dur}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Additional Details */}
                  {currentStep === 5 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <Paperclip className="w-6 h-6 text-sky-700" />
                        <h2 className="text-xl font-bold text-gray-900">Additional Details</h2>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Additional Information (Optional)
                          </label>
                          <textarea
                            value={projectData.additionalDetails}
                            onChange={(e) =>
                              setProjectData({ ...projectData, additionalDetails: e.target.value })
                            }
                            placeholder="Any special requirements, preferences, or additional context..."
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Attachments (Optional)
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sky-500 transition-colors">
                            <input
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              className="hidden"
                              id="file-upload"
                            />
                            <label
                              htmlFor="file-upload"
                              className="cursor-pointer flex flex-col items-center"
                            >
                              <Paperclip className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">
                                Click to upload files or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PDF, DOC, PNG, JPG (max 10MB)
                              </p>
                            </label>
                          </div>

                          {projectData.attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {projectData.attachments.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                                >
                                  <span className="text-sm text-gray-700 truncate flex-1">
                                    {file.name}
                                  </span>
                                  <button
                                    onClick={() => removeFile(index)}
                                    className="ml-2 text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 6: Review */}
                  {currentStep === 6 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 className="w-6 h-6 text-sky-700" />
                        <h2 className="text-xl font-bold text-gray-900">Review & Submit</h2>
                      </div>

                      <div className="space-y-6">
                        {/* Project Selection Info */}
                        {projectSelection === 'existing' && selectedProject ? (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FolderOpen className="w-5 h-5 text-purple-700" />
                              <h3 className="font-semibold text-purple-900">Existing Project Selected</h3>
                            </div>
                            <p className="text-sm text-purple-800 font-medium">{selectedProject.name}</p>
                            <p className="text-sm text-purple-700 mt-1">{stripHtml(selectedProject.description)}</p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-purple-600">
                              <span className="px-2 py-1 bg-purple-100 rounded capitalize">
                                {selectedProject.status}
                              </span>
                              {selectedProject.estimated_cost && (
                                <span>${selectedProject.estimated_cost.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Project Details</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Title:</span>
                                <span className="font-medium text-gray-900">{projectData.title}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Category:</span>
                                <span className="font-medium text-gray-900">
                                  {projectData.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Budget</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Payment Type:</span>
                              <span className="font-medium text-gray-900 capitalize">
                                {projectData.paymentType}
                              </span>
                            </div>
                            {projectData.paymentType === 'hourly' ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Hourly Rate:</span>
                                  <span className="font-medium text-gray-900">
                                    ${projectData.hourlyRate}/hr
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Estimated Hours:</span>
                                  <span className="font-medium text-gray-900">
                                    {projectData.estimatedHours} hrs
                                  </span>
                                </div>
                              </>
                            ) : null}
                            <div className="flex justify-between pt-2 border-t border-gray-300">
                              <span className="font-semibold text-gray-900">Total:</span>
                              <span className="text-lg font-bold text-sky-700">
                                ${calculateTotal().toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Timeline</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Start Date:</span>
                              <span className="font-medium text-gray-900">
                                {projectData.startDate}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-medium text-gray-900">
                                {projectData.duration}
                              </span>
                            </div>
                          </div>
                        </div>

                        {projectData.attachments.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Attachments</h3>
                            <div className="text-sm text-gray-700">
                              {projectData.attachments.length} file(s) attached
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  {currentStep < totalSteps ? (
                    <button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="px-6 py-2 bg-gradient-to-r from-sky-700 to-sky-600 text-white rounded-lg font-semibold hover:from-sky-800 hover:to-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-8 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Send Hire Request
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar - Developer Info */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-md p-5 border border-gray-200 sticky top-24"
              >
                <h3 className="text-base font-bold text-gray-900 mb-4">Hiring</h3>

                <div className="flex items-start gap-3 mb-4">
                  <img
                    src={developer.avatar}
                    alt={developer.name}
                    className="w-16 h-16 rounded-lg object-cover ring-2 ring-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        developer.name
                      )}&background=0c4a6e&color=fff&size=128&bold=true`;
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">{developer.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{developer.title}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{developer.rating}</span>
                      <span className="text-gray-500">({developer.reviewsCount})</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{developer.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>${developer.hourlyRate}/hour</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{developer.completedProjects} projects completed</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {developer.skills.slice(0, 4).map((skill, index) => {
                      const skillName = typeof skill === 'string' ? skill : skill.name;
                      return (
                        <span
                          key={skillName || index}
                          className="bg-sky-50 text-sky-700 px-2 py-1 rounded text-xs font-medium"
                        >
                          {skillName}
                        </span>
                      );
                    })}
                    {developer.skills.length > 4 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                        +{developer.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {currentStep === 3 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg p-3 border border-sky-200">
                      <p className="text-xs text-gray-600 mb-1">Estimated Total</p>
                      <p className="text-2xl font-black text-sky-700">
                        ${calculateTotal().toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default HireDeveloper;
