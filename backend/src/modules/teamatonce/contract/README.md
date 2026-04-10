# Contract & Payment Module

Complete implementation of the Contract & Payment Management system for Team@Once platform.

## 📁 Module Structure

```
backend/src/modules/teamatonce/contract/
├── dto/
│   ├── contract.dto.ts      # Contract DTOs with validation
│   ├── payment.dto.ts       # Payment DTOs with validation
│   ├── support.dto.ts       # Support package DTOs
│   └── index.ts             # Barrel export
├── contract.service.ts      # Contract business logic
├── payment.service.ts       # Payment processing logic
├── support.service.ts       # Support package logic
├── contract.controller.ts   # REST API endpoints
├── contract.module.ts       # NestJS module
└── README.md               # This file
```

## 🚀 Features Implemented

### 1. ContractService
- **Digital Contracts**: Create and manage project contracts
- **Dual Signatures**: Client + Company digital signature workflow
- **Contract Types**: Fixed-price, hourly, milestone-based
- **Status Lifecycle**: draft → pending_signature → active → completed/terminated
- **Version History**: Track contract changes over time
- **Security**: Prevent updates after signing

**Key Methods:**
- `getProjectContract(projectId)` - Get contract for project
- `createContract(projectId, clientId, dto)` - Create new contract
- `updateContract(contractId, dto)` - Update contract (pre-signature only)
- `signContractByClient(contractId, clientId, signature)` - Client signs
- `signContractByCompany(contractId, providerId, signature)` - Company signs
- `cancelContract(contractId, reason)` - Terminate contract
- `completeContract(contractId)` - Mark as completed
- `getContractHistory(projectId)` - Get all contracts for project

### 2. PaymentService
- **Payment Tracking**: Comprehensive payment lifecycle management
- **Multiple Types**: Milestone, invoice, refund, partial payments
- **Status Management**: pending → processing → completed/failed/refunded
- **Stripe Integration**: Ready for Stripe webhook integration
- **Milestone Payments**: Automated milestone-based payment releases
- **Platform Fees**: Built-in fee calculation (configurable 10%)
- **Analytics**: Payment statistics and reporting

**Key Methods:**
- `getProjectPayments(projectId)` - Get all payments
- `getPaymentById(paymentId)` - Get payment details
- `createPayment(projectId, clientId, dto)` - Create payment
- `updatePayment(paymentId, dto)` - Update payment
- `processPayment(paymentId, processDto)` - Process/complete payment
- `markPaymentFailed(paymentId, reason)` - Mark as failed
- `getMilestonePayment(milestoneId)` - Get milestone payment
- `createMilestonePayment(projectId, milestoneId, clientId, dto)` - Create milestone payment
- `releaseMilestonePayment(milestoneId)` - Release payment after approval
- `getProjectPaymentStats(projectId)` - Payment analytics

**Stripe Webhook Handlers (Ready for Implementation):**
- `handleStripePaymentSuccess(paymentIntentId, stripeData)` - Success webhook
- `handleStripePaymentFailure(paymentIntentId, errorData)` - Failure webhook

### 3. SupportService
- **Support Packages**: Pre-defined support tiers (Basic, Standard, Premium, Enterprise)
- **Project Subscriptions**: Subscribe projects to support packages
- **Hour Tracking**: Monitor monthly support hour usage
- **Auto-Renewal**: Automatic subscription renewal
- **Enhancement Proposals**: Post-project improvement request system
- **SLA Management**: Response time tracking

**Key Methods:**
- `getSupportPackages()` - Get available packages
- `getSupportPackageById(packageId)` - Get package details
- `createSupportPackage(projectId, clientId, dto)` - Create package (admin)
- `updateSupportPackage(packageId, dto)` - Update package
- `deleteSupportPackage(packageId)` - Delete package
- `getProjectSupport(projectId)` - Get project's support subscription
- `createProjectSupport(projectId, clientId, dto)` - Subscribe to support
- `updateProjectSupport(supportId, dto)` - Update subscription
- `cancelProjectSupport(supportId)` - Cancel subscription
- `incrementSupportHours(supportId, hours)` - Track hour usage
- `createEnhancementProposal(projectId, dto)` - Create enhancement request
- `getProjectEnhancementProposals(projectId)` - Get proposals
- `updateEnhancementProposal(proposalId, dto)` - Update proposal status

## 📡 API Endpoints

### Contract Endpoints
```
GET    /teamatonce/contract/project/:projectId              # Get project contract
POST   /teamatonce/contract/project/:projectId              # Create contract
PUT    /teamatonce/contract/:contractId                     # Update contract
POST   /teamatonce/contract/:contractId/sign/client         # Client signs
POST   /teamatonce/contract/:contractId/sign/company        # Company signs
PUT    /teamatonce/contract/:contractId/cancel              # Cancel contract
PUT    /teamatonce/contract/:contractId/complete            # Complete contract
GET    /teamatonce/contract/project/:projectId/history      # Contract history
GET    /teamatonce/contract/details/:contractId             # Contract details
```

