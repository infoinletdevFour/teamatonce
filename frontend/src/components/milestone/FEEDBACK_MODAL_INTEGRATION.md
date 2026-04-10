# FeedbackModal Integration Guide

## Overview

The `FeedbackModal` component provides a user-friendly interface for clients to request changes on submitted milestones. It features a warning-style design with orange/yellow theming to indicate that changes are being requested.

## Features

- **Warning-Style Design**: Orange/yellow theme to indicate change requests
- **Required Feedback**: Validates that feedback is not empty
- **Milestone Display**: Shows milestone title and description
- **Loading States**: Supports async operations with loading indicators
- **Error Handling**: Displays validation and API errors
- **Framer Motion Animations**: Smooth entry/exit animations
- **Accessibility**: Keyboard navigation and proper ARIA labels
- **Responsive**: Works on all screen sizes

## Installation

The component is already created at:
```
/frontend/src/components/milestone/FeedbackModal.tsx
```

## Dependencies

All required dependencies are already installed:
- `react` (^19.1.1)
- `framer-motion` (^12.23.12)
- `lucide-react` (^0.540.0)
- `@types/react` (^19.1.10)

## Basic Usage

```tsx
import React, { useState } from 'react';
import { FeedbackModal } from '@/components/milestone/FeedbackModal';
import type { Milestone } from '@/types/project';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  const milestone: Milestone = {
    // ... your milestone data
  };

  const handleFeedbackSubmit = async (feedback: string) => {
    // Submit feedback to your API
    await fetch(`/api/milestones/${milestone.id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });

    // Close modal on success
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Request Changes
      </button>

      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleFeedbackSubmit}
        milestone={milestone}
      />
    </>
  );
};
```

## Props API

### FeedbackModalProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | ✅ Yes | - | Controls modal visibility |
| `onClose` | `() => void` | ✅ Yes | - | Called when modal should close |
| `onSubmit` | `(feedback: string) => void \| Promise<void>` | ✅ Yes | - | Called when feedback is submitted |
| `milestone` | `Milestone` | ✅ Yes | - | Milestone data to display |
| `loading` | `boolean` | ❌ No | `false` | External loading state |

### Milestone Type

The `Milestone` interface is defined in `/frontend/src/types/project.ts`:

```typescript
interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  milestone_type: MilestoneType;
  order_index: number;
  status: MilestoneStatus;
  deliverables?: string[];
  acceptance_criteria?: string[];
  estimated_hours?: number;
  actual_hours: number;
  due_date?: string;
  milestone_amount?: number;
  payment_status: string;
  requires_approval: boolean;
  progress?: number;
  created_at: string;
  updated_at: string;
}
```

## Integration Examples

### 1. Simple Integration

```tsx
const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

<button
  onClick={() => setFeedbackModalOpen(true)}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg"
>
  Request Changes
</button>

<FeedbackModal
  isOpen={feedbackModalOpen}
  onClose={() => setFeedbackModalOpen(false)}
  onSubmit={async (feedback) => {
    await submitFeedback(milestone.id, feedback);
    setFeedbackModalOpen(false);
  }}
  milestone={milestone}
/>
```

### 2. With Loading State

```tsx
const [loading, setLoading] = useState(false);

<FeedbackModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={async (feedback) => {
    setLoading(true);
    try {
      await api.submitFeedback(milestone.id, feedback);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }}
  milestone={milestone}
  loading={loading}
/>
```

### 3. With Error Handling

```tsx
<FeedbackModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={async (feedback) => {
    try {
      const response = await fetch(`/api/milestones/${milestone.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsOpen(false);
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      // Error will be displayed in the modal
      throw error;
    }
  }}
  milestone={milestone}
/>
```

### 4. In a Milestone Approval Page

```tsx
// MilestoneApprovalPage.tsx
import React, { useState } from 'react';
import { FeedbackModal } from '@/components/milestone/FeedbackModal';

const MilestoneApprovalPage = ({ milestone }) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleRequestChanges = () => {
    setShowFeedbackModal(true);
  };

  const handleApproveMilestone = async () => {
    await api.approveMilestone(milestone.id);
  };

  const handleFeedbackSubmit = async (feedback: string) => {
    await api.requestMilestoneChanges(milestone.id, { feedback });
    setShowFeedbackModal(false);
    // Optionally show success message
    toast.success('Change request submitted!');
  };

  return (
    <div>
      <h1>{milestone.name}</h1>
      {/* Milestone details */}

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleApproveMilestone}
          className="px-6 py-3 bg-green-500 text-white rounded-lg"
        >
          Approve Milestone
        </button>

        <button
          onClick={handleRequestChanges}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg"
        >
          Request Changes
        </button>
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        milestone={milestone}
      />
    </div>
  );
};
```

### 5. With Toast Notifications (using Sonner)

```tsx
import { toast } from 'sonner';

<FeedbackModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={async (feedback) => {
    const toastId = toast.loading('Submitting feedback...');

    try {
      await api.submitFeedback(milestone.id, feedback);
      toast.success('Feedback submitted successfully!', { id: toastId });
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to submit feedback', { id: toastId });
      throw error; // Keep modal open
    }
  }}
  milestone={milestone}
/>
```

## API Integration

### Backend Endpoint

You'll need to create an endpoint to handle feedback submission:

```typescript
// Backend: feedback.controller.ts
@Post(':milestoneId/feedback')
async submitFeedback(
  @Param('milestoneId') milestoneId: string,
  @Body() { feedback }: { feedback: string },
  @CurrentUser() user: User,
) {
  return this.feedbackService.submitMilestoneChangeFeedback({
    milestoneId,
    feedback,
    userId: user.id,
  });
}
```

### Frontend API Service

```typescript
// services/milestone.service.ts
export const milestoneService = {
  submitFeedback: async (milestoneId: string, feedback: string) => {
    const response = await fetch(`/api/milestones/${milestoneId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ feedback }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit feedback');
    }

    return response.json();
  },
};
```

## Styling Customization

The component uses Tailwind CSS classes. You can customize the theme by modifying the component or by using Tailwind's configuration:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Customize orange/yellow theme
        'warning-light': '#FFF7ED',
        'warning-main': '#F97316',
        'warning-dark': '#EA580C',
      },
    },
  },
};
```

## Accessibility

The component includes:
- Keyboard navigation support (Escape to close)
- Focus management
- ARIA labels
- Proper semantic HTML
- Screen reader support

## Validation Rules

- **Feedback Required**: User must provide feedback (cannot be empty)
- **Whitespace**: Leading/trailing whitespace is trimmed
- **Submit Disabled**: Button disabled when feedback is empty or during submission

## Animation Details

Uses Framer Motion for:
- Modal backdrop fade-in/out (0.2s)
- Modal content scale and slide animation (0.2s)
- Button hover effects
- Close button rotation on hover
- Loading spinner rotation

## Error Handling

The component handles errors in two ways:

1. **Validation Errors**: Shown immediately (e.g., empty feedback)
2. **Submission Errors**: Caught from `onSubmit` and displayed in modal

```tsx
// If onSubmit throws an error, it will be caught and displayed
const handleSubmit = async (feedback: string) => {
  try {
    await api.submitFeedback(milestone.id, feedback);
    setIsOpen(false);
  } catch (error) {
    // Error will be shown in modal
    throw error;
  }
};
```

## Best Practices

1. **Close Modal on Success**: Always close the modal after successful submission
2. **Show Notifications**: Use toast notifications to confirm submission
3. **Handle Errors Gracefully**: Re-throw errors to keep modal open on failure
4. **Validate Feedback**: Add custom validation in `onSubmit` if needed
5. **Loading States**: Use the `loading` prop for external loading states

## Common Patterns

### Pattern 1: Two-Action Approval Flow

```tsx
// Approve or Request Changes
<div className="flex gap-4">
  <button onClick={handleApprove} className="bg-green-500">
    Approve
  </button>
  <button onClick={() => setFeedbackModalOpen(true)} className="bg-orange-500">
    Request Changes
  </button>
</div>
```

### Pattern 2: Conditional Rendering

```tsx
// Only show "Request Changes" for completed milestones
{milestone.status === MilestoneStatus.COMPLETED && (
  <button onClick={() => setFeedbackModalOpen(true)}>
    Request Changes
  </button>
)}
```

### Pattern 3: Multiple Milestones

```tsx
// Handle multiple milestones with single modal
const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

{milestones.map(m => (
  <button onClick={() => setSelectedMilestone(m)}>
    Request Changes
  </button>
))}

{selectedMilestone && (
  <FeedbackModal
    isOpen={!!selectedMilestone}
    onClose={() => setSelectedMilestone(null)}
    milestone={selectedMilestone}
  />
)}
```

## Troubleshooting

### Modal doesn't close after submission

Make sure to call `setIsOpen(false)` or `onClose()` after successful submission:

```tsx
const handleSubmit = async (feedback: string) => {
  await api.submit(feedback);
  setIsOpen(false); // ← Don't forget this!
};
```

### Validation error not clearing

The component automatically clears errors when user types, but you can manually clear by throwing a new error or letting the component handle it.

### Loading state not working

Use the `loading` prop for external loading states:

```tsx
const [loading, setLoading] = useState(false);

<FeedbackModal loading={loading} ... />
```

## Related Components

- `MilestoneFormModal`: For creating/editing milestones
- `MilestoneList`: Displays list of milestones
- `Modal`: Base modal component used throughout the app

## Support

For questions or issues:
1. Check the example file: `FeedbackModal.example.tsx`
2. Review the main component: `FeedbackModal.tsx`
3. Check the type definitions: `@/types/project.ts`

## Changelog

### Version 1.0.0 (2024-01-26)
- Initial release
- Orange/yellow warning theme
- Required feedback validation
- Loading states
- Error handling
- Framer Motion animations
