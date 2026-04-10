# Payment API Quick Reference

## Base URL
```
http://localhost:3001/payment  (Development)
https://api.teamatonce.com/payment  (Production)
```

## Authentication
All endpoints require JWT Bearer token (except webhook):
```
Authorization: Bearer {your_jwt_token}
```

---

## 🧑‍💼 Customer Endpoints

### Create/Get Customer
```http
POST /payment/customer
{
  "email": "user@example.com",
  "metadata": { "companyId": "uuid" }
}
```

### Get Customer
```http
GET /payment/customer/:customerId
```

### Update Customer
```http
PUT /payment/customer/:customerId
{
  "email": "newemail@example.com",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

---

## 💳 Subscription Endpoints

### Create Subscription
```http
POST /payment/subscription
{
  "priceId": "price_1234567890",
  "paymentMethodId": "pm_1234567890",  // optional
  "email": "customer@example.com",
  "companyId": "uuid",  // optional
  "metadata": {}  // optional
}
```

### Get Subscription
```http
GET /payment/subscription/:subscriptionId
```

### Update Subscription (Upgrade/Downgrade)
```http
PUT /payment/subscription/:subscriptionId
{
  "newPriceId": "price_0987654321",
  "prorate": true  // optional, default: true
}
```

### Cancel Subscription
```http
POST /payment/subscription/:subscriptionId/cancel
{
  "immediate": false,  // optional, default: false (cancel at period end)
  "reason": "Too expensive",  // optional
  "feedback": "Great service but..."  // optional
}
```

### Resume Subscription
```http
POST /payment/subscription/:subscriptionId/resume
```

### List Customer Subscriptions
```http
GET /payment/customer/:customerId/subscriptions
```

---

## 💰 Payment Method Endpoints

### Add Payment Method
```http
POST /payment/payment-method
{
  "paymentMethodId": "pm_1234567890",
  "setAsDefault": true,  // optional, default: false
  "companyId": "uuid"  // optional
}
```

### List Payment Methods
```http
GET /payment/customer/:customerId/payment-methods?type=card
```

### Remove Payment Method
```http
DELETE /payment/payment-method/:paymentMethodId
```

### Set Default Payment Method
```http
PUT /payment/customer/:customerId/default-payment-method
{
  "paymentMethodId": "pm_1234567890"
}
```

---

## 📄 Invoice Endpoints

### List Invoices
```http
GET /payment/customer/:customerId/invoices?limit=10
```

### Get Invoice
```http
GET /payment/invoice/:invoiceId
```

### Get Upcoming Invoice
```http
GET /payment/customer/:customerId/upcoming-invoice
```

---

## 🛒 Checkout Endpoints

### Create Checkout Session
```http
POST /payment/checkout/session
{
  "priceId": "price_1234567890",
  "successUrl": "https://teamatonce.com/dashboard/success",  // optional
  "cancelUrl": "https://teamatonce.com/pricing",  // optional
  "companyId": "uuid",  // optional
  "customerEmail": "customer@example.com",  // optional
  "metadata": {}  // optional
}
```

### Get Checkout Session
```http
GET /payment/checkout/session/:sessionId
```

---

## 💵 Price Endpoints

### Get Price
```http
GET /payment/price/:priceId
```

### List Prices
```http
GET /payment/prices?productId=prod_1234567890
```

---

## 🔔 Webhook Endpoint

### Handle Stripe Webhook
```http
POST /payment/webhook
Stripe-Signature: t=1234567890,v1=signature_here
Content-Type: application/json

{
  "type": "customer.subscription.created",
  "data": { "object": {...} }
}
```

**Supported Events**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `payment_method.attached`
- `payment_method.detached`

---

## 🔧 Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173  # or https://teamatonce.com
```

---

## 📊 Response Examples

### Subscription Response
```json
{
  "id": "sub_1234567890",
  "customer": "cus_1234567890",
  "status": "active",
  "items": {
    "data": [{
      "price": {
        "id": "price_1234567890",
        "unit_amount": 1999
      }
    }]
  },
  "current_period_end": 1234567890,
  "cancel_at_period_end": false
}
```

### Checkout Session Response
```json
{
  "id": "cs_1234567890",
  "url": "https://checkout.stripe.com/c/pay/cs_1234567890",
  "customer": "cus_1234567890",
  "payment_status": "unpaid",
  "status": "open"
}
```

---

## 🧪 Testing with cURL

### Create Customer
```bash
curl -X POST http://localhost:3001/payment/customer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Create Subscription
```bash
curl -X POST http://localhost:3001/payment/subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId":"price_1234567890",
    "email":"test@example.com"
  }'
```

### Test Webhook Locally (Stripe CLI)
```bash
# Forward webhooks to local endpoint
stripe listen --forward-to localhost:3001/payment/webhook

# Trigger test event
stripe trigger customer.subscription.created
```

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Failed to create subscription",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Customer not found",
  "error": "Not Found"
}
```

---

## 📚 Swagger Documentation

Access full API documentation at:
```
http://localhost:3001/api  (Development)
https://api.teamatonce.com/api  (Production)
```

Look for the **"Payment & Subscription Management"** tag.

---

## 🔐 Security Notes

1. **Never expose Stripe secret keys** in client-side code
2. **Always verify webhook signatures** using `stripe-signature` header
3. **Use HTTPS in production** for all payment endpoints
4. **Rotate webhook secrets** regularly
5. **Monitor failed payment attempts** for security issues

---

## 💡 Common Use Cases

### Use Case 1: User Subscribes to Pro Plan
1. Create customer: `POST /payment/customer`
2. Create checkout session: `POST /payment/checkout/session`
3. Redirect user to `session.url`
4. Handle webhook event: `customer.subscription.created`

### Use Case 2: User Updates Subscription
1. Get current subscription: `GET /payment/subscription/:id`
2. Update subscription: `PUT /payment/subscription/:id`
3. Handle webhook event: `customer.subscription.updated`

### Use Case 3: User Cancels Subscription
1. Cancel subscription: `POST /payment/subscription/:id/cancel`
2. Handle webhook event: `customer.subscription.deleted`

---

## 🔗 Useful Links

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
