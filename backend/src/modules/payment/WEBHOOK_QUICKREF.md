# Stripe Webhook Database Persistence - Quick Reference

## Overview
All Stripe webhook events now automatically persist to the database. No manual database operations needed.

## How It Works

### 1. Webhook Receives Event
```typescript
POST /payment/webhook
Headers: stripe-signature
Body: Raw Stripe event payload
```

### 2. Immediate Response
```typescript
// Returns 200 OK immediately to prevent timeout
return { received: true, eventType: event.type };
```

### 3. Async Database Processing
```typescript
// Processes in background after response sent
setImmediate(() => {
  this.processWebhookEvent(event);
});
```

## Event → Database Table Mapping

### Subscriptions → `subscriptions` table
```
customer.subscription.created    → INSERT
customer.subscription.updated    → UPDATE
customer.subscription.deleted    → UPDATE (status='canceled')
customer.subscription.trial_will_end → UPDATE
```

### Payment Intents → `payments` table
```
payment_intent.created          → INSERT
payment_intent.succeeded        → UPDATE (status='completed')
payment_intent.payment_failed   → UPDATE (status='failed')
payment_intent.processing       → UPDATE (status='processing')
payment_intent.canceled         → UPDATE (status='failed')
```

### Payment Methods → `payment_methods` table
```
payment_method.attached         → INSERT
payment_method.detached         → UPDATE (is_active=false)
payment_method.updated          → UPDATE
```

### Invoices → `payments` table
```
invoice.created                 → INSERT
invoice.paid                    → UPDATE (status='completed')
invoice.payment_succeeded       → UPDATE (status='completed')
invoice.payment_failed          → UPDATE (status='failed')
invoice.finalized              → UPDATE
invoice.voided                 → UPDATE (status='failed')
```

## Database Schema Reference

### subscriptions
```typescript
{
  id: uuid,
  company_id: uuid,
  user_id: string,
  stripe_customer_id: string,
  stripe_subscription_id: string,
  price_id: string,
  plan_name: string,
  billing_interval: 'month' | 'year',
  status: string,
  current_period_start: timestamp,
  current_period_end: timestamp,
  cancel_at_period_end: boolean,
  trial_start: timestamp,
  trial_end: timestamp,
  metadata: jsonb
}
```

### payment_methods
```typescript
{
  id: uuid,
  company_id: uuid,
  user_id: string,
  stripe_payment_method_id: string,
  stripe_customer_id: string,
  type: 'card' | 'bank_account',
  last4: string,
  brand: string,
  exp_month: integer,
  exp_year: integer,
  is_default: boolean,
  is_active: boolean
}
```

### payments
```typescript
{
  id: uuid,
  project_id: uuid,
  milestone_id: uuid,
  client_id: string,
  payment_type: string,
  amount: numeric,
  currency: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  payment_method: string,
  stripe_payment_intent_id: string,
  stripe_charge_id: string,
  invoice_number: string,
  invoice_url: string,
  transaction_date: timestamp
}
```

## Testing Webhooks

### 1. Local Testing with Stripe CLI
```bash
# Forward webhooks to local server
stripe listen --forward-to http://localhost:3001/payment/webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger payment_intent.succeeded
stripe trigger invoice.paid
```

### 2. Verify Database
```sql
-- Check recent subscriptions
SELECT * FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- Check recent payments
SELECT * FROM payments
ORDER BY created_at DESC
LIMIT 10;

-- Check payment methods
SELECT * FROM payment_methods
WHERE is_active = true
ORDER BY created_at DESC;
```

### 3. Monitor Logs
```bash
# Watch for webhook events
tail -f logs/app.log | grep -E "Webhook|PaymentService"
```

## Common Scenarios

### New Subscription Created
```
1. customer.subscription.created event received
2. Webhook handler responds immediately
3. PaymentService.upsertSubscription() called
4. Creates record in subscriptions table
5. Links to company via stripe_customer_id
```

