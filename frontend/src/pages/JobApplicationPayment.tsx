import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Shield,
  CheckCircle2,
  Lock,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Loader2,
} from 'lucide-react';
import UnifiedHeader from '../components/layout/UnifiedHeader';
import Footer from '../components/layout/Footer';
import { publicService, PublicJobDetail } from '../services/publicService';
import { toast } from 'sonner';

// Helper function to format salary
const formatSalary = (salary?: { min: number; max: number; currency: string; period: string }) => {
  if (!salary) return 'Competitive';
  const { min, max, currency, period } = salary;
  const currencySymbol = currency === 'USD' ? '$' : currency;
  return `${currencySymbol}${min.toLocaleString()} - ${currencySymbol}${max.toLocaleString()}/${period}`;
};

// Helper function to format date
const formatPostedDate = (dateString?: string) => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

const JobApplicationPayment: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<PublicJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await publicService.getJobById(jobId);
        setJob(data);
      } catch (error) {
        console.error('Failed to fetch job:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // Application fee (can be dynamic based on job)
  const applicationFee = 49.99;
  const processingFee = 2.50;
  const total = applicationFee + processingFee;

  const handleStripeCheckout = async () => {
    setIsProcessing(true);

    try {
      // In production, this would call your backend to create a Stripe checkout session
      // For now, simulating the redirect
      toast.success('Redirecting to Stripe checkout...');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In production:
      // const response = await fetch('/api/create-checkout-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ jobId, amount: total })
      // });
      // const { sessionId } = await response.json();
      // const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);
      // stripe.redirectToCheckout({ sessionId });

      // For demo purposes, show success message
      toast.success('Payment processing initialized!');

    } catch (error) {
      toast.error('Failed to process payment. Please try again.');
      setIsProcessing(false);
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

  if (!job) {
    return (
      <>
        <UnifiedHeader />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center pt-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Job Not Found</h1>
            <p className="text-gray-600 mb-8">The job you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/browse-jobs')}
              className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
            >
              Browse All Jobs
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
            to={`/job/${jobId}`}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Job Details</span>
          </Link>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-700 to-sky-600 flex items-center justify-center shadow-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">Application Payment</h1>
                <p className="text-sm text-gray-600 mt-0.5">Secure your application with Stripe</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Job Summary */}
            <div className="lg:col-span-2 space-y-4">
              {/* Job Details Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md p-5 border border-gray-200"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">Job Summary</h2>

                <div className="flex items-start gap-3 mb-4">
                  <img
                    src={job.companyLogo}
                    alt={job.company}
                    className="w-12 h-12 rounded-lg object-cover ring-2 ring-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=0c4a6e&color=fff&size=128&bold=true`;
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1">{job.title}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Building2 className="w-3.5 h-3.5 mr-1.5" />
                      <span className="font-medium">{job.company}</span>
                    </div>
                    {(job as any).featured && (
                      <span className="inline-block px-2.5 py-0.5 bg-gradient-to-r from-sky-700 to-sky-600 text-white rounded-full text-xs font-semibold">
                        Featured Position
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{job.type}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-semibold">{formatSalary(job.salary)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Posted {formatPostedDate(job.postedAt)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="bg-sky-50 text-sky-700 px-3 py-1 rounded-md text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 5 && (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-semibold">
                        +{job.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Security Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-4 border border-green-200"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h3 className="text-base font-bold text-gray-900">Secure Payment</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Stripe Secure Checkout</p>
                      <p className="text-xs text-gray-600">Industry-leading payment security</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">SSL Encrypted</p>
                      <p className="text-xs text-gray-600">Your data is protected end-to-end</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">PCI Compliant</p>
                      <p className="text-xs text-gray-600">Meets highest security standards</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Payment Summary */}
            <div className="space-y-4">
              {/* Payment Summary Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-md p-5 border border-gray-200 sticky top-24"
              >
                <h3 className="text-base font-bold text-gray-900 mb-4">Payment Summary</h3>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span>Application Fee</span>
                    <span className="font-semibold">${applicationFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span>Processing Fee</span>
                    <span className="font-semibold">${processingFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-xl font-black text-sky-700">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stripe Checkout Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStripeCheckout}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-sky-700 to-sky-600 text-white py-3 rounded-lg font-semibold shadow-md hover:from-sky-800 hover:to-sky-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay with Stripe</span>
                    </>
                  )}
                </motion.button>

                {/* Payment Methods */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center mb-2">Secure payment powered by</p>
                  <div className="flex items-center justify-center">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                      alt="Stripe"
                      className="h-5 opacity-60"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    We accept all major credit and debit cards
                  </p>
                </div>

                {/* Money Back Guarantee */}
                <div className="mt-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Money-Back Guarantee</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Full refund if your application is not processed within 48 hours
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default JobApplicationPayment;
