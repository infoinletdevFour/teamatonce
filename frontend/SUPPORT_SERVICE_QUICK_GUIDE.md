# Support Service - Quick Reference Guide

## Import the Service

```typescript
import { supportService } from '@/services/supportService';
```

## Common Operations

### 1. Get All Support Packages

```typescript
const packages = await supportService.getSupportPackages();
// Returns: SupportPackageResponseDto[]
```

### 2. Get Project's Active Support

```typescript
const activeSupport = await supportService.getProjectSupport(projectId);
// Returns: SupportPackageResponseDto | null
```

### 3. Subscribe to Support Package

```typescript
const subscription = await supportService.subscribeToSupport(projectId, {
  packageId: 'package-uuid-here',
  startDate: '2025-10-19',
  endDate: '2026-10-19' // Optional
});
// Returns: SupportPackageResponseDto
```

### 4. Track Support Hours

```typescript
await supportService.trackSupportHours(supportId, 5); // Add 5 hours
// Returns: SupportPackageResponseDto (updated)
```

### 5. Cancel Support

```typescript
const cancelled = await supportService.cancelSupport(supportId);
// Returns: SupportPackageResponseDto (status: cancelled)
```

### 6. Create Enhancement Proposal

```typescript
const proposal = await supportService.createEnhancementProposal(projectId, {
  title: 'Add dark mode feature',
  description: 'Implement dark mode for better UX',
  estimatedEffort: 40, // hours
  estimatedCost: 5000,
  priority: 'high',
  tags: ['ui', 'enhancement']
});
// Returns: EnhancementProposalResponseDto
```

### 7. Get Enhancement Proposals

```typescript
const proposals = await supportService.getEnhancementProposals(projectId);
// Returns: EnhancementProposalResponseDto[]
```

### 8. Update Enhancement Proposal

```typescript
const updated = await supportService.updateEnhancementProposal(proposalId, {
  status: EnhancementProposalStatus.APPROVED,
  reviewNotes: 'Approved for next sprint',
  approvedBy: userId
});
// Returns: EnhancementProposalResponseDto
```

## Helper Methods

### Check if Support is Active

```typescript
const isActive = supportService.isSupportActive(supportPackage);
// Returns: boolean
```

### Get Remaining Hours

```typescript
const remaining = supportService.getRemainingHours(supportPackage);
// Returns: number
```

### Get Usage Percentage

```typescript
const percentage = supportService.getHoursUsagePercentage(supportPackage);
// Returns: number (0-100)
```

### Check if Hours Exceeded

```typescript
const exceeded = supportService.isHoursExceeded(supportPackage);
// Returns: boolean
```

### Format for Display

```typescript
const formatted = supportService.formatSupportPackageForDisplay(supportPackage);
// Returns formatted object with calculated fields:
// {
//   id, name, type, status, monthlyHours, usedHours,
//   remainingHours, usagePercentage, features, monthlyCost,
//   currency, sla, startDate, endDate, renewalDate,
//   autoRenew, isActive, isExceeded
// }
```

## Using the SupportPackageSelector Component

```typescript
import { SupportPackageSelector } from '@/components/support';

<SupportPackageSelector
  onSelect={(packageId) => {
    console.log('Selected package:', packageId);
    // Handle selection
  }}
  selectedPackageId={currentPackageId} // Optional
/>
```

## Enums

```typescript
// Support Package Types
enum SupportPackageType {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

// Support Status
enum SupportStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// Enhancement Proposal Status
enum EnhancementProposalStatus {
  PROPOSED = 'proposed',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}
```

## Error Handling

All service methods throw errors that should be caught:

```typescript
try {
  const packages = await supportService.getSupportPackages();
} catch (error: any) {
  console.error('Error:', error);
  // Handle error - show toast, alert, etc.
  alert(error.response?.data?.message || 'Failed to load packages');
}
```

## Complete Example: Support Management Flow

```typescript
import React, { useState, useEffect } from 'react';
import {
  supportService,
  SupportPackageResponseDto,
  SupportStatus
} from '@/services/supportService';
import { SupportPackageSelector } from '@/components/support';

function SupportManagement({ projectId }: { projectId: string }) {
  const [packages, setPackages] = useState<SupportPackageResponseDto[]>([]);
  const [activeSupport, setActiveSupport] = useState<SupportPackageResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pkgs, support] = await Promise.all([
        supportService.getSupportPackages(),
        supportService.getProjectSupport(projectId)
      ]);
      setPackages(pkgs);
      setActiveSupport(support);
    } catch (error) {
      console.error('Error loading support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (packageId: string) => {
    try {
      const subscription = await supportService.subscribeToSupport(projectId, {
        packageId,
        startDate: new Date().toISOString().split('T')[0]
      });
      setActiveSupport(subscription);
      alert('Successfully subscribed to support package!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Subscription failed');
    }
  };

  const handleCancel = async () => {
    if (!activeSupport) return;

    if (confirm('Are you sure you want to cancel your support package?')) {
      try {
        await supportService.cancelSupport(activeSupport.id);
        setActiveSupport(null);
        alert('Support package cancelled');
      } catch (error: any) {
        alert(error.response?.data?.message || 'Cancellation failed');
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {activeSupport && (
        <div className="active-support">
          <h3>{activeSupport.package_name}</h3>
          <p>Hours: {activeSupport.used_hours} / {activeSupport.monthly_hours}</p>
          <p>Cost: ${activeSupport.monthly_cost}/month</p>
          <button onClick={handleCancel}>Cancel Support</button>
        </div>
      )}

      <h2>Available Support Packages</h2>
      <SupportPackageSelector
        onSelect={handleSubscribe}
        selectedPackageId={activeSupport?.id}
      />
    </div>
  );
}
```

## API Endpoints Reference

All endpoints use base URL: `/teamatonce/contract`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/support/packages` | Get all packages |
| GET | `/support/package/:id` | Get package by ID |
| POST | `/support/package/project/:projectId` | Create package |
| PUT | `/support/package/:id` | Update package |
| DELETE | `/support/package/:id` | Delete package |
| GET | `/support/project/:projectId` | Get project support |
| POST | `/support/project/:projectId/subscribe` | Subscribe to support |
| PUT | `/support/:id` | Update support |
| PUT | `/support/:id/cancel` | Cancel support |
| POST | `/support/:id/hours/:hours` | Track hours |
| POST | `/enhancement/project/:projectId` | Create proposal |
| GET | `/enhancement/project/:projectId` | Get proposals |
| GET | `/enhancement/:id` | Get proposal by ID |
| PUT | `/enhancement/:id` | Update proposal |

## Tips & Best Practices

1. **Always handle errors**: Wrap service calls in try-catch
2. **Show loading states**: Use loading flags for better UX
3. **Validate before calling**: Check required fields client-side
4. **Use helper methods**: For calculations and formatting
5. **Cache when possible**: Avoid unnecessary API calls
6. **Update state properly**: Reload data after mutations
7. **Type safety**: Use provided TypeScript types
8. **User feedback**: Show success/error messages

## Need Help?

- Check implementation: `src/services/supportService.ts`
- Check component: `src/components/support/SupportPackageSelector.tsx`
- Check integration: `src/pages/project/ContractPayment.tsx`
- Backend docs: `/api/docs` (Swagger)
