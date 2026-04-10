import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Building,
  FolderOpen,
  Plus,
  User,
  LogOut,
  Settings,
  Check,
  ArrowRight,
  Users,
  CreditCard,
  MessageSquare,
  FileText,
  Target,
  Briefcase,
  Calendar,
  BarChart3,
  DollarSign,
  LayoutDashboard,
  UserPlus,
  AlertCircle,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCompanyOptional } from '@/contexts/CompanyContext'
import { useCompanyStore } from '@/stores/companyStore'
import { apiClient } from '@/lib/api-client'
import { Company } from '@/types/company'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface MenuData {
  companies: Company[]
  selectedCompany: Company | null
  projects: any[]
  selectedProject: any | null
}

export const SimpleMegaMenu: React.FC = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Get companyId from URL context (optional - may be null for standalone routes)
  const companyContext = useCompanyOptional()
  const companyId = companyContext?.companyId || null

  // Connect to Zustand store for company selection
  const { currentCompany, setCurrentCompany } = useCompanyStore()

  // Simple state - just menu data and dropdown visibility
  const [menuData, setMenuData] = useState<MenuData>({
    companies: [],
    selectedCompany: null,
    projects: [],
    selectedProject: null
  })

  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const companyDropdownRef = useRef<HTMLDivElement>(null)
  const projectDropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Single function to fetch all menu data
  const fetchMenuData = useCallback(async () => {
    try {
      // Fetch companies - backend returns Company[] directly
      const companiesResponse = await apiClient.get<Company[]>('/company')
      const companies = companiesResponse.data || []

      // All companies returned ARE the user's companies (backend filters by user)
      const userCompanies = companies

      // Get selected company from store or use first company
      const selectedCompany = currentCompany || (userCompanies.length > 0 ? userCompanies[0] : null)

      // If we have a selected company but it's not in the store, set it
      if (selectedCompany && !currentCompany) {
        setCurrentCompany(selectedCompany)
      }

      // Fetch projects if company is selected
      let projects: any[] = []
      let selectedProject = null

      if (selectedCompany) {
        try {
          // For CLIENTS: fetch projects they own (by client_id)
          // For DEVELOPERS: fetch projects assigned to their company AND projects they're members of
          let projectsResponse
          let memberProjects: any[] = []

          if (user?.role === 'client') {
            // Clients see projects from their current company context
            if (companyId) {
              projectsResponse = await apiClient.get<any[]>(`/projects/company/${companyId}`)
            } else {
              projectsResponse = await apiClient.get<any[]>('/projects')
            }
            projects = projectsResponse.data || []
          } else {
            // Developers see:
            // 1. Projects assigned to their company
            try {
              projectsResponse = await apiClient.get<any[]>(`/company/${selectedCompany.id}/projects`)
              projects = projectsResponse.data || []
            } catch (err) {
              console.log('No company projects found or error fetching:', err)
              projects = []
            }

            // 2. Projects where they are individually assigned as team members (from their company)
            try {
              const memberResponse = await apiClient.get<any[]>(`/projects/company/${selectedCompany.id}`)
              memberProjects = memberResponse.data || []

              // Merge and deduplicate by project ID
              const projectMap = new Map()

              // Add company projects first
              projects.forEach(p => projectMap.set(p.id, p))

              // Add member projects (won't overwrite existing)
              memberProjects.forEach(p => {
                if (!projectMap.has(p.id)) {
                  projectMap.set(p.id, p)
                }
              })

              projects = Array.from(projectMap.values())
            } catch (err) {
              console.log('No member projects found or error fetching:', err)
              // Keep just company projects if member fetch fails
            }
          }

          // Find selected project based on URL param
          if (projectId && projects.length > 0) {
            selectedProject = projects.find(p => p.id === projectId) || projects[0]
          } else if (projects.length > 0) {
            selectedProject = projects[0]
          }
        } catch (error: any) {
          console.error('Failed to fetch projects:', error)
          console.error('Error details:', {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status,
            companyId: selectedCompany.id,
            userRole: user?.role
          })
        }
      }

      setMenuData({
        companies: userCompanies,
        selectedCompany,
        projects,
        selectedProject
      })
    } catch (error) {
      console.error('Failed to fetch menu data:', error)
    }
  }, [currentCompany, setCurrentCompany, projectId, user])

  // Sync with Zustand store on mount
  useEffect(() => {
    if (currentCompany && menuData.selectedCompany?.id !== currentCompany.id) {
      setMenuData(prev => ({
        ...prev,
        selectedCompany: currentCompany
      }))
    }
  }, [currentCompany, menuData.selectedCompany?.id])

  // Fetch menu data when user logs in or URL changes
  useEffect(() => {
    if (user) {
      fetchMenuData()
    }
  }, [user, companyId, projectId, fetchMenuData])

  // Handle selections
  const handleCompanySelect = (company: Company) => {
    // Don't do anything if selecting the same company
    if (currentCompany?.id === company.id) {
      setShowCompanyDropdown(false)
      return
    }

    // Update Zustand store - this is the source of truth
    setCurrentCompany(company)

    // Also store in localStorage for persistence (backwards compatibility)
    localStorage.setItem('selectedCompanyId', company.id)

    // Update local menu state
    setMenuData(prev => ({
      ...prev,
      selectedCompany: company
    }))

    // Close dropdown
    setShowCompanyDropdown(false)

    // Navigate to role-based dashboard for the new company
    const section = user?.role === 'seller' ? 'seller' : 'client'
    navigate(`/company/${company.id}/${section}/dashboard`)
  }

  const handleProjectSelect = (project: any) => {
    if (menuData.selectedCompany) {
      navigate(`/company/${menuData.selectedCompany.id}/project/${project.id}/dashboard`)
      setShowProjectDropdown(false)
    }
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false)
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const userInitials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="relative z-50">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 mr-8 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              // Always navigate to landing page when clicking logo
              navigate('/');
            }}
          >
            <img
              src="/assets/logo.png"
              alt="Team@Once Logo"
              className="h-12 w-auto"
            />
            <div className="flex items-center space-x-3">
              <div>
                <div className="text-2xl font-black bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent">
                  Team@Once
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">AI-Powered Marketplace</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-sky-600 text-white px-2.5 py-0.5 rounded flex items-center space-x-1.5">
                  <div className="text-[11px] font-bold uppercase">Beta</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Dropdowns */}
          <div className="flex items-center space-x-1">
            {/* Company Dropdown */}
            <div className="relative" ref={companyDropdownRef}>
              <button
                onClick={() => {
                  const isOpening = !showCompanyDropdown
                  setShowCompanyDropdown(isOpening)
                  setShowProjectDropdown(false)

                  // Refetch companies when opening dropdown
                  if (isOpening) {
                    fetchMenuData()
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700"
              >
                <Building className="w-4 h-4 text-sky-600" />
                <span className="text-sm font-medium">
                  {menuData.selectedCompany?.display_name || 'Select Company'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showCompanyDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showCompanyDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-[600px] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl"
                  >
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Left Column - Companies List */}
                        <div>
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Companies ({menuData.companies.length})
                          </div>
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {menuData.companies.map((company) => (
                              <button
                                key={company.id}
                                onClick={() => handleCompanySelect(company)}
                                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${
                                  menuData.selectedCompany?.id === company.id ? 'bg-sky-50 dark:bg-sky-900/20 ring-1 ring-sky-500/50' : ''
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 flex items-center justify-center text-white font-bold text-sm">
                                    {company.display_name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{company.display_name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{company.subscription_tier || 'Free'} Plan</div>
                                  </div>
                                </div>
                                {menuData.selectedCompany?.id === company.id && (
                                  <Check className="w-4 h-4 text-sky-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Right Column - Company Management (like Organization in database) */}
                        {menuData.selectedCompany && (
                          <div>
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Company Management</div>
                            <div className="space-y-1">
                              <button
                                onClick={() => {
                                  navigate(`/company/${menuData.selectedCompany?.id}/overview`)
                                  setShowCompanyDropdown(false)
                                }}
                                className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                              >
                                <BarChart3 className="w-4 h-4 text-sky-600" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">Overview</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Company overview</div>
                                </div>
                                <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                              </button>
                              <button
                                onClick={() => {
                                  navigate(`/company/${menuData.selectedCompany?.id}/settings/team`)
                                  setShowCompanyDropdown(false)
                                }}
                                className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                              >
                                <Users className="w-4 h-4 text-sky-600" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">Team</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Manage team members</div>
                                </div>
                                <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                              </button>
                              <button
                                onClick={() => {
                                  navigate(`/company/${menuData.selectedCompany?.id}/billing`)
                                  setShowCompanyDropdown(false)
                                }}
                                className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                              >
                                <CreditCard className="w-4 h-4 text-sky-600" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">Billing</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Payments & subscription</div>
                                </div>
                                <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                              </button>
                              <button
                                onClick={() => {
                                  navigate(`/company/${menuData.selectedCompany?.id}/settings/company`)
                                  setShowCompanyDropdown(false)
                                }}
                                className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                              >
                                <Settings className="w-4 h-4 text-sky-600" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">Settings</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Company settings</div>
                                </div>
                                <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                              </button>
                              {/* Only show Create Project for clients, not sellers */}
                              {user?.role === 'client' && (
                                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                                  <button
                                    onClick={() => {
                                      navigate(`/company/${menuData.selectedCompany?.id}/client/post-project`)
                                      setShowCompanyDropdown(false)
                                    }}
                                    className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                  >
                                    <Plus className="w-4 h-4 text-sky-600" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">Create Project</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">Start a new project</div>
                                    </div>
                                    <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                        <button
                          onClick={() => {
                            navigate('/onboarding/company')
                            setShowCompanyDropdown(false)
                          }}
                          className="inline-flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Create Company</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Project Dropdown - Show when company is selected */}
            {menuData.selectedCompany && (
              <>
                <div className="text-gray-400 dark:text-gray-600">/</div>
                <div className="relative" ref={projectDropdownRef}>
                  <button
                    onClick={() => {
                      setShowProjectDropdown(!showProjectDropdown)
                      setShowCompanyDropdown(false)
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                  >
                    <FolderOpen className="w-4 h-4 text-sky-600" />
                    <span className="text-sm font-medium">
                      {menuData.selectedProject?.name ||
                       (menuData.projects.length > 0 ? `Projects (${menuData.projects.length})` : 'No Projects')}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showProjectDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showProjectDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-[700px] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl"
                      >
                        <div className="p-4">
                          {menuData.projects.length > 0 ? (
                            <>
                            <div className="grid grid-cols-3 gap-4">
                              {/* Left Column - Projects List */}
                              <div>
                                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                                  Projects ({menuData.projects.length})
                                </div>
                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                  {menuData.projects.map((project) => (
                                    <button
                                      key={project.id}
                                      onClick={() => handleProjectSelect(project)}
                                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${
                                        menuData.selectedProject?.id === project.id ? 'bg-sky-50 dark:bg-sky-900/20 ring-1 ring-sky-500/50' : ''
                                      }`}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 flex items-center justify-center text-white font-bold text-sm">
                                          {project.name.charAt(0)}
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">{project.status || 'active'}</div>
                                        </div>
                                      </div>
                                      {menuData.selectedProject?.id === project.id && (
                                        <Check className="w-4 h-4 text-sky-600" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Middle & Right Columns - Project Management */}
                              {menuData.selectedProject && (
                                <>
                                {/* Middle Column */}
                                <div>
                                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Project Management</div>
                                  <div className="space-y-1">
                                    <button
                                      onClick={() => {
                                        navigate(`/company/${menuData.selectedCompany?.id}/project/${menuData.selectedProject.id}/dashboard`)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                    >
                                      <LayoutDashboard className="w-4 h-4 text-sky-600" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Dashboard</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Project overview</div>
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigate(`/company/${menuData.selectedCompany?.id}/project/${menuData.selectedProject.id}/team`)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                    >
                                      <Users className="w-4 h-4 text-sky-600" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Team</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Manage team</div>
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigate(`/company/${menuData.selectedCompany?.id}/project/${menuData.selectedProject.id}/milestone-approval`)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                    >
                                      <Target className="w-4 h-4 text-sky-600" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Milestones</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Track progress</div>
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigate(`/company/${menuData.selectedCompany?.id}/project/${menuData.selectedProject.id}/messages`)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                    >
                                      <MessageSquare className="w-4 h-4 text-sky-600" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Messages</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Team communication</div>
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigate(`/company/${menuData.selectedCompany?.id}/project/${menuData.selectedProject.id}/calendar`)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                    >
                                      <Calendar className="w-4 h-4 text-sky-600" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Calendar</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Schedule & deadlines</div>
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigate(`/company/${menuData.selectedCompany?.id}/project/${menuData.selectedProject.id}/contract-payment`)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                    >
                                      <DollarSign className="w-4 h-4 text-sky-600" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Payment</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Contract & payments</div>
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                    </button>
                                  </div>
                                </div>

                                {/* Right Column */}
                                <div>
                                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Project Details</div>
                                  <div className="space-y-1">
                                    <button
                                      onClick={() => {
                                        navigate(`/company/${menuData.selectedCompany?.id}/project/${menuData.selectedProject.id}/communication-hub`)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                    >
                                      <MessageSquare className="w-4 h-4 text-sky-600" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Communication Hub</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Messages & meetings</div>
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigate(`/company/${menuData.selectedCompany?.id}/project/${menuData.selectedProject.id}/files`)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                    >
                                      <FileText className="w-4 h-4 text-sky-600" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Files</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Documents</div>
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigate(`/company/${menuData.selectedCompany?.id}/project/${menuData.selectedProject.id}/project-definition`)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                    >
                                      <Briefcase className="w-4 h-4 text-sky-600" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Project Definition</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Requirements & specs</div>
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                    </button>
                                    {user?.role === 'client' && (
                                      <button
                                        onClick={() => {
                                          navigate(`/company/${menuData.selectedCompany?.id}/client/projects/${menuData.selectedProject.id}`)
                                          setShowProjectDropdown(false)
                                        }}
                                        className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                      >
                                        <FolderOpen className="w-4 h-4 text-sky-600" />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-gray-900 dark:text-white">Project Details</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">View proposals & details</div>
                                        </div>
                                        <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        navigate(`/company/${menuData.selectedCompany?.id}/project/${menuData.selectedProject.id}/report-issue`)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
                                    >
                                      <AlertCircle className="w-4 h-4 text-orange-600" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Report an Issue</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Report bugs & issues</div>
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                    </button>
                                    {user?.role === 'seller' && (
                                      <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                                        <button
                                          onClick={() => {
                                            navigate(`/company/${menuData.selectedCompany?.id}/seller/browse-projects`)
                                            setShowProjectDropdown(false)
                                          }}
                                          className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                        >
                                          <Briefcase className="w-4 h-4 text-sky-600" />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">Browse Projects</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Find new projects</div>
                                          </div>
                                          <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                </>
                              )}
                            </div>

                            {/* Footer Button */}
                            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                              {user?.role === 'client' ? (
                                <button
                                  onClick={() => {
                                    navigate(`/company/${menuData.selectedCompany?.id}/client/post-project`)
                                    setShowProjectDropdown(false)
                                  }}
                                  className="inline-flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
                                >
                                  <Plus className="w-5 h-5" />
                                  <span>Create Project</span>
                                </button>
                              ) : user?.role === 'seller' && (
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      navigate(`/company/${menuData.selectedCompany?.id}/seller/browse-projects`)
                                      setShowProjectDropdown(false)
                                    }}
                                    className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
                                  >
                                    <Briefcase className="w-4 h-4" />
                                    <span>Browse Projects</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigate(`/company/${menuData.selectedCompany?.id}/seller/hire-requests`)
                                      setShowProjectDropdown(false)
                                    }}
                                    className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3 border-2 border-sky-700 text-sky-700 dark:text-sky-400 dark:border-sky-600 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all font-semibold text-sm"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    <span>Hire Requests</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            </>
                          ) : (
                            // Empty State - No Projects
                            <div className="text-center py-16 px-8">
                              <div className="mx-auto w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center mb-6">
                                <FolderOpen className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No Projects Yet</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                Get started by creating your first project
                              </p>

                              {user?.role === 'client' ? (
                                <button
                                  onClick={() => {
                                    navigate(`/company/${menuData.selectedCompany?.id}/client/post-project`)
                                    setShowProjectDropdown(false)
                                  }}
                                  className="inline-flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
                                >
                                  <Plus className="w-5 h-5" />
                                  <span>Create Project</span>
                                </button>
                              ) : (
                                <div className="flex items-center justify-center gap-3">
                                  <button
                                    onClick={() => {
                                      navigate(`/company/${menuData.selectedCompany?.id}/seller/browse-projects`)
                                      setShowProjectDropdown(false)
                                    }}
                                    className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
                                  >
                                    <Briefcase className="w-4 h-4" />
                                    <span>Browse Projects</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigate(`/company/${menuData.selectedCompany?.id}/seller/hire-requests`)
                                      setShowProjectDropdown(false)
                                    }}
                                    className="inline-flex items-center justify-center space-x-2 px-6 py-3 border-2 border-sky-700 text-sky-700 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all font-semibold text-sm"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    <span>Hire Requests</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell with Dropdown */}
            <NotificationBell />

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 flex items-center justify-center text-white font-semibold text-sm">
                  {userInitials}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 flex items-center justify-center text-white font-semibold">
                          {userInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{displayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                          {menuData.selectedCompany && (
                            <div className="flex items-center gap-1 mt-1">
                              <Building className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                                {menuData.selectedCompany.display_name || menuData.selectedCompany.company_name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          const section = user?.role === 'seller' ? 'seller' : 'client'
                          if (companyId || menuData.selectedCompany) {
                            const activeCompanyId = companyId || menuData.selectedCompany?.id
                            navigate(`/company/${activeCompanyId}/${section}/dashboard`)
                          } else {
                            navigate('/select-company')
                          }
                          setShowUserMenu(false)
                        }}
                        className="flex items-center space-x-3 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">Dashboard</span>
                      </button>
                      <button
                        onClick={() => {
                          const section = user?.role === 'seller' ? 'seller' : 'client'
                          navigate(companyId ? `/company/${companyId}/${section}/profile` : `/${section}/profile`)
                          setShowUserMenu(false)
                        }}
                        className="flex items-center space-x-3 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                      >
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">My Profile</span>
                      </button>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                      <button
                        onClick={() => {
                          navigate('/browse-talent')
                          setShowUserMenu(false)
                        }}
                        className="flex items-center space-x-3 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                      >
                        <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">Find Talent</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/browse-jobs')
                          setShowUserMenu(false)
                        }}
                        className="flex items-center space-x-3 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                      >
                        <Briefcase className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">Find Jobs</span>
                      </button>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                      <button
                        onClick={() => {
                          const section = user?.role === 'seller' ? 'seller' : 'client'
                          navigate(companyId ? `/company/${companyId}/${section}/settings` : `/${section}/settings`)
                          setShowUserMenu(false)
                        }}
                        className="flex items-center space-x-3 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                      >
                        <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">Settings</span>
                      </button>

                      <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
