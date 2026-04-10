import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, Zap, TrendingUp, Building2, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import Footer from '../../components/layout/Footer';
import { SEO } from '@/components/SEO';

const PricingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for trying out the platform',
      icon: Zap,
      color: 'from-gray-600 to-gray-500',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        { name: '1 Active Project', included: true },
        { name: 'Basic AI Matching', included: true },
        { name: 'Community Support', included: true },
        { name: 'Basic Project Management', included: true },
        { name: '5GB Storage', included: true },
        { name: 'Priority Support', included: false },
        { name: 'Advanced Analytics', included: false },
        { name: 'Custom Integrations', included: false }
      ],
      cta: 'Get Started Free',
      popular: false
    },
    {
      name: 'Starter',
      description: 'For freelancers and small teams',
      icon: TrendingUp,
      color: 'from-sky-800 via-sky-700 to-sky-600',
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      features: [
        { name: '5 Active Projects', included: true },
        { name: 'Advanced AI Matching', included: true },
        { name: 'Priority Email Support', included: true },
        { name: 'Full Project Management Suite', included: true },
        { name: '50GB Storage', included: true },
        { name: 'Basic Analytics', included: true },
        { name: 'Video Collaboration', included: true },
        { name: 'Custom Integrations', included: false }
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Professional',
      description: 'For growing businesses',
      icon: Building2,
      color: 'from-purple-600 to-pink-600',
      monthlyPrice: 19.99,
      annualPrice: 199.99,
      features: [
        { name: 'Unlimited Projects', included: true },
        { name: 'Premium AI Matching', included: true },
        { name: '24/7 Priority Support', included: true },
        { name: 'Advanced Project Management', included: true },
        { name: '500GB Storage', included: true },
        { name: 'Advanced Analytics & Reporting', included: true },
        { name: 'Video Collaboration', included: true },
        { name: 'Custom Integrations', included: true },
        { name: 'Dedicated Account Manager', included: true },
        { name: 'White Label Options', included: false }
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      icon: Rocket,
      color: 'from-emerald-600 to-teal-600',
      monthlyPrice: 49.99,
      annualPrice: 499.99,
      features: [
        { name: 'Unlimited Everything', included: true },
        { name: 'Custom AI Training', included: true },
        { name: 'Dedicated Support Team', included: true },
        { name: 'Enterprise Project Management', included: true },
        { name: 'Unlimited Storage', included: true },
        { name: 'Custom Analytics Dashboard', included: true },
        { name: 'Video Collaboration', included: true },
        { name: 'Custom Integrations & API', included: true },
        { name: 'Dedicated Account Manager', included: true },
        { name: 'White Label Options', included: true },
        { name: 'SLA Guarantee', included: true },
        { name: 'On-premise Deployment', included: true }
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const handleGetStarted = (plan: typeof plans[0]) => {
    if (plan.name === 'Enterprise') {
      // Redirect to contact page
      window.location.href = 'mailto:sales@teamatonce.com';
    } else {
      navigate('/auth/signup');
    }
  };

  return (
    <>
      <SEO
        title="Pricing Plans - Team@Once"
        description="Choose the perfect plan for your team. Flexible pricing for freelancers and companies. Start free, upgrade anytime."
        canonical="https://teamatonce.com/pricing"
      />
      <UnifiedHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center space-x-3 bg-blue-100 rounded-full px-6 py-3 mb-6">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">Simple, Transparent Pricing</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-6 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent">
              Choose Your Perfect Plan
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto mb-8">
              Start free, upgrade when you need more. All plans include a 14-day trial with full access.
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <span className={`text-sm font-semibold ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-semibold ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                Annual
              </span>
              {isAnnual && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-2 inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full"
                >
                  2 months free
                </motion.span>
              )}
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-3xl shadow-xl p-8 ${
                  plan.popular ? 'ring-4 ring-blue-600 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className="text-xl font-black text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-xs text-gray-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  {isAnnual && plan.annualPrice > 0 ? (
                    <>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-black text-gray-900">
                          ${(plan.annualPrice / 12).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">/mo</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        <span className="line-through">${(plan.monthlyPrice * 12).toFixed(2)}</span>
                        <span className="text-green-600 font-semibold ml-2">${plan.annualPrice.toFixed(2)}/year</span>
                      </p>
                    </>
                  ) : (
                    <div className="flex items-baseline">
                      <span className="text-3xl font-black text-gray-900">
                        ${plan.monthlyPrice > 0 ? plan.monthlyPrice.toFixed(2) : '0'}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">/mo</span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGetStarted(plan)}
                  className={`w-full py-3 rounded-xl font-bold text-sm mb-8 shadow-lg ${
                    plan.popular
                      ? 'bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </motion.button>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start space-x-2">
                      {feature.included ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-20 text-center"
          >
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              Have questions? We've got answers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
              {[
                {
                  q: 'Can I switch plans anytime?',
                  a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.'
                },
                {
                  q: 'Is there a free trial?',
                  a: 'Yes! All paid plans include a 14-day free trial with full access to all features.'
                },
                {
                  q: 'What happens when I cancel?',
                  a: "You'll have access until the end of your billing period. Your data is retained for 30 days."
                }
              ].map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg"
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-xs text-gray-600">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-20 text-center bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 rounded-3xl p-12 text-white"
          >
            <h2 className="text-2xl font-black mb-4">
              Still have questions?
            </h2>
            <p className="text-base mb-8 text-white/90">
              Our team is here to help you find the perfect plan for your needs.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = 'mailto:sales@teamatonce.com'}
              className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold shadow-xl hover:shadow-2xl"
            >
              Contact Sales
            </motion.button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PricingPage;
