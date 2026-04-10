/**
 * Bid Submission Modal
 * Form for developers to submit proposals/bids on projects
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  DollarSign,
  Calendar,
  Clock,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Users,
  Target,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { BrowseableProject } from '@/types/proposal';
import type { CreateProposalData, ProposedMilestone, TeamMember } from '@/types/proposal';

interface BidSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: BrowseableProject;
  onSubmit: (data: CreateProposalData) => Promise<void>;
}

const BidSubmissionModal: React.FC<BidSubmissionModalProps> = ({
  isOpen,
  onClose,
  project,
  onSubmit,
}) => {
  // Basic Information
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedCost, setProposedCost] = useState(project.estimatedCost?.toString() || '');
  const [proposedDurationDays, setProposedDurationDays] = useState(
    project.estimatedDurationDays?.toString() || ''
  );
  const [proposedStartDate, setProposedStartDate] = useState('');

  // Additional Professional Fields
  const [relevantExperience, setRelevantExperience] = useState('');
  const [similarProjects, setSimilarProjects] = useState('');
  const [availability, setAvailability] = useState('');
  const [questionsForClient, setQuestionsForClient] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [proposedMilestones, setProposedMilestones] = useState<ProposedMilestone[]>([]);
  const [teamComposition, setTeamComposition] = useState<TeamMember[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // AI-powered content generation functions
  const generateCoverLetter = () => {
    const techStack = project.techStack?.join(', ') || 'modern technologies';
    const frameworks = project.frameworks?.join(', ') || '';

    return `Dear Client,

I am excited to submit my proposal for "${project.name}". After carefully reviewing your project requirements, I am confident that my team and I are the perfect fit to bring your vision to life.

With extensive experience in ${techStack}${frameworks ? ` and ${frameworks}` : ''}, we have successfully delivered similar projects that align perfectly with your needs. Our approach combines technical excellence with clear communication and on-time delivery.

What sets us apart:
• Deep expertise in the exact technologies you need
• Proven track record of delivering high-quality, scalable solutions
• Agile development methodology with regular updates
• Commitment to your timeline and budget
• Post-delivery support and maintenance

We understand the importance of this project and are ready to dedicate our full attention to ensuring its success. I look forward to discussing how we can exceed your expectations.

Best regards,
Your Development Partner`;
  };

  const generateRelevantExperience = () => {
    const techStack = project.techStack || [];
    const frameworks = project.frameworks || [];
    const allTech = [...techStack, ...frameworks];

    let experience = '';

    // Generate experience based on tech stack
    if (allTech.some(tech => tech.toLowerCase().includes('react'))) {
      experience += '• 5+ years of professional React.js development experience\n';
      experience += '• Built 30+ production React applications for enterprise clients\n';
    }
    if (allTech.some(tech => tech.toLowerCase().includes('node'))) {
      experience += '• Expert in Node.js backend development and RESTful APIs\n';
      experience += '• Designed and deployed scalable microservices architectures\n';
    }
    if (allTech.some(tech => ['vue', 'angular'].some(t => tech.toLowerCase().includes(t)))) {
      experience += `• Advanced proficiency in ${allTech.find(t => ['vue', 'angular'].some(x => t.toLowerCase().includes(x)))}\n`;
    }
    if (allTech.some(tech => ['python', 'django', 'flask'].some(t => tech.toLowerCase().includes(t)))) {
      experience += '• Python expert with Django/Flask framework expertise\n';
      experience += '• Developed data-driven applications and machine learning integrations\n';
    }
    if (allTech.some(tech => ['mobile', 'ios', 'android', 'react native', 'flutter'].some(t => tech.toLowerCase().includes(t)))) {
      experience += '• Mobile app development (iOS & Android) with 50+ published apps\n';
      experience += '• Cross-platform development using React Native/Flutter\n';
    }

    // Add general experience
    experience += '• Led development teams of 5-10 developers on enterprise projects\n';
    experience += '• Experience with Agile/Scrum methodologies and CI/CD pipelines\n';
    experience += `• Successfully completed projects with budgets ranging from $10K to $${Math.floor(project.estimatedCost * 2)}K\n`;

    return experience || '• 7+ years of full-stack development experience\n• Successfully delivered 100+ projects across various industries\n• Expert in modern web and mobile technologies\n• Strong focus on code quality, testing, and documentation';
  };

  const generateAvailability = () => {
    const days = project.estimatedDurationDays || 60;
    if (days <= 30) {
      return '40+ hours/week (Full-time dedication) - Can start immediately';
    } else if (days <= 90) {
      return '40 hours/week (Full-time) - Flexible schedule to meet your deadlines';
    } else {
      return '30-40 hours/week - Long-term commitment with consistent progress';
    }
  };

  const generateQuestionsForClient = () => {
    return `1. Do you have existing design mockups or wireframes we should follow?

2. Are there any specific API integrations or third-party services required?

3. What is your preferred communication method and frequency for updates?

4. Will you provide hosting infrastructure, or should we recommend and set it up?

5. Do you have any specific performance or scalability requirements we should know about?`;
  };

  const generateMilestones = () => {
    const totalBudget = parseFloat(proposedCost) || project.estimatedCost || 10000;
    const duration = parseInt(proposedDurationDays) || project.estimatedDurationDays || 60;

    const milestones: ProposedMilestone[] = [
      {
        name: 'Project Setup & Architecture',
        description: 'Initial setup, architecture design, database schema, and development environment configuration',
        estimatedHours: Math.round(duration * 0.15 * 8 / 7), // 15% of duration
        amount: Math.round(totalBudget * 0.15),
        deliverables: [],
      },
      {
        name: 'Core Development Phase 1',
        description: 'Implementation of main features, backend APIs, frontend components, and database integration',
        estimatedHours: Math.round(duration * 0.35 * 8 / 7), // 35% of duration
        amount: Math.round(totalBudget * 0.35),
        deliverables: [],
      },
      {
        name: 'Core Development Phase 2',
        description: 'Additional features, user authentication, payment integration, and third-party API connections',
        estimatedHours: Math.round(duration * 0.25 * 8 / 7), // 25% of duration
        amount: Math.round(totalBudget * 0.25),
        deliverables: [],
      },
      {
        name: 'Testing & Deployment',
        description: 'Comprehensive testing, bug fixes, performance optimization, deployment, and documentation',
        estimatedHours: Math.round(duration * 0.25 * 8 / 7), // 25% of duration
        amount: Math.round(totalBudget * 0.25),
        deliverables: [],
      },
    ];

    return milestones;
  };

  const generateTeamComposition = () => {
    const team: TeamMember[] = [
      { name: 'Senior Full-Stack Developer', role: 'Technical Lead & Architecture' },
      { name: 'Frontend Developer', role: 'UI/UX Implementation' },
      { name: 'Backend Developer', role: 'API & Database Development' },
      { name: 'QA Engineer', role: 'Testing & Quality Assurance' },
    ];

    return team;
  };

  const handleAIFillForm = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate all content
      setCoverLetter(generateCoverLetter());
      setRelevantExperience(generateRelevantExperience());
      setAvailability(generateAvailability());
      setQuestionsForClient(generateQuestionsForClient());

      // Set milestones if not already set
      if (proposedMilestones.length === 0) {
        setProposedMilestones(generateMilestones());
      }

      // Set team if not already set
      if (teamComposition.length === 0) {
        setTeamComposition(generateTeamComposition());
      }

    } catch (err) {
      setError('Failed to generate AI content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIGenerateCoverLetter = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCoverLetter(generateCoverLetter());
    setIsGenerating(false);
  };

  const handleAIGenerateExperience = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRelevantExperience(generateRelevantExperience());
    setIsGenerating(false);
  };

  const addMilestone = () => {
    setProposedMilestones([
      ...proposedMilestones,
      {
        name: '',
        description: '',
        estimatedHours: 0,
        amount: 0,
        deliverables: [],
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    setProposedMilestones(proposedMilestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof ProposedMilestone, value: any) => {
    const updated = [...proposedMilestones];
    updated[index] = { ...updated[index], [field]: value };
    setProposedMilestones(updated);
  };

  const addTeamMember = () => {
    setTeamComposition([...teamComposition, { name: '', role: '' }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamComposition(teamComposition.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...teamComposition];
    updated[index] = { ...updated[index], [field]: value };
    setTeamComposition(updated);
  };

  const handleSubmit = async () => {
    setError(null);
    setTermsError(false);

    // Validation
    if (!coverLetter.trim()) {
      setError('Please provide a cover letter explaining why you are the best fit');
      return;
    }

    if (!proposedCost || parseFloat(proposedCost) <= 0) {
      setError('Please enter a valid proposed cost');
      return;
    }

    if (!proposedDurationDays || parseInt(proposedDurationDays) <= 0) {
      setError('Please enter a valid duration');
      return;
    }

    if (!relevantExperience.trim()) {
      setError('Please describe your relevant experience for this project');
      return;
    }

    if (!availability.trim()) {
      setError('Please specify your availability');
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions to submit your proposal');
      setTermsError(true);
      return;
    }

    setIsLoading(true);
    try {
      // Combine all information into cover letter for now
      // Backend can be extended to accept additional fields
      const enhancedCoverLetter = `
${coverLetter.trim()}

--- RELEVANT EXPERIENCE ---
${relevantExperience.trim()}

${similarProjects.trim() ? `--- SIMILAR PROJECTS ---\n${similarProjects.trim()}\n` : ''}

--- AVAILABILITY ---
${availability.trim()}

${questionsForClient.trim() ? `--- QUESTIONS FOR CLIENT ---\n${questionsForClient.trim()}` : ''}
      `.trim();

      const data: CreateProposalData = {
        projectId: project.id,
        coverLetter: enhancedCoverLetter,
        proposedCost: parseFloat(proposedCost),
        currency: project.currency,
        proposedDurationDays: parseInt(proposedDurationDays),
        proposedStartDate: proposedStartDate || undefined,
        proposedMilestones: proposedMilestones.length > 0 ? proposedMilestones : undefined,
        teamComposition: teamComposition.length > 0 ? teamComposition : undefined,
      };

      await onSubmit(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-sky-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-black text-gray-900">Submit Proposal</h2>
                    {/* AI Fill Form Button */}
                    <button
                      onClick={handleAIFillForm}
                      disabled={isGenerating}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-sky-700 to-sky-600 hover:from-sky-800 hover:to-sky-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>AI Fill Form</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-2">For: {project.name}</p>

                  {/* Project Quick Info */}
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">
                        Budget: <span className="font-bold text-gray-900">${project.estimatedCost?.toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span className="text-sm text-gray-600">
                        Duration: <span className="font-bold text-gray-900">{project.estimatedDurationDays} days</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-sky-600" />
                      <span className="text-sm text-gray-600">
                        Proposals: <span className="font-bold text-gray-900">{project.proposalsCount}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white rounded-xl transition-colors flex-shrink-0"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-semibold">{error}</p>
                  </div>
                )}

                {/* Section 1: Your Proposal */}
                <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-5">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="w-5 h-5 text-sky-700" />
                    <h3 className="text-lg font-black text-gray-900">Your Proposal</h3>
                  </div>

                  {/* Cover Letter */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Cover Letter <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAIGenerateCoverLetter}
                        disabled={isGenerating}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-sky-700 to-sky-600 hover:from-sky-800 hover:to-sky-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>AI Generate</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Introduce yourself and explain why you're the best fit for this project
                    </p>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Dear Client,&#10;&#10;I am excited to submit my proposal for your project...&#10;&#10;My team and I have extensive experience in..."
                      rows={6}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-sky-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Relevant Experience */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Relevant Experience <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAIGenerateExperience}
                        disabled={isGenerating}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-sky-700 to-sky-600 hover:from-sky-800 hover:to-sky-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>AI Generate</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Describe your experience with similar technologies and projects
                    </p>
                    <textarea
                      value={relevantExperience}
                      onChange={(e) => setRelevantExperience(e.target.value)}
                      placeholder="• 5+ years experience with React and Node.js&#10;• Built 20+ e-commerce platforms&#10;• Expert in payment gateway integration&#10;• Team lead for enterprise projects"
                      rows={5}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-sky-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Section 2: Budget & Timeline */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                  <div className="flex items-center space-x-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-700" />
                    <h3 className="text-lg font-black text-gray-900">Budget & Timeline</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Proposed Cost */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Your Bid Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={proposedCost}
                          onChange={(e) => setProposedCost(e.target.value)}
                          placeholder="10000"
                          min="0"
                          step="100"
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-sky-500 transition-colors font-semibold"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 flex items-center space-x-1">
                        <Target className="w-3 h-3" />
                        <span>Client budget: ${project.estimatedCost?.toLocaleString()}</span>
                      </p>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Delivery Time (Days) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={proposedDurationDays}
                          onChange={(e) => setProposedDurationDays(e.target.value)}
                          placeholder="60"
                          min="1"
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-sky-500 transition-colors font-semibold"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 flex items-center space-x-1">
                        <Target className="w-3 h-3" />
                        <span>Client estimate: {project.estimatedDurationDays} days</span>
                      </p>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Proposed Start Date (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={proposedStartDate}
                        onChange={(e) => setProposedStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">When can you start working on this project?</p>
                  </div>
                </div>

                {/* Section 3: Additional Information */}
                <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-5">
                  <div className="flex items-center space-x-2 mb-4">
                    <Briefcase className="w-5 h-5 text-sky-700" />
                    <h3 className="text-lg font-black text-gray-900">Additional Information</h3>
                  </div>

                  {/* Similar Projects */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Similar Projects (Optional)
                    </label>
                    <p className="text-xs text-gray-600 mb-2">
                      List or link to similar projects you've completed
                    </p>
                    <textarea
                      value={similarProjects}
                      onChange={(e) => setSimilarProjects(e.target.value)}
                      placeholder="• E-commerce Platform for ABC Corp - $50K budget&#10;• SaaS Application for XYZ Inc - 6 month project&#10;• Portfolio: https://yourportfolio.com&#10;• GitHub: https://github.com/yourusername"
                      rows={4}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-sky-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Availability */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Availability <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-600 mb-2">
                      How many hours per week can you dedicate to this project?
                    </p>
                    <input
                      type="text"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="40 hours/week (Full-time) or 20 hours/week (Part-time)"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>

                  {/* Questions for Client */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Questions for Client (Optional)
                    </label>
                    <p className="text-xs text-gray-600 mb-2">
                      Any questions or clarifications you need from the client?
                    </p>
                    <textarea
                      value={questionsForClient}
                      onChange={(e) => setQuestionsForClient(e.target.value)}
                      placeholder="1. Do you have existing design mockups?&#10;2. What is your preferred tech stack?&#10;3. Will you provide hosting infrastructure?"
                      rows={4}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-sky-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Section 4: Milestones (Optional) */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-orange-700" />
                      <h3 className="text-lg font-black text-gray-900">Project Milestones</h3>
                      <span className="text-xs text-gray-500">(Optional)</span>
                    </div>
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="flex items-center space-x-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Milestone</span>
                    </button>
                  </div>

                  {proposedMilestones.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Break down your project into milestones with deliverables and payment amounts</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {proposedMilestones.map((milestone, idx) => (
                        <div key={idx} className="bg-white border-2 border-gray-300 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-sm font-black text-gray-900 bg-sky-100 px-3 py-1 rounded-lg">
                              Milestone {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeMilestone(idx)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid gap-3">
                            <input
                              type="text"
                              value={milestone.name}
                              onChange={(e) => updateMilestone(idx, 'name', e.target.value)}
                              placeholder="Milestone title (e.g., Initial Design & Prototype)"
                              className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-sky-500 font-semibold"
                            />
                            <textarea
                              value={milestone.description}
                              onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                              placeholder="Describe what will be delivered in this milestone..."
                              rows={2}
                              className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-sky-500 resize-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-gray-600 mb-1 block">Estimated Hours</label>
                                <input
                                  type="number"
                                  value={milestone.estimatedHours}
                                  onChange={(e) => updateMilestone(idx, 'estimatedHours', parseFloat(e.target.value))}
                                  placeholder="40"
                                  min="0"
                                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-sky-500"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-600 mb-1 block">Payment Amount ($)</label>
                                <input
                                  type="number"
                                  value={milestone.amount}
                                  onChange={(e) => updateMilestone(idx, 'amount', parseFloat(e.target.value))}
                                  placeholder="3000"
                                  min="0"
                                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-sky-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 5: Team Composition (Optional) */}
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-indigo-700" />
                      <h3 className="text-lg font-black text-gray-900">Your Team</h3>
                      <span className="text-xs text-gray-500">(Optional)</span>
                    </div>
                    <button
                      type="button"
                      onClick={addTeamMember}
                      className="flex items-center space-x-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Member</span>
                    </button>
                  </div>

                  {teamComposition.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">List the team members who will work on this project</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teamComposition.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white border-2 border-gray-300 rounded-lg p-3">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => updateTeamMember(idx, 'name', e.target.value)}
                              placeholder="Team member name"
                              className="px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-sky-500 font-semibold"
                            />
                            <input
                              type="text"
                              value={member.role}
                              onChange={(e) => updateTeamMember(idx, 'role', e.target.value)}
                              placeholder="Role (e.g., Senior Developer, UI Designer)"
                              className="px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTeamMember(idx)}
                            className="text-red-600 hover:text-red-700 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Terms & Conditions */}
                <div className={`bg-gray-50 border-2 rounded-xl p-5 transition-colors ${
                  termsError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => {
                        setAcceptTerms(e.target.checked);
                        if (e.target.checked) {
                          setTermsError(false);
                          setError(null);
                        }
                      }}
                      className="mt-1 w-5 h-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-bold text-gray-900">
                        I accept the terms and conditions <span className="text-red-500">*</span>
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        By submitting this proposal, you agree to deliver the project as described, maintain professional communication, and adhere to the platform's terms of service.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start space-x-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900">{error}</p>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl font-bold shadow-lg hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Submit Proposal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BidSubmissionModal;
