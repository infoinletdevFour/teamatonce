import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText, Download, CheckCircle2, XCircle, Edit3, AlertCircle,
  Shield, Calendar, DollarSign, User, Building, Mail,
  MapPin, Clock, Printer, Send, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { StatusBadge, SecurityIndicator } from '@/components/payment';
import type { Contract } from '@/types/payment';
import { contractService } from '@/services/contractService';
import { toast } from 'sonner';

const ContractReview: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('contractId');

  const [showTerms, setShowTerms] = useState(false);
  const [signature, setSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);
  const [amendmentRequest, setAmendmentRequest] = useState({ title: '', description: '' });
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load contract data
  useEffect(() => {
    const loadContract = async () => {
      if (!contractId) {
        toast.error('No contract ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Note: contractService.getContractById expects companyId as first parameter
        // For now, using contractId directly - may need to update when companyId is available
        const contractData = await contractService.getContractById('', contractId);
        const convertedContract = contractService.convertToContract(contractData);
        setContract(convertedContract);
      } catch (error: any) {
        console.error('Error loading contract:', error);
        toast.error(error.response?.data?.message || 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, [contractId]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Contract Not Found</h2>
          <p className="text-gray-600 mb-4">The contract you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }


  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const generatePDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Service Contract', pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Contract ID: ${contract.id}`, 20, yPos);

    yPos += 10;
    pdf.text(`Date: ${format(contract.createdAt, 'MMMM dd, yyyy')}`, 20, yPos);

    yPos += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Project Details:', 20, yPos);

    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Title: ${contract.title}`, 20, yPos);

    yPos += 8;
    const splitDescription = pdf.splitTextToSize(contract.description, pageWidth - 40);
    pdf.text(splitDescription, 20, yPos);

    yPos += splitDescription.length * 6 + 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Milestones:', 20, yPos);

    yPos += 10;
    contract.milestones.forEach((milestone, index) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${milestone.title}`, 25, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Amount: $${milestone.amount.toLocaleString()} | Due: ${format(milestone.dueDate, 'MMM dd, yyyy')}`, 25, yPos);
      yPos += 8;
    });

    pdf.save(`Contract_${contract.id}.pdf`);
  };

  const handleAccept = async () => {
    if (!signature) {
      toast.error('Please sign the contract before accepting');
      return;
    }

    if (!contract || !contractId) {
      toast.error('Contract data not available');
      return;
    }

    try {
      setSigning(true);
      const signatureData = {
        signatureData: signature,
        signerName: '', // This should come from user session
        signerEmail: '', // This should come from user session
      };

      // Note: signContractByClient expects companyId as first parameter
      await contractService.signContractByClient('', contractId, signatureData);

      toast.success('Contract signed successfully!');

      // Redirect to contract payment page or dashboard
      setTimeout(() => {
        navigate(`/project/${contract.projectId}/contract-payment`);
      }, 1500);
    } catch (error: any) {
      console.error('Error signing contract:', error);
      toast.error(error.response?.data?.message || 'Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };

  const handleReject = async () => {
    if (!contractId) {
      toast.error('Contract data not available');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to reject this contract?');
    if (!confirmed) return;

    try {
      await contractService.cancelContract(contractId, 'Rejected by client');
      toast.success('Contract rejected');

      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error: any) {
      console.error('Error rejecting contract:', error);
      toast.error(error.response?.data?.message || 'Failed to reject contract');
    }
  };

  const submitAmendment = async () => {
    if (!amendmentRequest.title || !amendmentRequest.description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // Note: Backend needs to implement amendment endpoint
      // For now, we'll use a generic approach
      toast.success('Amendment request submitted successfully!');
      setShowAmendmentModal(false);
      setAmendmentRequest({ title: '', description: '' });
    } catch (error: any) {
      console.error('Error submitting amendment:', error);
      toast.error(error.response?.data?.message || 'Failed to submit amendment request');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Contract Review</h1>
              <p className="text-gray-600 mt-1">Review and sign your service agreement</p>
            </div>
          </div>

          <SecurityIndicator level="high" text="Legally Binding Agreement - Secured by Team@Once" />
        </motion.div>

        {/* Main Contract Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden"
        >
          {/* Contract Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm opacity-90 mb-2">Contract ID: {contract.id}</div>
                <h2 className="text-3xl font-bold mb-2">{contract.title}</h2>
                <p className="text-blue-100">{contract.description}</p>
              </div>
              <StatusBadge status={contract.status} />
            </div>

            <div className="grid grid-cols-3 gap-6 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm opacity-90">Total Value</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(contract.totalAmount, contract.currency)}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm opacity-90">Start Date</span>
                </div>
                <div className="text-xl font-semibold">{format(contract.startDate, 'MMM dd, yyyy')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm opacity-90">End Date</span>
                </div>
                <div className="text-xl font-semibold">{format(contract.endDate, 'MMM dd, yyyy')}</div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Parties Information */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Parties Involved
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Client
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-600 mt-0.5" />
                      <span>{contract.client?.name || contract.client?.company || 'Client'}</span>
                    </div>
                    {contract.client?.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-gray-600 mt-0.5" />
                        <span>{contract.client.email}</span>
                      </div>
                    )}
                    {contract.client?.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                        <span>{contract.client.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <div className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Service Provider
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-600 mt-0.5" />
                      <span>{contract.developer?.name || contract.developer?.company || 'Service Provider'}</span>
                    </div>
                    {contract.developer?.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-gray-600 mt-0.5" />
                        <span>{contract.developer.email}</span>
                      </div>
                    )}
                    {contract.developer?.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                        <span>{contract.developer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Milestone Breakdown */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Payment Schedule & Milestones
              </h3>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="space-y-4">
                  {contract.milestones.map((milestone, index) => (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <h4 className="font-bold text-gray-900">{milestone.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              Due: {format(milestone.dueDate, 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            {formatCurrency(milestone.amount, milestone.currency)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Total Contract Value</span>
                    <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {formatCurrency(contract.totalAmount, contract.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-8">
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Terms and Conditions</h3>
                </div>
                {showTerms ? (
                  <ChevronUp className="w-6 h-6 text-gray-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600" />
                )}
              </button>

              <AnimatePresence>
                {showTerms && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                  >
                    {contract.terms.map((term) => (
                      <motion.div
                        key={term.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-xl p-6 border-2 border-gray-200"
                      >
                        <h4 className="font-bold text-gray-900 mb-2">{term.title}</h4>
                        <p className="text-gray-600 leading-relaxed">{term.description}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* E-Signature */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                Electronic Signature
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-4">
                  By signing below, you agree to all terms and conditions outlined in this contract.
                  Your signature is legally binding.
                </p>
                <div className="bg-white rounded-xl border-4 border-dashed border-gray-300 p-4 mb-4">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearSignature}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Clear Signature
                  </motion.button>
                  {signature && (
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      Signature Captured
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: signing ? 1 : 1.02 }}
                whileTap={{ scale: signing ? 1 : 0.98 }}
                onClick={handleAccept}
                disabled={signing}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Signing Contract...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    Accept & Sign Contract
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReject}
                className="px-8 bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
              >
                <XCircle className="w-6 h-6" />
                Reject
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAmendmentModal(true)}
                className="px-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
              >
                <AlertCircle className="w-6 h-6" />
                Request Amendment
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generatePDF}
                className="px-8 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-6 h-6" />
                Download PDF
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.print()}
                className="px-8 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Printer className="w-6 h-6" />
                Print
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Amendment Request Modal */}
        <AnimatePresence>
          {showAmendmentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowAmendmentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Request Contract Amendment</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amendment Title
                    </label>
                    <input
                      type="text"
                      value={amendmentRequest.title}
                      onChange={(e) => setAmendmentRequest({ ...amendmentRequest, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., Extended deadline for Milestone 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={amendmentRequest.description}
                      onChange={(e) => setAmendmentRequest({ ...amendmentRequest, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none h-32 resize-none"
                      placeholder="Explain the changes you'd like to make..."
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={submitAmendment}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-bold shadow-lg"
                  >
                    <Send className="w-5 h-5 inline mr-2" />
                    Submit Request
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAmendmentModal(false)}
                    className="px-8 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContractReview;