### Payment Endpoints
```
GET    /teamatonce/contract/payment/project/:projectId                      # Get all payments
GET    /teamatonce/contract/payment/:paymentId                              # Get payment details
POST   /teamatonce/contract/payment/project/:projectId                      # Create payment
PUT    /teamatonce/contract/payment/:paymentId                              # Update payment
POST   /teamatonce/contract/payment/:paymentId/process                      # Process payment
PUT    /teamatonce/contract/payment/:paymentId/fail                         # Mark as failed
GET    /teamatonce/contract/payment/milestone/:milestoneId                  # Get milestone payment
POST   /teamatonce/contract/payment/milestone/:milestoneId/project/:projectId  # Create milestone payment
POST   /teamatonce/contract/payment/milestone/:milestoneId/release          # Release payment
GET    /teamatonce/contract/payment/project/:projectId/stats                # Payment stats
```

### Support Package Endpoints
```
GET    /teamatonce/contract/support/packages                                # Get all packages
GET    /teamatonce/contract/support/package/:packageId                      # Get package details
POST   /teamatonce/contract/support/package/project/:projectId              # Create package (admin)
PUT    /teamatonce/contract/support/package/:packageId                      # Update package
DELETE /teamatonce/contract/support/package/:packageId                      # Delete package
GET    /teamatonce/contract/support/project/:projectId                      # Get project support
POST   /teamatonce/contract/support/project/:projectId/subscribe            # Subscribe to support
PUT    /teamatonce/contract/support/:supportId                              # Update subscription
PUT    /teamatonce/contract/support/:supportId/cancel                       # Cancel subscription
POST   /teamatonce/contract/support/:supportId/hours/:hours                 # Track hours
```

### Enhancement Proposal Endpoints
```
POST   /teamatonce/contract/enhancement/project/:projectId                  # Create proposal
GET    /teamatonce/contract/enhancement/project/:projectId                  # Get all proposals
GET    /teamatonce/contract/enhancement/:proposalId                         # Get proposal details
PUT    /teamatonce/contract/enhancement/:proposalId                         # Update proposal
```

## 🔐 Authentication

All endpoints require JWT authentication via `JwtAuthGuard`.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**User ID Access:**
```typescript
const userId = req.user.sub || req.user.userId; // Compatible with both formats
```

## 💾 Database Integration

### Using FluxezService (NOT Prisma)

All services use `FluxezService` for database operations:

```typescript
constructor(private readonly fluxez: FluxezService) {}

// Create
const contract = await this.fluxez.insert('contracts', data);

// Read
const contract = await this.fluxez.findOne('contracts', { id: contractId });
const contracts = await this.fluxez.findMany('contracts', { project_id: projectId });

// Update
await this.fluxez.update('contracts', contractId, updateData);

// Delete
await this.fluxez.delete('contracts', contractId);
```

### Database Tables Used
- `contracts` - Contract records
- `payments` - Payment transactions
- `support_packages` - Support packages and subscriptions
- `support_tickets` - Enhancement proposals (workaround)
- `project_milestones` - Milestone payment integration

## 🔄 Contract Signature Workflow

### 1. Create Contract
```
Status: draft
Client Signature: null
Provider Signature: null
```

### 2. First Party Signs (Either Client or Company)
```
Status: pending_signature
One Signature: ✓
Other Signature: null
```

### 3. Both Parties Sign
```
Status: active
Client Signature: ✓
Provider Signature: ✓
Signed At: timestamp
```

### 4. Contract Completion
```
Status: completed
Project delivered and accepted
```

## 💳 Payment Flow

### Standard Payment Flow
```
1. Create Payment (status: pending)
2. Process Payment (status: processing)
3. Complete Payment (status: completed)
   - Update transaction details
   - Set transaction_date
   - Calculate net_amount after fees
```

### Milestone Payment Flow
```
1. Create Milestone Payment (status: pending, payment_status: pending)
2. Client Approves Milestone (milestone.status: approved)
3. Release Payment (status: completed, payment_status: paid)
   - Update payment status
   - Update milestone payment_status
   - Set payment_date
```

### Payment Status States
- `pending` - Created, awaiting processing
- `processing` - Being processed
- `completed` - Successfully processed
- `failed` - Payment failed
- `refunded` - Payment refunded

## 📦 Support Package Types

### Package Tiers
1. **Basic** - Entry-level support
   - Limited monthly hours
   - Standard response time
   - Email support

2. **Standard** - Professional support
   - More monthly hours
   - Faster response time
   - Email + chat support

3. **Premium** - Priority support
   - High monthly hours
   - Priority response time
   - All channels + phone

4. **Enterprise** - Custom support
   - Unlimited hours
   - Dedicated support manager
   - 24/7 availability

### Support Package Features
- Monthly hour allocation
- Response time SLA (hours)
- Auto-renewal option
- Feature inclusions (array)
- Monthly cost tracking
- Hour usage monitoring

## 🚧 Stripe Integration (TODO)

