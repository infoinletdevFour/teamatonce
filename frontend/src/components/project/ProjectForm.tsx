/**
 * Project Form Component
 *
 * Reusable form for creating and editing projects
 * Uses React Hook Form for validation and state management
 */

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  Save,
  X,
  DollarSign,
  FileText,
  Briefcase,
  Code,
  Sparkles,
  AlertCircle,
  Clock,
} from 'lucide-react'
import type { CreateProjectData, UpdateProjectData } from '@/types/project'

interface ProjectFormProps {
  initialData?: Partial<CreateProjectData>
  mode?: 'create' | 'edit'
  onSubmit: (data: CreateProjectData | UpdateProjectData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  mode = 'create',
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateProjectData>({
    defaultValues: initialData || {
      name: '',
      description: '',
      projectType: 'web_application',
      currency: 'USD',
      techStack: [],
      frameworks: [],
      features: [],
    },
  })

  const [techStack, setTechStack] = useState<string[]>(initialData?.techStack || [])
  const [frameworks, setFrameworks] = useState<string[]>(initialData?.frameworks || [])
  const [features, setFeatures] = useState<string[]>(initialData?.features || [])
  const [techInput, setTechInput] = useState('')
  const [frameworkInput, setFrameworkInput] = useState('')
  const [featureInput, setFeatureInput] = useState('')

  const handleFormSubmit = async (data: CreateProjectData) => {
    const submitData = {
      ...data,
      techStack,
      frameworks,
      features,
    }
    await onSubmit(submitData)
  }

  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      const newStack = [...techStack, techInput.trim()]
      setTechStack(newStack)
      setValue('techStack', newStack)
      setTechInput('')
    }
  }

  const removeTech = (tech: string) => {
    const newStack = techStack.filter((t) => t !== tech)
    setTechStack(newStack)
    setValue('techStack', newStack)
  }

  const addFramework = () => {
    if (frameworkInput.trim() && !frameworks.includes(frameworkInput.trim())) {
      const newFrameworks = [...frameworks, frameworkInput.trim()]
      setFrameworks(newFrameworks)
      setValue('frameworks', newFrameworks)
      setFrameworkInput('')
    }
  }

  const removeFramework = (framework: string) => {
    const newFrameworks = frameworks.filter((f) => f !== framework)
    setFrameworks(newFrameworks)
    setValue('frameworks', newFrameworks)
  }

  const addFeature = () => {
    if (featureInput.trim() && !features.includes(featureInput.trim())) {
      const newFeatures = [...features, featureInput.trim()]
      setFeatures(newFeatures)
      setValue('features', newFeatures)
      setFeatureInput('')
    }
  }

  const removeFeature = (feature: string) => {
    const newFeatures = features.filter((f) => f !== feature)
    setFeatures(newFeatures)
    setValue('features', newFeatures)
  }

  const projectTypes = [
    { value: 'web_application', label: 'Web Application' },
    { value: 'mobile_application', label: 'Mobile Application' },
    { value: 'desktop_application', label: 'Desktop Application' },
    { value: 'api_backend', label: 'API/Backend' },
    { value: 'ecommerce', label: 'E-Commerce Platform' },
    { value: 'cms', label: 'Content Management System' },
    { value: 'crm', label: 'CRM System' },
    { value: 'erp', label: 'ERP System' },
    { value: 'saas', label: 'SaaS Platform' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Form Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6">
          <h2 className="text-2xl font-black text-white flex items-center space-x-2">
            <Briefcase className="w-7 h-7" />
            <span>{mode === 'create' ? 'Create New Project' : 'Edit Project'}</span>
          </h2>
          <p className="text-blue-100 mt-1">
            {mode === 'create'
              ? 'Fill in the details to start your project'
              : 'Update project information'}
          </p>
        </div>

        {/* Form Content */}
        <div className="p-8 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b-2 border-gray-200">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
            </div>

            {/* Project Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Project name is required' })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.name
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="e.g., E-Commerce Platform"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.name.message}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Describe your project requirements, goals, and expectations..."
              />
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Project Type *
              </label>
              <select
                {...register('projectType', { required: 'Project type is required' })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.projectType
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
              >
                {projectTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.projectType && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.projectType.message}</span>
                </p>
              )}
            </div>
          </div>

          {/* Budget & Timeline */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b-2 border-gray-200">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">Budget & Timeline</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Estimated Cost */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Estimated Budget
                </label>
                <input
                  type="number"
                  {...register('estimatedCost', { min: 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0"
                  step="100"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
                <select
                  {...register('currency')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
              </div>

              {/* Estimated Duration */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  {...register('estimatedDurationDays', { min: 1 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., 90"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Technologies */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b-2 border-gray-200">
              <Code className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">Technologies</h3>
            </div>

            {/* Tech Stack */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tech Stack
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., React, Node.js"
                />
                <button
                  type="button"
                  onClick={addTech}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold flex items-center space-x-2"
                  >
                    <span>{tech}</span>
                    <button type="button" onClick={() => removeTech(tech)}>
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Frameworks */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Frameworks
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={frameworkInput}
                  onChange={(e) => setFrameworkInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFramework())}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., Next.js, Express"
                />
                <button
                  type="button"
                  onClick={addFramework}
                  className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {frameworks.map((framework) => (
                  <span
                    key={framework}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-semibold flex items-center space-x-2"
                  >
                    <span>{framework}</span>
                    <button type="button" onClick={() => removeFramework(framework)}>
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b-2 border-gray-200">
              <Sparkles className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">Features</h3>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Key Features
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., User Authentication, Payment Integration"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {features.map((feature) => (
                  <span
                    key={feature}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-semibold flex items-center space-x-2"
                  >
                    <span>{feature}</span>
                    <button type="button" onClick={() => removeFeature(feature)}>
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-8 py-6 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{mode === 'create' ? 'Create Project' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default ProjectForm
