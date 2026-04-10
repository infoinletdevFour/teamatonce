/**
 * Contract Sign Page for Team@Once
 *
 * Page for reviewing and signing a contract
 */

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  Loader2,
  Pen,
  AlertTriangle,
  Download,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { contractService } from '@/services/contractService'
import { milestoneService } from '@/services/milestoneService'
import { getProject, getProjectMembers } from '@/services/projectService'
import { useAuth } from '@/contexts/AuthContext'
import type { Milestone } from '@/types/milestone'

interface ContractData {
  id: string
  projectName: string
  projectDescription: string
  clientName: string
  developerName: string
  totalAmount: number
  currency: string
  startDate: string
  endDate: string
  milestones: Array<{
    name: string
    amount: number
    deadline: string
    description: string
  }>
  terms: string[]
  // Additional fields for signing
  userRole?: 'client' | 'developer'
  isAlreadySigned?: boolean
}

export default function ContractSign() {
  const navigate = useNavigate()
  const { companyId, projectId, contractId } = useParams()
  const { user } = useAuth()
  const [contract, setContract] = useState<ContractData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Canvas for signature
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

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

        // Determine user's role
        let userRole: 'client' | 'developer' = 'client'
        let isAlreadySigned = false

        // Check if user is a client or developer
        if (contractData.client_id === user?.id) {
          userRole = 'client'
          isAlreadySigned = !!contractData.client_signature
        } else {
          // User is likely a company team member (developer)
          userRole = 'developer'
          isAlreadySigned = !!contractData.provider_signature
        }

        // Fetch project details
        let projectName = 'Project'
        let projectDescription = ''
        let clientName = 'Client'
        let developerName = 'Developer'

        if (contractData.project_id) {
          try {
            const project = await getProject(contractData.project_id)
            projectName = project.name || 'Project'
            projectDescription = project.description || ''
          } catch (err) {
            console.warn('Could not fetch project details:', err)
          }

          // Fetch project members
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

        // Fetch milestones
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

        // Parse terms
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

        // Add standard signing terms if not present
        if (terms.length === 0) {
          terms = [
            'I agree to the project scope and deliverables as outlined in this contract.',
            'I understand that payment will be made according to the milestone schedule.',
            'I agree to the terms of service and privacy policy of Team@Once.',
            'I understand that this is a legally binding agreement.',
            'I confirm that all information provided is accurate and complete.',
          ]
        }

        setContract({
          id: contractData.id,
          projectName,
          projectDescription,
          clientName,
          developerName,
          totalAmount: contractData.total_amount,
          currency: contractData.currency || 'USD',
          startDate: contractData.start_date,
          endDate: contractData.end_date,
          milestones,
          terms,
          userRole,
          isAlreadySigned,
        })

        // Pre-fill signature name from user profile
        if (user?.name) {
          setSignatureName(user.name)
        }
      } catch (err: any) {
        console.error('Error fetching contract:', err)
        setError(err.response?.data?.message || 'Failed to load contract')
        toast.error('Failed to load contract details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContractData()
  }, [companyId, contractId, projectId, user?.id, user?.name])

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    setHasSignature(true)

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleSign = async () => {
    if (!agreedToTerms) {
      toast.error('Please agree to all terms before signing')
      return
    }

    if (!signatureName.trim()) {
      toast.error('Please enter your full legal name')
      return
    }

    if (!hasSignature) {
      toast.error('Please provide your signature')
      return
    }

    setShowConfirmDialog(true)
  }

  const confirmSign = async () => {
    if (!companyId || !contractId || !contract) return

    setIsSigning(true)
    setShowConfirmDialog(false)

    try {
      // Get signature data from canvas
      const canvas = canvasRef.current
      const signatureData = canvas ? canvas.toDataURL('image/png') : ''

      const signatureDto = {
        signatureData,
        signerName: signatureName,
        signerEmail: user?.email,
        metadata: {
          signedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
      }

      // Call appropriate signing endpoint based on user role
      if (contract.userRole === 'client') {
        await contractService.signContractByClient(companyId, contractId, signatureDto)
      } else {
        await contractService.signContractByCompany(companyId, contractId, signatureDto)
      }

      toast.success('Contract signed successfully!')
      navigate(`/company/${companyId}/project/${projectId}/contract/${contractId}/view`)
    } catch (err: any) {
      console.error('Error signing contract:', err)
      toast.error(err.response?.data?.message || 'Failed to sign contract')
    } finally {
      setIsSigning(false)
    }
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
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    )
  }

  // Check if user has already signed
  if (contract.isAlreadySigned) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Already Signed</h2>
          <p className="text-muted-foreground mb-4">
            You have already signed this contract as the {contract.userRole}.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button onClick={() => navigate(`/company/${companyId}/project/${projectId}/contract/${contractId}/view`)}>
              View Contract
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isFormValid = agreedToTerms && signatureName.trim() && hasSignature

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Pen className="w-6 h-6" />
                  Sign Contract
                </h1>
                <p className="text-muted-foreground text-sm">Review and sign the contract</p>
              </div>
            </div>
            <Badge variant="outline">Awaiting Signature</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900">Please review carefully</h3>
            <p className="text-sm text-amber-700">
              This is a legally binding agreement. Make sure you understand all terms before signing.
            </p>
          </div>
        </div>

        {/* Contract Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{contract.projectName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{contract.projectDescription}</p>

            <Separator />

            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="font-semibold">${contract.totalAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">
                    {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Milestones</p>
                  <p className="font-semibold">{contract.milestones.length} milestones</p>
                </div>
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
            <div className="space-y-3">
              {contract.milestones.map((milestone, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{milestone.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due: {new Date(milestone.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600">
                    ${milestone.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Terms Agreement */}
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contract.terms.map((term, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{term}</span>
              </div>
            ))}

            <Separator />

            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <Label htmlFor="agree-terms" className="text-sm cursor-pointer">
                I have read and agree to all the terms and conditions outlined in this contract.
                I understand that this is a legally binding agreement.
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card>
          <CardHeader>
            <CardTitle>Your Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="signature-name">Full Legal Name</Label>
              <Input
                id="signature-name"
                placeholder="Enter your full legal name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Draw Your Signature</Label>
              <div className="mt-1.5 border-2 border-dashed rounded-lg p-2 bg-white">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSignature}
                className="mt-2"
              >
                Clear Signature
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={handleSign}
              disabled={!isFormValid || isSigning}
              size="lg"
            >
              {isSigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <Pen className="w-4 h-4 mr-2" />
                  Sign Contract
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Signature</DialogTitle>
            <DialogDescription>
              You are about to sign a legally binding contract. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">Signing as:</p>
            <p className="font-semibold text-lg">{signatureName}</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Review Again
            </Button>
            <Button onClick={confirmSign}>
              Confirm & Sign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