### Webhook Endpoint (Ready for Implementation)
```typescript
// Uncomment in contract.controller.ts

@Post('webhook/stripe')
@HttpCode(HttpStatus.OK)
async handleStripeWebhook(@Body() event: any) {
  // Verify Stripe signature
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  switch (event.type) {
    case 'payment_intent.succeeded':
      await this.paymentService.handleStripePaymentSuccess(
        event.data.object.id,
        event.data.object,
      );
      break;
    case 'payment_intent.payment_failed':
      await this.paymentService.handleStripePaymentFailure(
        event.data.object.id,
        event.data.object.last_payment_error,
      );
      break;
  }

  return { received: true };
}
```

### Environment Variables Needed
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Webhook Events to Handle
- `payment_intent.succeeded` - Payment successful
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Payment refunded
- `invoice.paid` - Invoice paid
- `customer.subscription.created` - Support subscription created
- `customer.subscription.updated` - Support subscription updated
- `customer.subscription.deleted` - Support subscription cancelled

## 🧪 Testing

### Manual Testing with cURL

**Create Contract:**
```bash
curl -X POST http://localhost:3001/teamatonce/contract/project/{projectId} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Development Contract",
    "contractType": "milestone_based",
    "terms": "Standard terms and conditions...",
    "scopeOfWork": "Full-stack web application development",
    "totalAmount": 50000,
    "startDate": "2024-01-01",
    "endDate": "2024-06-30"
  }'
```

**Client Signs Contract:**
```bash
curl -X POST http://localhost:3001/teamatonce/contract/{contractId}/sign/client \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "signatureData": "base64_encoded_signature_or_digital_cert",
    "signerName": "John Doe",
    "signerEmail": "john@example.com"
  }'
```

**Create Milestone Payment:**
```bash
curl -X POST http://localhost:3001/teamatonce/contract/payment/milestone/{milestoneId}/project/{projectId} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "description": "Payment for Phase 1 completion"
  }'
```

**Release Milestone Payment:**
```bash
curl -X POST http://localhost:3001/teamatonce/contract/payment/milestone/{milestoneId}/release \
  -H "Authorization: Bearer <token>"
```

## 📊 Data Models

### Contract
```typescript
{
  id: string;
  project_id: string;
  client_id: string;
  contract_type: 'fixed_price' | 'hourly' | 'milestone_based';
  status: 'draft' | 'pending_signature' | 'active' | 'completed' | 'terminated';
  title: string;
  description?: string;
  terms: string;
  scope_of_work: string;
  total_amount: number;
  currency: string;
  payment_terms?: object;
  hourly_rate?: number;
  start_date: string;
  end_date: string;
  renewal_terms?: object;
  client_signature?: object;
  provider_signature?: object;
  signed_at?: string;
  contract_document_url?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
}
```

### Payment
```typescript
{
  id: string;
  project_id: string;
  contract_id?: string;
  milestone_id?: string;
  client_id: string;
  payment_type: 'milestone' | 'invoice' | 'refund' | 'partial';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
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
  metadata?: object;
  created_at: string;
  updated_at: string;
}
```

### Support Package
```typescript
{
  id: string;
  project_id: string;
  client_id: string;
  package_name: string;
  package_type: 'basic' | 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'expired' | 'cancelled';
  monthly_hours: number;
  used_hours: number;
  response_time_sla?: number;
  includes_features?: string[];
  monthly_cost: number;
  currency: string;
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}
```

## 🔧 Configuration

### Platform Fee Configuration
Located in `payment.service.ts`:
```typescript
const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% platform fee
const platformFee = dto.amount * PLATFORM_FEE_PERCENTAGE;
const netAmount = dto.amount - platformFee;
```

### Validation Rules
- Amounts must be >= 0
- Contract cannot be updated after signing
- Milestone payment requires approved milestone
- Support hours tracked and monitored against monthly limit

## 🎯 Multi-Tenant Architecture

All services are multi-tenant aware:
- Contracts belong to specific projects and clients
- Payments are isolated by project
- Support packages are project-specific
- User authentication ensures data isolation

## 📝 Swagger Documentation

All endpoints are fully documented with Swagger:
- Request/Response DTOs
- Parameter descriptions
- Status codes
- Error responses

Access Swagger UI: `http://localhost:3001/api`

## 🚀 Future Enhancements

1. **Stripe Integration**
   - Complete webhook implementation
   - Payment intent creation
   - Subscription management
   - Refund processing

2. **Contract Versioning**
   - Track contract amendments
   - Version comparison
   - Audit trail

3. **Advanced Analytics**
   - Revenue forecasting
   - Payment trends
   - Support hour analytics
   - Client lifetime value

4. **Email Notifications**
   - Contract signature requests
   - Payment confirmations
   - Support hour alerts
   - Enhancement proposal updates

5. **PDF Generation**
   - Contract PDFs
   - Invoice generation
   - Payment receipts
   - Support reports

## 👥 Team

Implemented by: Claude (Anthropic AI Assistant)
Date: October 2024
Platform: Team@Once

## 📄 License

Proprietary - Team@Once Platform
