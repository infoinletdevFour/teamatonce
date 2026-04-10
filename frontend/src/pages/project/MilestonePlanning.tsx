import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Save,
  Send,
  X,
  GripVertical,
  DollarSign,
  Clock,
  Calendar,
  Package,
  Target,
  FileCheck,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Trash2,
  Edit3,
  ArrowLeft,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { socketClient } from '@/lib/websocket-client';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import {
  createMilestonePlan,
  updateMilestonePlan,
  submitMilestonePlan,
  getLatestMilestonePlan,
  aiGenerateMilestonePlan,
  type ProposedMilestone,
  type MilestonePlan,
} from '@/services/milestonePlanService';
import { getProject } from '@/services/projectService';

const MILESTONE_TYPES = [
  { value: 'planning', label: 'Planning', icon: Target, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  { value: 'design', label: 'Design', icon: Package, color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' },
  { value: 'development', label: 'Development', icon: FileCheck, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' },
  { value: 'testing', label: 'Testing', icon: CheckCircle, color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700' },
  { value: 'deployment', label: 'Deployment', icon: TrendingUp, color: 'pink', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', textColor: 'text-pink-700' },
  { value: 'maintenance', label: 'Maintenance', icon: Clock, color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700' },
];

interface MilestoneFormData extends Omit<ProposedMilestone, 'orderIndex'> {
  id?: string; // Temporary ID for local state
  dependencies?: string[];
  resourcesRequired?: string[];
  reviewProcess?: string;
  qualityMetrics?: string[];
  technicalDetails?: string;
}

export const MilestonePlanning: React.FC = () => {
  const { projectId, companyId } = useParams<{ projectId: string; companyId: string }>();
  const navigate = useNavigate();
  const { company } = useCompany();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [existingPlan, setExistingPlan] = useState<MilestonePlan | null>(null);
  const [milestones, setMilestones] = useState<MilestoneFormData[]>([]);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [submitNote, setSubmitNote] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedProposalId, setAcceptedProposalId] = useState<string | null>(null);

  // Enhanced plan-level details
  const [projectOverview, setProjectOverview] = useState('');
  const [technicalApproach, setTechnicalApproach] = useState('');
  const [toolsAndTechnologies, setToolsAndTechnologies] = useState<string[]>(['']);
  const [communicationPlan, setCommunicationPlan] = useState('');
  const [assumptions, setAssumptions] = useState<string[]>(['']);
  const [risks, setRisks] = useState<string[]>(['']);
  const [testingStrategy, setTestingStrategy] = useState('');

  // Load project and existing plan
  useEffect(() => {
    const loadData = async () => {
      if (!projectId || !company?.id) return;

      try {
        setLoading(true);

        // Load project details
        const projectData = await getProject(projectId);
        setProject(projectData);

        // Load existing milestone plan
        const plan = await getLatestMilestonePlan(projectId);

        if (plan) {
          setExistingPlan(plan);

          // Load milestones from plan
          const loadedMilestones: MilestoneFormData[] = plan.milestones.map((m, index) => ({
            ...m,
            id: `milestone-${index}`,
          }));
          setMilestones(loadedMilestones);

          // Load enhanced plan-level fields
          setProjectOverview(plan.projectOverview || '');
          setTechnicalApproach(plan.technicalApproach || '');
          setToolsAndTechnologies(plan.toolsAndTechnologies && plan.toolsAndTechnologies.length > 0 ? plan.toolsAndTechnologies : ['']);
          setCommunicationPlan(plan.communicationPlan || '');
          setAssumptions(plan.assumptions && plan.assumptions.length > 0 ? plan.assumptions : ['']);
          setRisks(plan.risks && plan.risks.length > 0 ? plan.risks : ['']);
          setTestingStrategy(plan.testingStrategy || '');
        } else {
          // No existing plan, fetch accepted proposal ID from backend
          try {
            const { data } = await apiClient.get(`/projects/${projectId}/milestone-plans/accepted-proposal`);
            setAcceptedProposalId(data.proposalId);
          } catch (err: any) {
            // If no accepted proposal found, show helpful error
            console.error('No accepted proposal:', err);
            toast.error('Please accept a proposal before creating milestone plan');
            setError('no_proposal_accepted');
            setLoading(false);
            return;
          }
          // Add initial milestone
          addMilestone();
        }
      } catch (error: any) {
        console.error('Failed to load data:', error);
        toast.error(error.message || 'Failed to load milestone plan');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, company?.id]);

  // WebSocket Integration for Real-Time Updates
  useEffect(() => {
    if (!projectId || !user?.id || !company?.id) return;

    // Connect to WebSocket and join project room
    socketClient.connect(user.id, projectId);
    socketClient.joinProject(projectId, user.id);

    // Listen for plan approved event (client approved)
    const handlePlanApproved = (data: any) => {
      console.log('Milestone plan approved:', data);
      toast.success('🎉 Client approved your milestone plan! Project starting...');

      // Reload the plan
      getLatestMilestonePlan(projectId).then(plan => {
        if (plan) {
          setExistingPlan(plan);
          const loadedMilestones: MilestoneFormData[] = plan.milestones.map((m, index) => ({
            ...m,
            id: `milestone-${index}`,
          }));
          setMilestones(loadedMilestones);
        }
      });

      // Navigate to project dashboard after short delay
      setTimeout(() => {
        navigate(`/company/${company.id}/project/${projectId}/dashboard`);
      }, 2000);
    };

    // Listen for changes requested event (client wants revisions)
    const handleChangesRequested = (data: any) => {
      console.log('Changes requested on milestone plan:', data);
      toast.error('Client requested changes to your milestone plan');

      // Reload the plan to show feedback
      getLatestMilestonePlan(projectId).then(plan => {
        if (plan) {
          setExistingPlan(plan);
          const loadedMilestones: MilestoneFormData[] = plan.milestones.map((m, index) => ({
            ...m,
            id: `milestone-${index}`,
          }));
          setMilestones(loadedMilestones);
        }
      });
    };

    // Listen for plan rejected event
    const handlePlanRejected = (data: any) => {
      console.log('Milestone plan rejected:', data);
      toast.error('Client rejected your milestone plan. Please create a new one.');

      // Reload the plan
      getLatestMilestonePlan(projectId).then(plan => {
        if (plan) {
          setExistingPlan(plan);
        } else {
          // Plan was deleted, start fresh
          setExistingPlan(null);
          setMilestones([]);
          addMilestone();
        }
      });
    };

    // Register event listeners
    socketClient.onMilestonePlanApproved(handlePlanApproved);
    socketClient.onMilestonePlanChangesRequested(handleChangesRequested);
    socketClient.onMilestonePlanRejected(handlePlanRejected);

    // Cleanup on unmount
    return () => {
      socketClient.offMilestonePlanEvents();
      socketClient.leaveProject(projectId);
    };
  }, [projectId, user?.id, company?.id, navigate]);

  // Add new milestone
  const addMilestone = () => {
    const newMilestone: MilestoneFormData = {
      id: `milestone-${Date.now()}`,
      name: '',
      description: '',
      milestoneType: 'development',
      deliverables: [''],
      acceptanceCriteria: [''],
      estimatedHours: 0,
      milestoneAmount: 0,
      dueDate: '',
      // Enhanced Upwork-style fields
      dependencies: [''],
      resourcesRequired: [''],
      reviewProcess: '',
      qualityMetrics: [''],
      technicalDetails: '',
    };
    setMilestones([...milestones, newMilestone]);
    setExpandedMilestone(newMilestone.id!);
  };

  // Remove milestone
  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
    if (expandedMilestone === id) {
      setExpandedMilestone(null);
    }
  };

  // Update milestone
  const updateMilestoneField = (id: string, field: keyof MilestoneFormData, value: any) => {
    setMilestones(milestones.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  // Add deliverable
  const addDeliverable = (id: string) => {
    setMilestones(milestones.map(m =>
      m.id === id ? { ...m, deliverables: [...m.deliverables, ''] } : m
    ));
  };

  // Update deliverable
  const updateDeliverable = (id: string, index: number, value: string) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        const newDeliverables = [...m.deliverables];
        newDeliverables[index] = value;
        return { ...m, deliverables: newDeliverables };
      }
      return m;
    }));
  };

  // Remove deliverable
  const removeDeliverable = (id: string, index: number) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        return { ...m, deliverables: m.deliverables.filter((_, i) => i !== index) };
      }
      return m;
    }));
  };

  // Add acceptance criterion
  const addAcceptanceCriterion = (id: string) => {
    setMilestones(milestones.map(m =>
      m.id === id ? { ...m, acceptanceCriteria: [...m.acceptanceCriteria, ''] } : m
    ));
  };

  // Update acceptance criterion
  const updateAcceptanceCriterion = (id: string, index: number, value: string) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        const newCriteria = [...m.acceptanceCriteria];
        newCriteria[index] = value;
        return { ...m, acceptanceCriteria: newCriteria };
      }
      return m;
    }));
  };

  // Remove acceptance criterion
  const removeAcceptanceCriterion = (id: string, index: number) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        return { ...m, acceptanceCriteria: m.acceptanceCriteria.filter((_, i) => i !== index) };
      }
      return m;
    }));
  };

  // ====== Enhanced array field helpers ======

  // Dependencies
  const addDependency = (id: string) => {
    setMilestones(milestones.map(m =>
      m.id === id ? { ...m, dependencies: [...(m.dependencies || []), ''] } : m
    ));
  };

  const updateDependency = (id: string, index: number, value: string) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        const newDeps = [...(m.dependencies || [])];
        newDeps[index] = value;
        return { ...m, dependencies: newDeps };
      }
      return m;
    }));
  };

  const removeDependency = (id: string, index: number) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        return { ...m, dependencies: (m.dependencies || []).filter((_, i) => i !== index) };
      }
      return m;
    }));
  };

  // Resources Required
  const addResource = (id: string) => {
    setMilestones(milestones.map(m =>
      m.id === id ? { ...m, resourcesRequired: [...(m.resourcesRequired || []), ''] } : m
    ));
  };

  const updateResource = (id: string, index: number, value: string) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        const newResources = [...(m.resourcesRequired || [])];
        newResources[index] = value;
        return { ...m, resourcesRequired: newResources };
      }
      return m;
    }));
  };

  const removeResource = (id: string, index: number) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        return { ...m, resourcesRequired: (m.resourcesRequired || []).filter((_, i) => i !== index) };
      }
      return m;
    }));
  };

  // Quality Metrics
  const addQualityMetric = (id: string) => {
    setMilestones(milestones.map(m =>
      m.id === id ? { ...m, qualityMetrics: [...(m.qualityMetrics || []), ''] } : m
    ));
  };

  const updateQualityMetric = (id: string, index: number, value: string) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        const newMetrics = [...(m.qualityMetrics || [])];
        newMetrics[index] = value;
        return { ...m, qualityMetrics: newMetrics };
      }
      return m;
    }));
  };

  const removeQualityMetric = (id: string, index: number) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        return { ...m, qualityMetrics: (m.qualityMetrics || []).filter((_, i) => i !== index) };
      }
      return m;
    }));
  };

  // Plan-level: Tools & Technologies
  const addTool = () => {
    setToolsAndTechnologies([...toolsAndTechnologies, '']);
  };

  const updateTool = (index: number, value: string) => {
    const newTools = [...toolsAndTechnologies];
    newTools[index] = value;
    setToolsAndTechnologies(newTools);
  };

  const removeTool = (index: number) => {
    setToolsAndTechnologies(toolsAndTechnologies.filter((_, i) => i !== index));
  };

  // Plan-level: Assumptions
  const addAssumption = () => {
    setAssumptions([...assumptions, '']);
  };

  const updateAssumption = (index: number, value: string) => {
    const newAssumptions = [...assumptions];
    newAssumptions[index] = value;
    setAssumptions(newAssumptions);
  };

  const removeAssumption = (index: number) => {
    setAssumptions(assumptions.filter((_, i) => i !== index));
  };

  // Plan-level: Risks
  const addRisk = () => {
    setRisks([...risks, '']);
  };

  const updateRisk = (index: number, value: string) => {
    const newRisks = [...risks];
    newRisks[index] = value;
    setRisks(newRisks);
  };

  const removeRisk = (index: number) => {
    setRisks(risks.filter((_, i) => i !== index));
  };

  // Calculate total budget
  const totalBudget = milestones.reduce((sum, m) => sum + (m.milestoneAmount || 0), 0);
  const totalHours = milestones.reduce((sum, m) => sum + (m.estimatedHours || 0), 0);

  // Validate milestones
  const validateMilestones = (): boolean => {
    if (milestones.length === 0) {
      toast.error('Please add at least one milestone');
      return false;
    }

    for (const milestone of milestones) {
      if (!milestone.name.trim()) {
        toast.error('All milestones must have a name');
        return false;
      }
      if (!milestone.description.trim()) {
        toast.error('All milestones must have a description');
        return false;
      }
      if (!milestone.milestoneAmount || milestone.milestoneAmount <= 0) {
        toast.error('All milestones must have a valid payment amount');
        return false;
      }
      if (!milestone.estimatedHours || milestone.estimatedHours <= 0) {
        toast.error('All milestones must have valid estimated hours');
        return false;
      }
      if (milestone.deliverables.filter(d => d.trim()).length === 0) {
        toast.error('All milestones must have at least one deliverable');
        return false;
      }
    }

    return true;
  };

  // Save as draft
  const saveDraft = async () => {
    if (!validateMilestones()) return;

    try {
      setSaving(true);

      // Prepare milestones with proper order (including enhanced fields)
      const proposedMilestones: ProposedMilestone[] = milestones.map((m, index) => ({
        name: m.name,
        description: m.description,
        milestoneType: m.milestoneType,
        orderIndex: index,
        deliverables: m.deliverables.filter(d => d.trim()),
        acceptanceCriteria: m.acceptanceCriteria.filter(c => c.trim()),
        estimatedHours: m.estimatedHours,
        milestoneAmount: m.milestoneAmount,
        dueDate: m.dueDate || undefined,
        // Enhanced fields
        dependencies: (m.dependencies || []).filter(d => d.trim()),
        resourcesRequired: (m.resourcesRequired || []).filter(r => r.trim()),
        reviewProcess: m.reviewProcess || undefined,
        qualityMetrics: (m.qualityMetrics || []).filter(q => q.trim()),
        technicalDetails: m.technicalDetails || undefined,
      }));

      // Prepare plan-level data
      const planData: any = {
        milestones: proposedMilestones,
        // Enhanced plan-level fields
        projectOverview: projectOverview || undefined,
        technicalApproach: technicalApproach || undefined,
        toolsAndTechnologies: toolsAndTechnologies.filter(t => t.trim()),
        communicationPlan: communicationPlan || undefined,
        assumptions: assumptions.filter(a => a.trim()),
        risks: risks.filter(r => r.trim()),
        testingStrategy: testingStrategy || undefined,
      };

      if (existingPlan) {
        // Update existing plan
        await updateMilestonePlan(projectId!, existingPlan.id, planData);
        toast.success('Milestone plan updated successfully');
      } else {
        // Create new plan - get accepted proposal ID
        const proposalId = await getAcceptedProposalId(projectId!);

        const newPlan = await createMilestonePlan(projectId!, {
          projectId: projectId!,
          proposalId: proposalId,
          ...planData,
        });
        setExistingPlan(newPlan);
        toast.success('Milestone plan saved as draft');
      }
    } catch (error: any) {
      console.error('Failed to save:', error);
      toast.error(error.message || 'Failed to save milestone plan');
    } finally {
      setSaving(false);
    }
  };

  // AI Generate milestones
  const handleAIGenerate = async () => {
    if (!projectId) return;

    // Warn if overwriting existing milestones (but don't block with alert)
    if (milestones.length > 0) {
      toast.warning('Replacing existing milestones with AI-generated ones...', { duration: 3000 });
    }

    try {
      setAiGenerating(true);
      toast.info('AI is analyzing your project and generating milestone suggestions...');

      const result = await aiGenerateMilestonePlan(projectId);

      // Transform AI-generated milestones to form data
      const aiMilestones: MilestoneFormData[] = result.milestones.map((m: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        name: m.name || '',
        description: m.description || '',
        milestoneType: 'development', // Default type, user can change
        deliverables: m.deliverables || [],
        acceptanceCriteria: m.acceptanceCriteria || [],
        estimatedHours: m.estimatedHours || 0,
        milestoneAmount: m.budgetAllocation || 0,
        dependencies: m.dependencies || [],
        riskLevel: m.riskLevel || 'medium',
        riskMitigation: m.riskMitigation || '',
        technicalNotes: m.technicalNotes || '',
        duration: m.duration || '',
      }));

      setMilestones(aiMilestones);

      // Populate project-level details from AI
      if (result.projectOverview) setProjectOverview(result.projectOverview);
      if (result.technicalApproach) setTechnicalApproach(result.technicalApproach);
      if (result.toolsAndTechnologies && result.toolsAndTechnologies.length > 0) {
        setToolsAndTechnologies(result.toolsAndTechnologies);
      }
      if (result.communicationPlan) setCommunicationPlan(result.communicationPlan);
      if (result.assumptions && result.assumptions.length > 0) {
        setAssumptions(result.assumptions);
      }
      if (result.risks && result.risks.length > 0) {
        setRisks(result.risks);
      }
      if (result.testingStrategy) setTestingStrategy(result.testingStrategy);

      toast.success(`AI generated ${aiMilestones.length} milestones with project details!`);
      toast.info('Review and edit all fields as needed before saving');
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'Failed to generate AI milestones');
    } finally {
      setAiGenerating(false);
    }
  };

  // Get accepted proposal ID for project
  const getAcceptedProposalId = async (projectId: string): Promise<string> => {
    try {
      // If existing plan has proposal ID, use that
      if (existingPlan?.proposalId) {
        return existingPlan.proposalId;
      }

      // Otherwise, fetch from backend API
      const response = await apiClient.get(`/projects/${projectId}/milestone-plans/accepted-proposal`);
      const proposalId = response.data.data?.proposalId;

      if (!proposalId) {
        throw new Error('No accepted proposal found for this project');
      }

      return proposalId;
    } catch (error: any) {
      console.error('Failed to get accepted proposal:', error);
      throw new Error(error.response?.data?.message || 'Failed to find accepted proposal. Make sure a proposal has been accepted before creating milestones.');
    }
  };

  // Submit for review
  const handleSubmit = async () => {
    if (!validateMilestones()) return;

    try {
      setSubmitting(true);

      // Save first if not saved
      if (!existingPlan) {
        const proposedMilestones: ProposedMilestone[] = milestones.map((m, index) => ({
          name: m.name,
          description: m.description,
          milestoneType: m.milestoneType,
          orderIndex: index,
          deliverables: m.deliverables.filter(d => d.trim()),
          acceptanceCriteria: m.acceptanceCriteria.filter(c => c.trim()),
          estimatedHours: m.estimatedHours,
          milestoneAmount: m.milestoneAmount,
          dueDate: m.dueDate || undefined,
          // Enhanced fields
          dependencies: (m.dependencies || []).filter(d => d.trim()),
          resourcesRequired: (m.resourcesRequired || []).filter(r => r.trim()),
          reviewProcess: m.reviewProcess || undefined,
          qualityMetrics: (m.qualityMetrics || []).filter(q => q.trim()),
          technicalDetails: m.technicalDetails || undefined,
        }));

        // Get the accepted proposal ID
        const proposalId = await getAcceptedProposalId(projectId!);

        const newPlan = await createMilestonePlan(projectId!, {
          projectId: projectId!,
          proposalId: proposalId,
          milestones: proposedMilestones,
          // Enhanced plan-level fields
          projectOverview: projectOverview || undefined,
          technicalApproach: technicalApproach || undefined,
          toolsAndTechnologies: toolsAndTechnologies.filter(t => t.trim()),
          communicationPlan: communicationPlan || undefined,
          assumptions: assumptions.filter(a => a.trim()),
          risks: risks.filter(r => r.trim()),
          testingStrategy: testingStrategy || undefined,
        });
        setExistingPlan(newPlan);

        // Submit the new plan
        await submitMilestonePlan(newPlan.id, submitNote);
      } else {
        // Submit existing plan
        await submitMilestonePlan(existingPlan.id, submitNote);
      }

      toast.success('Milestone plan submitted for client review!');
      setShowSubmitModal(false);

      // Reload the plan to show updated status (pending_review)
      const updatedPlan = await getLatestMilestonePlan(projectId);
      setExistingPlan(updatedPlan);

      // Clear submit note
      setSubmitNote('');
    } catch (error: any) {
      console.error('Failed to submit:', error);
      toast.error(error.message || 'Failed to submit milestone plan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProjectPageLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </ProjectPageLayout>
    );
  }

  // Show friendly error when no accepted proposal exists
  if (error === 'no_proposal_accepted') {
    return (
      <ProjectPageLayout>
        <div className="max-w-4xl mx-auto py-12 px-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300 shadow-lg"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-200 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-yellow-700" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4">
              Proposal Acceptance Required
            </h3>
            <p className="text-lg text-yellow-800 font-semibold mb-6">
              Please accept a developer's proposal before creating a milestone plan
            </p>

            <div className="max-w-md mx-auto mb-8 text-left bg-white rounded-lg p-6 border border-yellow-200">
              <p className="text-gray-700 font-semibold mb-4">📋 Required workflow:</p>
              <ol className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">1. Developer submits proposal</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="text-yellow-900 font-bold">2. You accept the proposal ← You are here</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-400">○</span>
                  </div>
                  <span>3. Developer creates milestone plan</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-400">○</span>
                  </div>
                  <span>4. You review and approve plan</span>
                </li>
              </ol>
            </div>

            <Link
              to={`/company/${companyId}/project/${projectId}/proposals`}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              View & Accept Proposals
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </ProjectPageLayout>
    );
  }

  const canEdit = existingPlan?.status === 'draft' || existingPlan?.status === 'changes_requested' || !existingPlan;

  return (
    <ProjectPageLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Milestone Planning
              </h1>
              <p className="text-gray-600">
                Create a detailed milestone plan for client approval
              </p>
              {existingPlan && (
                <div className="mt-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    existingPlan.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    existingPlan.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                    existingPlan.status === 'changes_requested' ? 'bg-orange-100 text-orange-700' :
                    existingPlan.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {existingPlan.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {canEdit && (
              <div className="flex gap-3">
                <button
                  onClick={handleAIGenerate}
                  disabled={aiGenerating || !project}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="AI will analyze your project details and generate milestone suggestions"
                >
                  {aiGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {aiGenerating ? 'Generating...' : 'AI Generate'}
                </button>
                <button
                  onClick={saveDraft}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Draft
                </button>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={milestones.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Submit for Review
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CLIENT FEEDBACK BANNER - Show prominently when changes requested */}
        {existingPlan?.status === 'changes_requested' && existingPlan.clientFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-orange-700 animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-orange-900 mb-2 flex items-center gap-2">
                  📝 Client Requested Changes
                </h3>
                <p className="text-sm text-orange-700 mb-3 font-medium">
                  Please review and address the client's feedback below:
                </p>
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <p className="text-gray-900 whitespace-pre-wrap">{existingPlan.clientFeedback}</p>
                </div>
                <p className="text-sm text-orange-600 mt-3 font-medium">
                  💡 Make the necessary changes and resubmit the plan for client approval.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* PENDING REVIEW BANNER - Show when waiting for client */}
        {existingPlan?.status === 'pending_review' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-200 flex items-center justify-center">
                <Clock className="w-7 h-7 text-yellow-700 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-yellow-900 mb-1">
                  ⏳ Submitted - Awaiting Client Review
                </h3>
                <p className="text-sm text-yellow-700">
                  Your milestone plan has been submitted. The client will review and either approve it or request changes.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* APPROVED BANNER */}
        {existingPlan?.status === 'approved' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-900 mb-1">
                  ✅ Plan Approved - Project Started!
                </h3>
                <p className="text-sm text-green-700">
                  The client approved your milestone plan. Milestones have been created and you can start working on the project.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* REJECTED BANNER */}
        {existingPlan?.status === 'rejected' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
                  <X className="w-7 h-7 text-red-700" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 mb-2">
                  ❌ Plan Rejected
                </h3>
                {existingPlan.clientFeedback && (
                  <>
                    <p className="text-sm text-red-700 mb-3 font-medium">Client's reason:</p>
                    <div className="bg-white p-4 rounded-lg border border-red-200 mb-3">
                      <p className="text-gray-900 whitespace-pre-wrap">{existingPlan.clientFeedback}</p>
                    </div>
                  </>
                )}
                <p className="text-sm text-red-600 font-medium">
                  Please create a new milestone plan addressing the client's concerns.
                </p>
              </div>
            </div>
          </motion.div>
        )}


        {/* Budget Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Budget</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">${totalBudget.toLocaleString()}</p>
            <p className="text-sm text-blue-700 mt-1">{milestones.length} milestones</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Total Hours</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">{totalHours}</p>
            <p className="text-sm text-purple-700 mt-1">Estimated effort</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Avg Rate</span>
            </div>
            <p className="text-3xl font-bold text-green-900">
              ${totalHours > 0 ? Math.round(totalBudget / totalHours) : 0}/hr
            </p>
            <p className="text-sm text-green-700 mt-1">Hourly rate</p>
          </div>
        </motion.div>

        {/* Project Details (Professional Fields) */}
        {canEdit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Project Details</h2>
                <p className="text-sm text-gray-600">Provide comprehensive project information for the client</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Project Overview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Overview
                  <span className="text-gray-500 font-normal ml-2">(Executive summary)</span>
                </label>
                <textarea
                  value={projectOverview}
                  onChange={(e) => setProjectOverview(e.target.value)}
                  placeholder="Provide a high-level executive summary of the project, its goals, and expected outcomes..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Technical Approach */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technical Approach
                  <span className="text-gray-500 font-normal ml-2">(How the work will be executed)</span>
                </label>
                <textarea
                  value={technicalApproach}
                  onChange={(e) => setTechnicalApproach(e.target.value)}
                  placeholder="Describe the technical methodology, architecture, and implementation strategy..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Tools & Technologies */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Tools & Technologies
                    <span className="text-gray-500 font-normal ml-2">(Stack that will be used)</span>
                  </label>
                  <button
                    onClick={addTool}
                    className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Tool
                  </button>
                </div>
                <div className="space-y-2">
                  {toolsAndTechnologies.map((tool, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tool}
                        onChange={(e) => updateTool(idx, e.target.value)}
                        placeholder="e.g., React, Node.js, PostgreSQL, AWS"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {toolsAndTechnologies.length > 1 && (
                        <button
                          onClick={() => removeTool(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Communication Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Plan
                  <span className="text-gray-500 font-normal ml-2">(How updates will be shared)</span>
                </label>
                <textarea
                  value={communicationPlan}
                  onChange={(e) => setCommunicationPlan(e.target.value)}
                  placeholder="Describe how you'll communicate progress, frequency of updates, preferred channels, meeting schedules..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Assumptions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Assumptions
                    <span className="text-gray-500 font-normal ml-2">(Prerequisites and expectations)</span>
                  </label>
                  <button
                    onClick={addAssumption}
                    className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Assumption
                  </button>
                </div>
                <div className="space-y-2">
                  {assumptions.map((assumption, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={assumption}
                        onChange={(e) => updateAssumption(idx, e.target.value)}
                        placeholder="e.g., Client will provide API credentials within 24 hours"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {assumptions.length > 1 && (
                        <button
                          onClick={() => removeAssumption(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Risks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Risks & Mitigation
                    <span className="text-gray-500 font-normal ml-2">(Potential issues and solutions)</span>
                  </label>
                  <button
                    onClick={addRisk}
                    className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Risk
                  </button>
                </div>
                <div className="space-y-2">
                  {risks.map((risk, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={risk}
                        onChange={(e) => updateRisk(idx, e.target.value)}
                        placeholder="e.g., Third-party API downtime - Mitigation: Implement caching and fallback mechanisms"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {risks.length > 1 && (
                        <button
                          onClick={() => removeRisk(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Testing Strategy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Testing Strategy
                  <span className="text-gray-500 font-normal ml-2">(Quality assurance approach)</span>
                </label>
                <textarea
                  value={testingStrategy}
                  onChange={(e) => setTestingStrategy(e.target.value)}
                  placeholder="Describe your testing methodology, tools, coverage targets, and quality assurance processes..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Milestones */}
        <div className="space-y-4">
          <Reorder.Group
            axis="y"
            values={milestones}
            onReorder={setMilestones}
            className="space-y-4"
          >
            <AnimatePresence>
              {milestones.map((milestone, index) => {
                const typeInfo = MILESTONE_TYPES.find(t => t.value === milestone.milestoneType) || MILESTONE_TYPES[2];
                const Icon = typeInfo.icon;
                const isExpanded = expandedMilestone === milestone.id;

                return (
                  <Reorder.Item
                    key={milestone.id}
                    value={milestone}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      {/* Milestone Header */}
                      <div
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${typeInfo.bgColor} border-b ${typeInfo.borderColor}`}
                        onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id!)}
                      >
                        <div className="flex items-center gap-4">
                          <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />

                          <div className={`p-2 rounded-lg ${typeInfo.bgColor}`}>
                            <Icon className={`w-5 h-5 ${typeInfo.textColor}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-500">Milestone {index + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.bgColor} ${typeInfo.textColor} font-medium`}>
                                {typeInfo.label}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {milestone.name || 'Untitled Milestone'}
                            </h3>
                            {milestone.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                {milestone.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <p className="text-gray-500">Budget</p>
                              <p className="font-semibold text-gray-900">${milestone.milestoneAmount || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500">Hours</p>
                              <p className="font-semibold text-gray-900">{milestone.estimatedHours || 0}</p>
                            </div>
                          </div>

                          {canEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMilestone(milestone.id!);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Milestone Form (Expanded) */}
                      <AnimatePresence>
                        {isExpanded && canEdit && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-gray-200"
                          >
                            <div className="p-6 space-y-6">
                              {/* Basic Info */}
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Milestone Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={milestone.name}
                                    onChange={(e) => updateMilestoneField(milestone.id!, 'name', e.target.value)}
                                    placeholder="e.g., Backend API Development"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Milestone Type *
                                  </label>
                                  <select
                                    value={milestone.milestoneType}
                                    onChange={(e) => updateMilestoneField(milestone.id!, 'milestoneType', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  >
                                    {MILESTONE_TYPES.map(type => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Description *
                                </label>
                                <textarea
                                  value={milestone.description}
                                  onChange={(e) => updateMilestoneField(milestone.id!, 'description', e.target.value)}
                                  placeholder="Detailed description of what will be accomplished in this milestone..."
                                  rows={3}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>

                              {/* Budget & Timeline */}
                              <div className="grid grid-cols-3 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Amount * ($)
                                  </label>
                                  <input
                                    type="number"
                                    value={milestone.milestoneAmount || ''}
                                    onChange={(e) => updateMilestoneField(milestone.id!, 'milestoneAmount', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Estimated Hours *
                                  </label>
                                  <input
                                    type="number"
                                    value={milestone.estimatedHours || ''}
                                    onChange={(e) => updateMilestoneField(milestone.id!, 'estimatedHours', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Due Date
                                  </label>
                                  <input
                                    type="date"
                                    value={milestone.dueDate || ''}
                                    onChange={(e) => updateMilestoneField(milestone.id!, 'dueDate', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  />
                                </div>
                              </div>

                              {/* Deliverables */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-sm font-medium text-gray-700">
                                    Deliverables * (at least 1)
                                  </label>
                                  <button
                                    onClick={() => addDeliverable(milestone.id!)}
                                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {milestone.deliverables.map((deliverable, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={deliverable}
                                        onChange={(e) => updateDeliverable(milestone.id!, idx, e.target.value)}
                                        placeholder="e.g., RESTful API with authentication"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                      />
                                      {milestone.deliverables.length > 1 && (
                                        <button
                                          onClick={() => removeDeliverable(milestone.id!, idx)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Acceptance Criteria */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-sm font-medium text-gray-700">
                                    Acceptance Criteria
                                  </label>
                                  <button
                                    onClick={() => addAcceptanceCriterion(milestone.id!)}
                                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {milestone.acceptanceCriteria.map((criterion, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={criterion}
                                        onChange={(e) => updateAcceptanceCriterion(milestone.id!, idx, e.target.value)}
                                        placeholder="e.g., All API endpoints tested and documented"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                      />
                                      {milestone.acceptanceCriteria.length > 1 && (
                                        <button
                                          onClick={() => removeAcceptanceCriterion(milestone.id!, idx)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Divider - Advanced Professional Details */}
                              <div className="border-t border-gray-200 pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                  <AlertCircle className="w-5 h-5 text-blue-600" />
                                  <h4 className="text-lg font-semibold text-gray-900">Advanced Details</h4>
                                </div>

                                {/* Dependencies */}
                                <div className="mb-6">
                                  <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-700">
                                      Dependencies
                                      <span className="text-gray-500 font-normal ml-2">(What needs to be completed first)</span>
                                    </label>
                                    <button
                                      onClick={() => addDependency(milestone.id!)}
                                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {(milestone.dependencies || ['']).map((dep, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={dep}
                                          onChange={(e) => updateDependency(milestone.id!, idx, e.target.value)}
                                          placeholder="e.g., Milestone 1 must be approved, Client provides API keys"
                                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {(milestone.dependencies || ['']).length > 1 && (
                                          <button
                                            onClick={() => removeDependency(milestone.id!, idx)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Resources Required */}
                                <div className="mb-6">
                                  <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-700">
                                      Resources Required
                                      <span className="text-gray-500 font-normal ml-2">(Tools, assets, or resources needed)</span>
                                    </label>
                                    <button
                                      onClick={() => addResource(milestone.id!)}
                                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {(milestone.resourcesRequired || ['']).map((resource, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={resource}
                                          onChange={(e) => updateResource(milestone.id!, idx, e.target.value)}
                                          placeholder="e.g., AWS account access, Design mockups, Database credentials"
                                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {(milestone.resourcesRequired || ['']).length > 1 && (
                                          <button
                                            onClick={() => removeResource(milestone.id!, idx)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Review Process */}
                                <div className="mb-6">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Review Process
                                    <span className="text-gray-500 font-normal ml-2">(How client will review this milestone)</span>
                                  </label>
                                  <textarea
                                    value={milestone.reviewProcess || ''}
                                    onChange={(e) => updateMilestoneField(milestone.id!, 'reviewProcess', e.target.value)}
                                    placeholder="Describe how the client should review this milestone (e.g., Demo call, Staging environment review, Documentation walkthrough)..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>

                                {/* Quality Metrics */}
                                <div className="mb-6">
                                  <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-700">
                                      Quality Metrics
                                      <span className="text-gray-500 font-normal ml-2">(How success will be measured)</span>
                                    </label>
                                    <button
                                      onClick={() => addQualityMetric(milestone.id!)}
                                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {(milestone.qualityMetrics || ['']).map((metric, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={metric}
                                          onChange={(e) => updateQualityMetric(milestone.id!, idx, e.target.value)}
                                          placeholder="e.g., 90% test coverage, Page load under 2 seconds, Zero critical bugs"
                                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {(milestone.qualityMetrics || ['']).length > 1 && (
                                          <button
                                            onClick={() => removeQualityMetric(milestone.id!, idx)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Technical Details */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Technical Details
                                    <span className="text-gray-500 font-normal ml-2">(Implementation specifics)</span>
                                  </label>
                                  <textarea
                                    value={milestone.technicalDetails || ''}
                                    onChange={(e) => updateMilestoneField(milestone.id!, 'technicalDetails', e.target.value)}
                                    placeholder="Provide technical implementation details, architecture decisions, patterns used, etc..."
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>

          {/* Add Milestone Button */}
          {canEdit && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={addMilestone}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors group"
            >
              <div className="flex items-center justify-center gap-2 text-gray-600 group-hover:text-primary-600">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Milestone</span>
              </div>
            </motion.button>
          )}
        </div>

        {/* Submit Modal */}
        <AnimatePresence>
          {showSubmitModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSubmitModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Submit Milestone Plan
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Ready to submit?</strong> The client will be notified to review your milestone plan. They can approve it, request changes, or reject it.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note to Client (Optional)
                    </label>
                    <textarea
                      value={submitNote}
                      onChange={(e) => setSubmitNote(e.target.value)}
                      placeholder="Add any notes or context for the client..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProjectPageLayout>
  );
};

export default MilestonePlanning;
