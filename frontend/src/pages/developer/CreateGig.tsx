import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Package, FileText, DollarSign,
  Image, HelpCircle, Save, Upload, X, Plus, Trash2, GripVertical,
  AlertCircle, CheckCircle2, Sparkles
} from 'lucide-react';
import {
  Gig, GigPackage, GigRequirement, GigFAQ,
  DeliveryTime, RevisionCount,
  DELIVERY_TIME_LABELS, REVISION_LABELS, DEFAULT_PACKAGES
} from '@/types/gig';
import { gigService } from '@/services/gigService';
import {
  SERVICE_CATEGORIES,
  getCategoryById, getSubcategoryById, searchCategories
} from '@/config/service-categories';
import { useCompany } from '@/contexts/CompanyContext';

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  tags: string[];
  packages: Omit<GigPackage, 'id'>[];
  requirements: Omit<GigRequirement, 'id'>[];
  faqs: Omit<GigFAQ, 'id'>[];
}

const STEPS = [
  { id: 'overview', title: 'Overview', icon: FileText, description: 'Basic gig information' },
  { id: 'pricing', title: 'Pricing', icon: DollarSign, description: 'Set your packages' },
  { id: 'description', title: 'Description & FAQ', icon: HelpCircle, description: 'Details & questions' },
  { id: 'requirements', title: 'Requirements', icon: Package, description: 'Buyer requirements' },
  { id: 'gallery', title: 'Gallery', icon: Image, description: 'Images & video' },
  { id: 'publish', title: 'Publish', icon: Check, description: 'Review & publish' },
];

