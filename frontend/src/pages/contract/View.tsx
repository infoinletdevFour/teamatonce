/**
 * Contract View Page for Team@Once
 *
 * Read-only view of a signed contract
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Share2,
  FileText,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  Loader2,
  Building,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { contractService } from '@/services/contractService'
import { milestoneService } from '@/services/milestoneService'
import { getProject, getProjectMembers } from '@/services/projectService'
import type { Milestone } from '@/types/milestone'

interface ContractData {
  id: string
  projectName: string
  projectDescription: string
  clientName: string
  developerName: string
  companyName: string
  totalAmount: number
  currency: string
  startDate: string
  endDate: string
  status: 'draft' | 'pending' | 'signed' | 'completed' | 'cancelled'
  signedAt?: string
  signedBy?: {
    client?: { name: string; signedAt: string }
    developer?: { name: string; signedAt: string }
  }
  milestones: Array<{
    name: string
    amount: number
    deadline: string
    description: string
  }>
  terms: string[]
}

export default function ContractView() {
  const navigate = useNavigate()
  const { companyId, contractId } = useParams()
  const [contract, setContract] = useState<ContractData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContractData = async () => {
      if (!companyId || !contractId) {
        setError('Missing required parameters')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch contract data
        const contractData = await contractService.getContractById(companyId, contractId)

        // Fetch project details for project name and description
        let projectName = 'Project'
        let projectDescription = ''
        let companyName = 'Company'
        let clientName = 'Client'
        let developerName = 'Developer'

        if (contractData.project_id) {
          try {
            const project = await getProject(contractData.project_id)
            projectName = project.name || 'Project'
            projectDescription = project.description || ''
            // Company name would need to be fetched separately via company_id if needed
            // For now, using a default value
            companyName = 'Company'
          } catch (err) {
            console.warn('Could not fetch project details:', err)
          }

          // Fetch project members for client and developer names
          try {
            const membersResponse = await getProjectMembers(contractData.project_id)
            const clientMember = membersResponse.members.find(m => m.memberType === 'client')
            const developerMember = membersResponse.members.find(m => m.memberType === 'developer')

            if (clientMember?.user) {
              clientName = clientMember.user.name || 'Client'
            }
            if (developerMember?.user) {
              developerName = developerMember.user.name || 'Developer'
            }
          } catch (err) {
            console.warn('Could not fetch project members:', err)
          }
        }

        // Fetch milestones for the project
        let milestones: Array<{ name: string; amount: number; deadline: string; description: string }> = []
        if (contractData.project_id && companyId) {
          try {
            const milestonesResponse = await milestoneService.getProjectMilestones(companyId, contractData.project_id)
            milestones = (milestonesResponse.milestones || []).map((m: Milestone) => ({
              name: m.title,
              amount: m.amount || 0,
              deadline: m.dueDate || '',
              description: m.description || '',
            }))
          } catch (err) {
            console.warn('Could not fetch milestones:', err)
          }
        }

        // Parse terms from contract
        let terms: string[] = []
        if (contractData.terms) {
          try {
            const parsedTerms = JSON.parse(contractData.terms)
            if (Array.isArray(parsedTerms)) {
              terms = parsedTerms.map((t: any) => typeof t === 'string' ? t : t.description || t.title || '')
            } else {
              terms = [contractData.terms]
            }
          } catch {
            terms = [contractData.terms]
          }
        }

        // Build signature info
        const signedBy: ContractData['signedBy'] = {}
        if (contractData.client_signature) {
          signedBy.client = {
            name: contractData.client_signature.signerName || clientName,
            signedAt: contractData.client_signature.signedAt || contractData.signed_at || '',
          }
        }
        if (contractData.provider_signature) {
          signedBy.developer = {
            name: contractData.provider_signature.signerName || developerName,
            signedAt: contractData.provider_signature.signedAt || contractData.signed_at || '',
          }
        }

        // Map status from backend to frontend format
        const statusMap: Record<string, ContractData['status']> = {
          draft: 'draft',
          pending_signature: 'pending',
          pending: 'pending',
          active: 'signed',
          signed: 'signed',
          completed: 'completed',
          terminated: 'cancelled',
          cancelled: 'cancelled',
        }

        setContract({
          id: contractData.id,
          projectName,
          projectDescription,
          clientName,
          developerName,
          companyName,
          totalAmount: contractData.total_amount,
          currency: contractData.currency || 'USD',
          startDate: contractData.start_date,
          endDate: contractData.end_date,
          status: statusMap[contractData.status] || 'draft',
          signedAt: contractData.signed_at,
          signedBy: Object.keys(signedBy).length > 0 ? signedBy : undefined,
          milestones,
          terms,
        })
      } catch (err: any) {
        console.error('Error fetching contract:', err)
        setError(err.response?.data?.message || 'Failed to load contract')
        toast.error('Failed to load contract details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContractData()
  }, [companyId, contractId])

  const handleDownload = () => {
    toast.success('Contract PDF downloaded')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Contract link copied to clipboard')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      pending: { variant: 'outline', label: 'Pending Signature' },
      signed: { variant: 'default', label: 'Signed' },
      completed: { variant: 'default', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    }
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading contract...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Contract</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Contract Not Found</h2>
          <p className="text-muted-foreground mb-4">The contract you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">Contract</h1>
                  {getStatusBadge(contract.status)}
                </div>
                <p className="text-muted-foreground text-sm">{contract.projectName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Contract Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">{contract.projectName}</h3>
              <p className="text-muted-foreground">{contract.projectDescription}</p>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{contract.clientName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Developer</p>
                    <p className="font-medium">{contract.developerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Building className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{contract.companyName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="font-medium text-lg">
                      ${contract.totalAmount.toLocaleString()} {contract.currency}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {contract.signedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Signed On</p>
                      <p className="font-medium">
                        {new Date(contract.signedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contract.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{milestone.name}</h4>
                      <span className="font-semibold text-green-600">
                        ${milestone.amount.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {milestone.description}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      Due: {new Date(milestone.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {contract.terms.map((term, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{term}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Signatures */}
        {contract.signedBy && (
          <Card>
            <CardHeader>
              <CardTitle>Signatures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {contract.signedBy.client && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Client Signature</span>
                    </div>
                    <p className="text-lg font-script italic text-gray-700 mb-2">
                      {contract.signedBy.client.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Signed on {new Date(contract.signedBy.client.signedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {contract.signedBy.developer && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Developer Signature</span>
                    </div>
                    <p className="text-lg font-script italic text-gray-700 mb-2">
                      {contract.signedBy.developer.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Signed on {new Date(contract.signedBy.developer.signedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
