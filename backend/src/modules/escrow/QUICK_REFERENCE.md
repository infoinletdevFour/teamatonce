# Escrow API Quick Reference

## DTOs Summary

### Escrow DTOs (escrow.dto.ts)

| DTO Name | Purpose | Required Fields | Optional Fields |
|----------|---------|----------------|-----------------|
| `FundMilestoneEscrowDto` | Fund milestone | milestoneId, amount, paymentMethodId | currency |
| `SubmitDeliverablesDto` | Submit work | milestoneId, files[], description | deliverableType |
| `ApproveDeliverableDto` | Approve work | milestoneId | reviewNotes |
| `RequestChangesDto` | Request revisions | milestoneId, changeNotes | extendDays |
| `CreateConnectAccountDto` | Setup payout | country | email, businessType |
| `RefundEscrowDto` | Process refund | milestoneId, reason | fullRefund, amount |
| `AutoReleaseConfigDto` | Auto-release settings | milestoneId, enabled | daysAfterSubmission |

### Dispute DTOs (dispute.dto.ts)

| DTO Name | Purpose | Required Fields | Optional Fields |
|----------|---------|----------------|-----------------|
| `OpenDisputeDto` | Start dispute | milestoneId, reason, description | evidence[], requestedResolution |
| `RespondToDisputeDto` | Reply to dispute | response | evidence[], counterProposal, agreeToResolution |
| `MediateDisputeDto` | Admin decision | resolution, clientPercentage, developerPercentage, mediationNotes | additionalActions, extendDays |
| `AcceptMediationDto` | Accept/reject | accepted | comments |
| `EscalateDisputeDto` | Escalate issue | disputeId, escalationReason | additionalEvidence[] |
| `WithdrawDisputeDto` | Cancel dispute | - | withdrawalReason |

### Enums

**DisputeReason:**
- `NOT_DELIVERED` - Work not delivered
- `QUALITY_ISSUES` - Quality problems
- `INCOMPLETE` - Incomplete delivery
- `NOT_AS_SPECIFIED` - Not per requirements
- `TECHNICAL_ISSUES` - Technical problems
- `DEADLINE_MISSED` - Late delivery
- `OTHER` - Other reasons

**DisputeResolution:**
- `FULL_REFUND` - 100% refund to client
- `PARTIAL_REFUND` - Partial refund
- `FULL_PAYMENT` - 100% payment to developer
- `PARTIAL_PAYMENT` - Partial payment
- `REWORK_REQUIRED` - Needs rework
- `EXTEND_DEADLINE` - Extend deadline

## API Endpoints Reference

### Escrow Operations

| Method | Endpoint | DTO | Description | Auth |
|--------|----------|-----|-------------|------|
| POST | `/escrow/fund-milestone` | FundMilestoneEscrowDto | Fund milestone in escrow | Required |
| POST | `/escrow/submit-deliverables` | SubmitDeliverablesDto | Submit work for review | Required |
| POST | `/escrow/approve` | ApproveDeliverableDto | Approve & release payment | Required |
| POST | `/escrow/request-changes` | RequestChangesDto | Request revisions | Required |
| POST | `/escrow/refund` | RefundEscrowDto | Process refund | Required |

### Status & Information

| Method | Endpoint | Response | Description | Auth |
|--------|----------|----------|-------------|------|
| GET | `/escrow/milestone/:milestoneId/status` | Escrow status | Get escrow status | Required |
| GET | `/escrow/timeline/:paymentId` | Timeline events | Get payment timeline | Required |
| GET | `/escrow/project/:projectId/escrows` | Escrow list | Get all project escrows | Required |
| PUT | `/escrow/auto-release/config` | Config result | Configure auto-release | Required |

### Dispute Management

| Method | Endpoint | DTO | Description | Auth |
|--------|----------|-----|-------------|------|
| POST | `/escrow/dispute` | OpenDisputeDto | Open new dispute | Required |
| POST | `/escrow/dispute/:id/respond` | RespondToDisputeDto | Respond to dispute | Required |
| POST | `/escrow/dispute/:id/mediate` | MediateDisputeDto | Mediate (admin only) | Admin |
| POST | `/escrow/dispute/:id/accept-mediation` | AcceptMediationDto | Accept mediation | Required |
| GET | `/escrow/dispute/:id` | Dispute details | Get dispute info | Required |
| GET | `/escrow/milestone/:id/disputes` | Dispute list | Get milestone disputes | Required |
| POST | `/escrow/dispute/:id/escalate` | EscalateDisputeDto | Escalate dispute | Required |
| POST | `/escrow/dispute/:id/withdraw` | WithdrawDisputeDto | Withdraw dispute | Required |

### Stripe Connect

| Method | Endpoint | DTO/Response | Description | Auth |
|--------|----------|--------------|-------------|------|
| POST | `/escrow/connect/create-account` | CreateConnectAccountDto | Create Connect account | Required |
| GET | `/escrow/connect/account-link` | Onboarding URL | Get onboarding link | Required |
| GET | `/escrow/connect/status` | Account status | Get account status | Required |
| GET | `/escrow/connect/dashboard-link` | Dashboard URL | Get dashboard link | Required |
| GET | `/escrow/connect/balance` | Balance info | Get account balance | Required |

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

## Request Examples

### Fund Milestone
```bash
curl -X POST http://localhost:3001/escrow/fund-milestone \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "milestoneId": "ms_123",
    "amount": 50000,
    "paymentMethodId": "pm_123",
    "currency": "USD"
  }'
```

### Submit Deliverables
```bash
curl -X POST http://localhost:3001/escrow/submit-deliverables \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "milestoneId": "ms_123",
    "files": ["https://s3.../code.zip"],
    "description": "Feature complete",
    "deliverableType": "source_code"
  }'
```

### Open Dispute
```bash
curl -X POST http://localhost:3001/escrow/dispute \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "milestoneId": "ms_123",
    "reason": "quality_issues",
    "description": "Code has bugs",
    "evidence": ["https://s3.../screenshot.png"]
  }'
```

### Get Escrow Status
```bash
curl -X GET http://localhost:3001/escrow/milestone/ms_123/status \
  -H "Authorization: Bearer <token>"
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | No permission (admin only) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal error |

## Security Notes

- All endpoints require JWT Bearer token
- User ID extracted from `req.user.sub || req.user.userId`
- Admin-only endpoints check user role
- All DTOs validated with class-validator
- Swagger documentation at `/api` endpoint