const CreateGig: React.FC = () => {
  const navigate = useNavigate();
  const { gigId } = useParams();
  const { company } = useCompany();
  const isEditing = !!gigId;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    tags: [],
    packages: [...DEFAULT_PACKAGES],
    requirements: [],
    faqs: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) {
      loadGig();
    }
  }, [gigId]);

  const loadGig = async () => {
    if (!gigId) return;
    try {
      setLoading(true);
      const gig = await gigService.getGigById(gigId);
      setFormData({
        title: gig.title,
        description: gig.description,
        categoryId: gig.categoryId,
        subcategoryId: gig.subcategoryId,
        tags: gig.tags,
        packages: gig.packages.map(p => ({
          name: p.name,
          title: p.title,
          description: p.description,
          price: p.price,
          deliveryTime: p.deliveryTime,
          revisions: p.revisions,
          features: p.features,
        })),
        requirements: gig.requirements.map(r => ({
          question: r.question,
          type: r.type,
          required: r.required,
          options: r.options,
          order: r.order,
        })),
        faqs: gig.faqs.map(f => ({
          question: f.question,
          answer: f.answer,
          order: f.order,
        })),
      });
      if (gig.images.length > 0) {
        setImagePreview(gig.images.map(img => img.url));
      }
    } catch (error) {
      console.error('Error loading gig:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Overview
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (formData.title.length < 15) newErrors.title = 'Title must be at least 15 characters';
        if (!formData.categoryId) newErrors.categoryId = 'Category is required';
        if (!formData.subcategoryId) newErrors.subcategoryId = 'Subcategory is required';
        break;
      case 1: // Pricing
        formData.packages.forEach((pkg, idx) => {
          if (pkg.price < 5) newErrors[`package_${idx}_price`] = 'Minimum price is $5';
          if (!pkg.description.trim()) newErrors[`package_${idx}_description`] = 'Package description is required';
        });
        break;
      case 2: // Description
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (formData.description.length < 120) newErrors.description = 'Description must be at least 120 characters';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      if (isEditing && gigId) {
        await gigService.updateGig(gigId, formData);
      } else {
        await gigService.createGig(formData);
      }
      navigate(`/company/${company?.id}/seller/gigs`);
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    // Validate all steps
    for (let i = 0; i < STEPS.length - 1; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    try {
      setSaving(true);
      let gig: Gig;
      if (isEditing && gigId) {
        gig = await gigService.updateGig(gigId, formData);
      } else {
        gig = await gigService.createGig(formData);
      }

      // Upload images if any
      if (images.length > 0) {
        await gigService.uploadGigImages(gig.id, images);
      }

      // Publish the gig
      await gigService.publishGig(gig.id);
      navigate(`/company/${company?.id}/seller/gigs`);
    } catch (error) {
      console.error('Error publishing gig:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    setImages([...images, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreview(imagePreview.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && formData.tags.length < 5 && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const updatePackage = (index: number, updates: Partial<GigPackage>) => {
    const newPackages = [...formData.packages];
    newPackages[index] = { ...newPackages[index], ...updates };
    setFormData({ ...formData, packages: newPackages });
  };

  const addPackageFeature = (packageIndex: number) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex].features.push('');
    setFormData({ ...formData, packages: newPackages });
  };

  const updatePackageFeature = (packageIndex: number, featureIndex: number, value: string) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex].features[featureIndex] = value;
    setFormData({ ...formData, packages: newPackages });
  };

  const removePackageFeature = (packageIndex: number, featureIndex: number) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex].features.splice(featureIndex, 1);
    setFormData({ ...formData, packages: newPackages });
  };

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [
        ...formData.requirements,
        { question: '', type: 'text', required: true, order: formData.requirements.length },
      ],
    });
  };

  const updateRequirement = (index: number, updates: Partial<GigRequirement>) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = { ...newRequirements[index], ...updates };
    setFormData({ ...formData, requirements: newRequirements });
  };

  const removeRequirement = (index: number) => {
    setFormData({ ...formData, requirements: formData.requirements.filter((_, i) => i !== index) });
  };

  const addFAQ = () => {
    setFormData({
      ...formData,
      faqs: [
        ...formData.faqs,
        { question: '', answer: '', order: formData.faqs.length },
      ],
    });
  };

  const updateFAQ = (index: number, updates: Partial<GigFAQ>) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index] = { ...newFaqs[index], ...updates };
    setFormData({ ...formData, faqs: newFaqs });
  };

  const removeFAQ = (index: number) => {
    setFormData({ ...formData, faqs: formData.faqs.filter((_, i) => i !== index) });
  };

  const selectedCategory = getCategoryById(formData.categoryId);
  const selectedSubcategory = getSubcategoryById(formData.categoryId, formData.subcategoryId);
  const searchResults = categorySearch ? searchCategories(categorySearch) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading gig...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => navigate(`/company/${company?.id}/seller/gigs`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to My Gigs
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Gig' : 'Create a New Gig'}
        </h1>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(index)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-medium hidden md:block">{step.title}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-white rounded-2xl border-2 border-gray-100 p-8 mb-8"
      >
        {/* Step 1: Overview */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gig Overview</h2>
              <p className="text-gray-600">Tell us about your service</p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gig Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="I will create a professional logo design"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                {formData.title.length}/80 characters (min 15)
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>

              {/* Search */}
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 mb-4"
              />

              {/* Search Results */}
              {categorySearch && searchResults.length > 0 && (
                <div className="mb-4 max-h-60 overflow-y-auto border-2 border-gray-200 rounded-xl">
                  {searchResults.slice(0, 10).map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (result.subcategory) {
                          setFormData({
                            ...formData,
                            categoryId: result.category.id,
                            subcategoryId: result.subcategory.id,
                          });
                        } else {
                          setFormData({ ...formData, categoryId: result.category.id, subcategoryId: '' });
                        }
                        setCategorySearch('');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                    >
                      <span className="text-2xl">{result.category.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {result.subcategory ? result.subcategory.name : result.category.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {result.subcategory ? result.category.name : result.category.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Category Display */}
              {selectedCategory && (
                <div className="p-4 bg-blue-50 rounded-xl mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedCategory.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedCategory.name}</p>
                      {selectedSubcategory && (
                        <p className="text-sm text-blue-600">{selectedSubcategory.name}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, categoryId: '', subcategoryId: '' })}
                      className="ml-auto text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Category Grid (when no search) */}
              {!categorySearch && !selectedCategory && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SERVICE_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setFormData({ ...formData, categoryId: category.id, subcategoryId: '' })}
                      className={`p-4 rounded-xl border-2 transition-all hover:border-blue-400 ${
                        formData.categoryId === category.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <span className="text-3xl block mb-2">{category.icon}</span>
                      <span className="font-medium text-sm text-gray-900">{category.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Subcategory Selection */}
              {selectedCategory && !selectedSubcategory && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
                    Subcategory <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedCategory.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setFormData({ ...formData, subcategoryId: sub.id })}
                        className={`p-3 rounded-xl border-2 transition-all hover:border-blue-400 text-left ${
                          formData.subcategoryId === sub.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <span className="font-medium text-sm text-gray-900">{sub.name}</span>
                        {sub.popular && (
                          <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Tags (up to 5)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-blue-900">
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={addTag}
                  disabled={formData.tags.length >= 5}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing Packages</h2>
              <p className="text-gray-600">Set up your service tiers</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {formData.packages.map((pkg, pkgIndex) => (
                <div
                  key={pkg.name}
                  className={`rounded-2xl border-2 p-6 ${
                    pkg.name === 'standard'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 capitalize">{pkg.name}</h3>
                    {pkg.name === 'standard' && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        Most Popular
                      </span>
                    )}
                  </div>

                  {/* Package Name */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Package Title
                    </label>
                    <input
                      type="text"
                      value={pkg.title}
                      onChange={(e) => updatePackage(pkgIndex, { title: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={pkg.price}
                      onChange={(e) => updatePackage(pkgIndex, { price: Number(e.target.value) })}
                      className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 ${
                        errors[`package_${pkgIndex}_price`] ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Description
                    </label>
                    <textarea
                      value={pkg.description}
                      onChange={(e) => updatePackage(pkgIndex, { description: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none ${
                        errors[`package_${pkgIndex}_description`] ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                  </div>

                  {/* Delivery Time */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Delivery Time
                    </label>
                    <select
                      value={pkg.deliveryTime}
                      onChange={(e) => updatePackage(pkgIndex, { deliveryTime: e.target.value as DeliveryTime })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                      {Object.entries(DELIVERY_TIME_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Revisions */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Revisions
                    </label>
                    <select
                      value={pkg.revisions}
                      onChange={(e) => updatePackage(pkgIndex, { revisions: e.target.value as RevisionCount })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                      {Object.entries(REVISION_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      What's Included
                    </label>
                    <div className="space-y-2">
                      {pkg.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => updatePackageFeature(pkgIndex, featureIndex, e.target.value)}
                            placeholder="Feature..."
                            className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => removePackageFeature(pkgIndex, featureIndex)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addPackageFeature(pkgIndex)}
                        className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Feature
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Description & FAQ */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Description & FAQ</h2>
              <p className="text-gray-600">Describe your service in detail</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gig Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={10}
                placeholder="Describe your service in detail. What do clients get? What's your process? Why should they choose you?"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 resize-none ${
                  errors.description ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                {formData.description.length} characters (min 120)
              </p>
            </div>

            {/* FAQs */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Frequently Asked Questions
              </label>
              <div className="space-y-4">
                {formData.faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400 mt-3 cursor-move" />
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => updateFAQ(index, { question: e.target.value })}
                          placeholder="Question"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <textarea
                          value={faq.answer}
                          onChange={(e) => updateFAQ(index, { answer: e.target.value })}
                          placeholder="Answer"
                          rows={3}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                      <button
                        onClick={() => removeFAQ(index)}
                        className="text-red-400 hover:text-red-600 mt-3"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addFAQ}
                className="mt-4 flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add FAQ
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Requirements */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Buyer Requirements</h2>
              <p className="text-gray-600">What information do you need from buyers?</p>
            </div>

            <div className="space-y-4">
              {formData.requirements.map((req, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400 mt-3 cursor-move" />
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={req.question}
                        onChange={(e) => updateRequirement(index, { question: e.target.value })}
                        placeholder="What do you need from the buyer?"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex items-center gap-4">
                        <select
                          value={req.type}
                          onChange={(e) => updateRequirement(index, { type: e.target.value as 'text' | 'multiple_choice' | 'file' })}
                          className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          <option value="text">Free Text</option>
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="file">File Attachment</option>
                        </select>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={req.required}
                            onChange={(e) => updateRequirement(index, { required: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-600">Required</span>
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={() => removeRequirement(index)}
                      className="text-red-400 hover:text-red-600 mt-3"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addRequirement}
              className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Requirement
            </button>

            {formData.requirements.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No requirements added yet. Add questions to gather information from buyers.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Gallery */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gallery</h2>
              <p className="text-gray-600">Upload images to showcase your work</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Gig Images (up to 5)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreview.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                    <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                {imagePreview.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-2">
                First image will be your gig cover. Recommended size: 1280x720px
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Publish */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Publish!</h2>
              <p className="text-gray-600">Review your gig and make it live</p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                {imagePreview[0] ? (
                  <img src={imagePreview[0]} alt="Cover" className="w-24 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-2xl">{selectedCategory?.icon || '📦'}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-900">{formData.title || 'Untitled Gig'}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedCategory?.name} &gt; {selectedSubcategory?.name}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                {formData.packages.map((pkg) => (
                  <div key={pkg.name} className="text-center p-3 bg-white rounded-lg">
                    <p className="text-sm font-medium text-gray-600 capitalize">{pkg.name}</p>
                    <p className="text-xl font-bold text-gray-900">${pkg.price}</p>
                    <p className="text-xs text-gray-500">{DELIVERY_TIME_LABELS[pkg.deliveryTime]}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 text-center text-sm">
                <div>
                  <p className="text-gray-500">Tags</p>
                  <p className="font-semibold text-gray-900">{formData.tags.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">FAQs</p>
                  <p className="font-semibold text-gray-900">{formData.faqs.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Requirements</p>
                  <p className="font-semibold text-gray-900">{formData.requirements.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Images</p>
                  <p className="font-semibold text-gray-900">{imagePreview.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-6 py-3 text-gray-600 font-medium hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Save Draft
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 shadow-lg"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Publish Gig
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGig;
