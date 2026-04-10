/**
 * Help & Support Page for Team@Once
 *
 * Provides help resources, FAQs, and support contact options
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  HelpCircle,
  MessageSquare,
  Mail,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  CreditCard,
  Users,
  FolderKanban,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supportService, FAQItem } from '@/services/supportService'

interface HelpCategory {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  articles: number
}

// Default FAQ data as fallback if API fails or is not available
const defaultFaqData: FAQItem[] = [
  {
    id: '1',
    question: 'How does the escrow payment system work?',
    answer: 'When a client funds a milestone, the money is held securely in escrow. Once the developer completes the work and submits deliverables, the client reviews and approves the milestone. Upon approval, funds are automatically released to the developer. This protects both parties - clients only pay for completed work, and developers are guaranteed payment for approved work.',
    category: 'payments',
  },
  {
    id: '2',
    question: 'What happens if there is a dispute?',
    answer: 'If a dispute arises, either party can open a dispute ticket. Our mediation team will review the case, including all communications and deliverables. We aim to resolve disputes fairly within 5-7 business days. Both parties can submit evidence and communicate through the platform during this process.',
    category: 'disputes',
  },
  {
    id: '3',
    question: 'How do I post a project?',
    answer: 'Go to your client dashboard and click "Post Project". Fill in the project details including title, description, required skills, budget range, and timeline. You can add milestones to break down the project into manageable phases. Once posted, developers can submit proposals for your review.',
    category: 'projects',
  },
  {
    id: '4',
    question: 'How are platform fees calculated?',
    answer: 'Team@Once charges a 5% platform fee on all transactions. This fee is added to the milestone amount when the client makes a payment. For example, if a milestone is $1,000, the client pays $1,050 total, and the developer receives $1,000 upon completion.',
    category: 'payments',
  },
  {
    id: '5',
    question: 'Can I invite team members to my company?',
    answer: 'Yes! As a company owner or admin, you can invite team members via email. Go to Company Settings > Team Management and click "Invite Member". You can assign roles (Admin, Member) and permissions. Invited users will receive an email with instructions to join your company.',
    category: 'team',
  },
  {
    id: '6',
    question: 'How do I become a verified developer?',
    answer: 'To get verified, complete your profile with accurate information, link your GitHub/portfolio, complete our skill assessments, and maintain a positive rating on the platform. Verified badges are awarded automatically once you meet all criteria.',
    category: 'account',
  },
  {
    id: '7',
    question: 'What payment methods are supported?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and bank transfers. Developers can receive payments via direct bank transfer or PayPal. All payments are processed securely through Stripe.',
    category: 'payments',
  },
  {
    id: '8',
    question: 'How do milestone approvals work?',
    answer: 'When a developer completes a milestone, they submit deliverables for review. The client has 7 days to review and either approve or request revisions. If no action is taken within 7 days, the milestone is automatically approved and funds are released.',
    category: 'projects',
  },
]

const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using Team@Once',
    icon: Zap,
    articles: 12,
  },
  {
    id: 'payments',
    title: 'Payments & Billing',
    description: 'Escrow, invoices, and payment methods',
    icon: CreditCard,
    articles: 18,
  },
  {
    id: 'projects',
    title: 'Projects & Milestones',
    description: 'Creating and managing projects',
    icon: FolderKanban,
    articles: 15,
  },
  {
    id: 'team',
    title: 'Team Management',
    description: 'Inviting members and permissions',
    icon: Users,
    articles: 8,
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    description: 'Account security and data protection',
    icon: Shield,
    articles: 10,
  },
  {
    id: 'disputes',
    title: 'Disputes & Resolution',
    description: 'Handling disputes and mediation',
    icon: AlertTriangle,
    articles: 6,
  },
]

export default function HelpSupport() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [faqData, setFaqData] = useState<FAQItem[]>(defaultFaqData)
  const [loading, setLoading] = useState(true)

  // Fetch FAQs from API on mount
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true)
        const data = await supportService.getFAQs()
        // Use API data if available, otherwise keep default
        if (data && data.length > 0) {
          setFaqData(data)
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error)
        // Keep default FAQ data on error
      } finally {
        setLoading(false)
      }
    }

    fetchFAQs()
  }, [])

  const filteredFaqs = searchQuery
    ? faqData.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqData

  const handleContactSupport = () => {
    toast.info('Opening support chat...')
    // In production, this would open a live chat widget
  }

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Badge variant="outline">Help Center</Badge>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Search our knowledge base or browse categories below
            </p>

            <div className="max-w-xl mx-auto relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for help articles..."
                className="pl-12 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleContactSupport}
          >
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Chat with support</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.open('mailto:support@teamatonce.com')}
          >
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Email Support</h3>
                <p className="text-sm text-muted-foreground">support@teamatonce.com</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Documentation</h3>
                <p className="text-sm text-muted-foreground">Browse all guides</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Categories */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {helpCategories.map((category) => {
              const Icon = category.icon
              return (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{category.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {category.articles} articles
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="p-4">
                    <button
                      className="w-full flex items-start justify-between text-left"
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <div className="flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{faq.question}</span>
                      </div>
                      {expandedFaq === faq.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="mt-3 pl-8 text-muted-foreground text-sm">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
              <Button variant="link" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            </div>
          )}
        </div>

        {/* Still Need Help */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="py-8 text-center">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is available 24/7 to assist you
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button onClick={handleContactSupport}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Live Chat
              </Button>
              <Button variant="outline" onClick={() => window.open('mailto:support@teamatonce.com')}>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>All systems operational</span>
          <span className="mx-2">-</span>
          <a href="#" className="text-primary hover:underline">
            View status page
          </a>
        </div>
      </div>
    </div>
  )
}