### Payment Successful
```
1. payment_intent.succeeded event received
2. Webhook handler responds immediately
3. PaymentService.upsertPaymentFromIntent() called
4. Creates/updates record in payments table
5. Sets status='completed'
```

### Payment Method Added
```
1. payment_method.attached event received
2. Webhook handler responds immediately
3. PaymentService.upsertPaymentMethod() called
4. Creates record in payment_methods table
5. Links to company and user
```

## Error Handling

### Missing Metadata
```typescript
// If company_id or user_id not found
this.logger.warn('Cannot upsert: missing company_id');
return null; // Skip without throwing
```

### Database Errors
```typescript
// Logged but don't retry webhook
this.logger.error('Error upserting subscription:', error);
throw error; // Logged, not sent to Stripe
```

### Duplicate Events
```typescript
// Idempotent operations using upsert pattern
const existing = await this.fluxez.findOne('table', {
  stripe_id: stripeObject.id
});
if (existing) {
  // Update
} else {
  // Insert
}
```

## Metadata Requirements

### Stripe Customer Metadata
For proper database linking, Stripe customers should have:
```typescript
{
  metadata: {
    user_id: 'fluxez-user-id',
    company_id: 'uuid'
  }
}
```

This is automatically set when creating customers via:
```typescript
await stripeService.createOrGetCustomer(email, userId, metadata);
```

### Payment Intent Metadata
For project/milestone linking:
```typescript
{
  metadata: {
    project_id: 'uuid',
    milestone_id: 'uuid',
    payment_type: 'milestone' | 'invoice'
  }
}
```

## Service Methods

### PaymentService

#### Subscriptions
```typescript
await paymentService.upsertSubscription(subscription);
await paymentService.deleteSubscription(subscriptionId);
```

#### Payment Methods
```typescript
await paymentService.upsertPaymentMethod(paymentMethod);
await paymentService.removePaymentMethod(paymentMethodId);
await paymentService.setDefaultPaymentMethod(customerId, paymentMethodId);
```

#### Payments
```typescript
await paymentService.upsertPaymentFromIntent(paymentIntent);
await paymentService.updatePaymentFromInvoice(invoice);
```

#### Helpers
```typescript
await paymentService.updateCompanyStripeCustomerId(companyId, stripeCustomerId);
```

## Logging

### Event Processing
```
[PaymentController] Received Stripe event: customer.subscription.created
[Webhook] Subscription created: sub_1234567890
[PaymentService] Created subscription sub_1234567890 in database
```

### Database Operations
```
[Fluxez] Inserting into subscriptions: {...}
[PaymentService] Updated subscription sub_1234567890 in database
```

### Errors
```
[PaymentService] Error upserting subscription sub_1234567890: Error details
[Webhook] Error processing customer.subscription.created: Error stack
```

## Important Notes

1. **Response First**: Always respond to webhook before database operations
2. **Idempotent**: All operations can be safely retried
3. **Async Processing**: Database operations happen in background
4. **No Errors to Stripe**: Errors logged but not sent back to Stripe
5. **Metadata Required**: Proper metadata needed for full functionality

## Configuration

### Environment Variables Required
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FLUXEZ_API_KEY=...
FLUXEZ_ANON_KEY=...
```

### Webhook Endpoint Configuration
In Stripe Dashboard:
```
URL: https://your-domain.com/payment/webhook
Events: Select all payment events
```

## Troubleshooting

### Webhook Not Persisting
1. Check Stripe customer has metadata
2. Verify company exists in database
3. Check logs for errors
4. Ensure FluxezService is initialized

### Duplicate Records
- Shouldn't happen with upsert pattern
- Check unique constraints on stripe_*_id fields

### Missing Data
- Verify metadata in Stripe dashboard
- Check webhook event payload
- Review service logs

## Support

For issues or questions:
1. Check logs: `[PaymentService]` and `[Webhook]` tags
2. Verify database schema matches expectations
3. Test with Stripe CLI before production
4. Review webhook event payload in Stripe dashboard
