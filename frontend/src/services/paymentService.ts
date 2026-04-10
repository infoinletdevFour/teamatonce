/**
 * Payment Service
 * Handles all payment-related API calls for Team@Once platform
 */

import { apiClient } from '@/lib/api-client';
import { Payment, PaymentStatus } from '@/types/payment';

/**
 * DTOs matching backend payment DTOs
 */
export interface CreatePaymentDto {
  contractId?: string;
  milestoneId?: string;
  paymentType: 'milestone' | 'invoice' | 'refund' | 'partial';
  amount: number;
  currency?: string;
  paymentMethod?: 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe';
  description?: string;
  invoiceNumber?: string;
  platformFee?: number;
}

export interface UpdatePaymentDto {
  status?: PaymentStatus;
  amount?: number;
  paymentMethod?: 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe';
  description?: string;
  transactionId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  platformFee?: number;
}

export interface ProcessPaymentDto {
  paymentMethod: 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe';
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
}

export interface CreateMilestonePaymentDto {
  amount: number;
  currency?: string;
  description?: string;
}

export interface PaymentResponseDto {
  id: string;
  project_id: string;
  contract_id?: string;
  milestone_id?: string;
  client_id: string;
  payment_type: 'milestone' | 'invoice' | 'refund' | 'partial';
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe';
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  transaction_id?: string;
  transaction_date?: string;
  description?: string;
  invoice_number?: string;
  invoice_url?: string;
  platform_fee: number;
  net_amount?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentStatsDto {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
}

export interface StripeCheckoutSessionDto {
  sessionId: string;
  url: string;
  paymentId: string;
}

/**
 * Payment Service Class
 */
class PaymentService {
  /**
   * Get all payments for a project
   */
  async getProjectPayments(_companyId: string, projectId: string): Promise<PaymentResponseDto[]> {
    // Use teamatonce contract endpoint instead of company-specific
    const response = await apiClient.get(`/teamatonce/contract/payment/project/${projectId}`);
    return response.data;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(companyId: string, paymentId: string): Promise<PaymentResponseDto> {
    const response = await apiClient.get(`/company/${companyId}/contract/payment/${paymentId}`);
    return response.data;
  }

  /**
   * Create a new payment
   */
  async createPayment(
    companyId: string,
    projectId: string,
    paymentData: CreatePaymentDto
  ): Promise<PaymentResponseDto> {
    const response = await apiClient.post(
      `/company/${companyId}/contract/payment/project/${projectId}`,
      paymentData
    );
    return response.data;
  }

  /**
   * Update payment details
   */
  async updatePayment(
    companyId: string,
    paymentId: string,
    updates: UpdatePaymentDto
  ): Promise<PaymentResponseDto> {
    const response = await apiClient.put(`/company/${companyId}/contract/payment/${paymentId}`, updates);
    return response.data;
  }

  /**
   * Process a payment (mark as completed)
   */
  async processPayment(
    companyId: string,
    paymentId: string,
    paymentData: ProcessPaymentDto
  ): Promise<PaymentResponseDto> {
    const response = await apiClient.post(
      `/company/${companyId}/contract/payment/${paymentId}/process`,
      paymentData
    );
    return response.data;
  }

  /**
   * Mark payment as failed
   */
  async markPaymentFailed(companyId: string, paymentId: string, reason?: string): Promise<PaymentResponseDto> {
    const response = await apiClient.put(`/company/${companyId}/contract/payment/${paymentId}/fail`, {
      reason,
    });
    return response.data;
  }

  /**
   * Get payment for a specific milestone
   */
  async getMilestonePayment(companyId: string, milestoneId: string): Promise<PaymentResponseDto> {
    const response = await apiClient.get(`/company/${companyId}/contract/payment/milestone/${milestoneId}`);
    return response.data;
  }

  /**
   * Create payment for a milestone
   */
  async createMilestonePayment(
    companyId: string,
    projectId: string,
    milestoneId: string,
    paymentData: CreateMilestonePaymentDto
  ): Promise<PaymentResponseDto> {
    const response = await apiClient.post(
      `/company/${companyId}/contract/payment/milestone/${milestoneId}/project/${projectId}`,
      paymentData
    );
    return response.data;
  }

  /**
   * Release milestone payment after approval
   */
  async releaseMilestonePayment(companyId: string, milestoneId: string): Promise<PaymentResponseDto> {
    const response = await apiClient.post(
      `/company/${companyId}/contract/payment/milestone/${milestoneId}/release`
    );
    return response.data;
  }

  /**
   * Get payment statistics for a project
   */
  async getProjectPaymentStats(companyId: string, projectId: string): Promise<PaymentStatsDto> {
    const response = await apiClient.get(`/company/${companyId}/contract/payment/project/${projectId}/stats`);
    return response.data;
  }

  /**
   * Create Stripe checkout session for payment
   * Note: This would need to be implemented on the backend
   */
  async createStripeCheckoutSession(
    companyId: string,
    paymentId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<StripeCheckoutSessionDto> {
    const response = await apiClient.post(`/company/${companyId}/contract/payment/${paymentId}/stripe/checkout`, {
      successUrl,
      cancelUrl,
    });
    return response.data;
  }

  /**
   * Verify Stripe payment status
   * Note: This would need to be implemented on the backend
   */
  async verifyStripePayment(companyId: string, paymentId: string): Promise<PaymentResponseDto> {
    const response = await apiClient.get(`/company/${companyId}/contract/payment/${paymentId}/stripe/verify`);
    return response.data;
  }

  /**
   * Helper method to convert backend response to frontend Payment type
   * Note: Backend stores amounts in cents (Stripe format) as strings, parse and convert to dollars
   */
  convertToPayment(dto: PaymentResponseDto): Payment {
    const amountInDollars = (Number(dto.amount) || 0) / 100; // Parse string to number and convert cents to dollars
    return {
      id: dto.id,
      projectId: dto.project_id,
      milestoneId: dto.milestone_id,
      amount: amountInDollars,
      currency: dto.currency as any,
      status: dto.status,
      method: this.convertPaymentMethod(dto.payment_method),
      transactionId: dto.transaction_id,
      paidBy: dto.client_id,
      paidTo: '', // This might need to be fetched separately
      paidAt: dto.transaction_date ? new Date(dto.transaction_date) : undefined,
      invoice: dto.invoice_number
        ? {
            id: dto.id,
            invoiceNumber: dto.invoice_number,
            projectId: dto.project_id,
            paymentId: dto.id,
            issueDate: new Date(dto.created_at),
            dueDate: new Date(), // This should come from backend
            from: {} as any, // This should come from backend
            to: {} as any, // This should come from backend
            items: [],
            subtotal: amountInDollars,
            tax: 0,
            taxRate: 0,
            total: amountInDollars,
            currency: dto.currency as any,
            status: dto.status === 'completed' ? 'paid' : 'sent',
            createdAt: new Date(dto.created_at),
          }
        : undefined,
      metadata: dto.metadata,
      createdAt: new Date(dto.created_at),
    };
  }

  /**
   * Convert payment method from backend to frontend type
   */
  private convertPaymentMethod(
    method?: string
  ): 'card' | 'bank_transfer' | 'escrow' | 'paypal' {
    switch (method) {
      case 'credit_card':
      case 'stripe':
        return 'card';
      case 'bank_transfer':
        return 'bank_transfer';
      case 'paypal':
        return 'paypal';
      default:
        return 'escrow';
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT METHODS
  // ============================================

  /**
   * Create a new subscription
   */
  async createSubscription(priceId: string, paymentMethodId: string): Promise<any> {
    const response = await apiClient.post('/teamatonce/subscription/create', {
      priceId,
      paymentMethodId,
    });
    return response.data;
  }

  /**
   * Get current user's subscription
   */
  async getSubscription(): Promise<any> {
    const response = await apiClient.get('/teamatonce/subscription');
    return response.data;
  }

  /**
   * Upgrade/downgrade subscription to a new plan
   */
  async upgradeSubscription(newPriceId: string): Promise<any> {
    const response = await apiClient.put('/teamatonce/subscription/upgrade', {
      newPriceId,
    });
    return response.data;
  }

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(): Promise<any> {
    const response = await apiClient.delete('/teamatonce/subscription/cancel');
    return response.data;
  }

  /**
   * Resume a cancelled subscription
   */
  async resumeSubscription(): Promise<any> {
    const response = await apiClient.post('/teamatonce/subscription/resume');
    return response.data;
  }

  // ============================================
  // PAYMENT METHOD MANAGEMENT
  // ============================================

  /**
   * Add a new payment method
   */
  async addPaymentMethod(paymentMethodId: string): Promise<any> {
    const response = await apiClient.post('/teamatonce/payment-method/add', {
      paymentMethodId,
    });
    return response.data;
  }

  /**
   * Get all payment methods
   */
  async getPaymentMethods(): Promise<any[]> {
    const response = await apiClient.get('/teamatonce/payment-method/list');
    return response.data;
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<any> {
    const response = await apiClient.delete(`/teamatonce/payment-method/${paymentMethodId}`);
    return response.data;
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<any> {
    const response = await apiClient.put('/teamatonce/payment-method/default', {
      paymentMethodId,
    });
    return response.data;
  }

  // ============================================
  // BILLING & INVOICES
  // ============================================

  /**
   * Get all invoices for current user
   */
  async getInvoices(): Promise<any[]> {
    const response = await apiClient.get('/teamatonce/billing/invoices');
    return response.data;
  }

  /**
   * Get a specific invoice
   */
  async getInvoice(invoiceId: string): Promise<any> {
    const response = await apiClient.get(`/teamatonce/billing/invoice/${invoiceId}`);
    return response.data;
  }

  /**
   * Create Stripe checkout session for subscription
   */
  async createCheckoutSession(
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    const response = await apiClient.post('/teamatonce/subscription/checkout', {
      priceId,
      successUrl,
      cancelUrl,
    });
    return response.data;
  }

  // ============================================
  // SUBSCRIPTION PLANS
  // ============================================

  /**
   * Get available subscription plans
   */
  async getPlans(): Promise<any[]> {
    const response = await apiClient.get('/teamatonce/subscription/plans');
    return response.data;
  }

  // ============================================
  // STRIPE CONNECT (SELLER PAYOUTS)
  // ============================================

  /**
   * Create a Stripe Connect account for the current user (seller/developer)
   * This allows the user to receive payments through the platform
   */
  async createConnectAccount(data: {
    email: string;
    country?: string;
    businessType?: 'individual' | 'company';
  }): Promise<StripeConnectAccountResponse> {
    const response = await apiClient.post('/escrow/connect/create-account', data);
    return response.data.data;
  }

  /**
   * Get the Stripe Connect account status for the current user
   * Returns onboarding status, requirements, and verification state
   */
  async getConnectAccountStatus(): Promise<StripeConnectStatus> {
    const response = await apiClient.get('/escrow/connect/status');
    return response.data.data;
  }

  /**
   * Get an onboarding link for Stripe Connect
   * User must complete onboarding on Stripe's hosted page
   */
  async getConnectOnboardingLink(): Promise<{ url: string; accountId: string }> {
    const response = await apiClient.get('/escrow/connect/account-link');
    return response.data.data;
  }

  /**
   * Get a link to the Stripe Express dashboard
   * Only works for fully onboarded accounts
   */
  async getConnectDashboardLink(): Promise<{ url: string; created: number }> {
    const response = await apiClient.get('/escrow/connect/dashboard-link');
    return response.data.data;
  }

  /**
   * Get the current balance for the seller's Stripe Connect account
   */
  async getConnectBalance(): Promise<StripeConnectBalance> {
    const response = await apiClient.get('/escrow/connect/balance');
    return response.data.data;
  }
}

// ============================================
// STRIPE CONNECT TYPES
// ============================================

export interface StripeConnectAccountResponse {
  accountId: string;
  email: string;
  country: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  isOnboarded: boolean;
}

export interface StripeConnectStatus {
  accountId: string;
  isOnboarded: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  pendingVerification: string[];
  disabledReason: string | null;
  email: string;
  country: string;
  defaultCurrency: string;
  created: number;
}

export interface StripeConnectBalance {
  accountId: string;
  available: Array<{ amount: number; currency: string }>;
  pending: Array<{ amount: number; currency: string }>;
  currency: string;
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
