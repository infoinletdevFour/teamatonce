# SubmitMilestoneModal Component

A professional, animated modal component for developers to submit completed milestones for client review. Features a blue theme consistent with developer actions, optional notes field, and smooth animations.

## 📁 File Location

```
/frontend/src/components/milestone/SubmitMilestoneModal.tsx
```

## 🎯 Features

- ✅ **Blue Developer Theme** - Consistent with developer action styling
- ✅ **Optional Notes Field** - 4-row textarea for submission notes
- ✅ **Framer Motion Animations** - Smooth entry/exit transitions
- ✅ **Loading State Management** - Disabled interactions during submission
- ✅ **Responsive Design** - Mobile-friendly layout
- ✅ **Milestone Information Display** - Shows title and description in highlighted box
- ✅ **Auto-reset** - Clears notes when modal opens/closes
- ✅ **Error Handling** - Keeps modal open on submission errors
- ✅ **Accessible** - Keyboard navigation and proper ARIA labels

## 📦 Dependencies

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Send, FileCheck } from 'lucide-react';
import { Milestone } from '@/types/milestone';
```

**Required Packages:**
- `framer-motion` - Animation library
- `lucide-react` - Icon library
- Custom `@/types/milestone` - Milestone type definitions

## 🔧 Props Interface

```typescript
interface SubmitMilestoneModalProps {
  isOpen: boolean;              // Control modal visibility
  onClose: () => void;          // Called when modal should close
  onSubmit: (notes?: string) => void | Promise<void>; // Submit handler
  milestone: Milestone;         // Milestone object to submit
  loading?: boolean;            // External loading state (optional)
}
```

## 🚀 Basic Usage

```typescript
import { useState } from 'react';
import { SubmitMilestoneModal } from '@/components/milestone';
import { Milestone } from '@/types/milestone';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [milestone, setMilestone] = useState<Milestone | null>(null);

  const handleSubmit = async (notes?: string) => {
    // Your API call here
    await api.submitMilestone(milestone.id, { notes });
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Submit Milestone
      </button>

      {milestone && (
        <SubmitMilestoneModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSubmit={handleSubmit}
          milestone={milestone}
        />
      )}
    </>
  );
};
```

## 📝 Complete Integration Example

```typescript
import React, { useState } from 'react';
import { SubmitMilestoneModal } from '@/components/milestone';
import { Milestone } from '@/types/milestone';
import { apiClient } from '@/lib/api-client';

export const MilestoneCard: React.FC<{ milestone: Milestone }> = ({
  milestone
}) => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitMilestone = async (notes?: string) => {
    setIsSubmitting(true);

    try {
      const response = await apiClient.put(
        `/projects/milestones/${milestone.id}/submit`,
        {
          notes: notes,
          submittedAt: new Date().toISOString(),
        }
      );

      // Success notification
      toast.success('Milestone submitted for review!');

      // Close modal
      setIsSubmitModalOpen(false);

      // Refresh data
      await refreshMilestones();
    } catch (error: any) {
      console.error('Failed to submit milestone:', error);
      toast.error('Failed to submit milestone');
      throw error; // Keep modal open
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="milestone-card">
      <h3>{milestone.title}</h3>

      {milestone.status === 'in_progress' && (
        <button onClick={() => setIsSubmitModalOpen(true)}>
          Submit for Review
        </button>
      )}

      <SubmitMilestoneModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleSubmitMilestone}
        milestone={milestone}
        loading={isSubmitting}
      />
    </div>
  );
};
```

## 🎨 Styling Details

### Color Scheme (Blue Theme)
- **Header Background**: `from-blue-50 via-blue-100 to-blue-50`
- **Icon Container**: `from-blue-500 to-blue-600`
- **Info Box**: `bg-blue-50 border-blue-200`
- **Submit Button**: `from-blue-600 to-blue-700`
- **Hover Shadow**: `shadow-blue-500/40`

### Layout
- **Max Width**: `max-w-lg` (32rem)
- **Border Radius**: `rounded-2xl`
- **Padding**: `px-6 py-4` (header/footer), `px-6 py-6` (content)
- **Textarea Rows**: `4` (multiline input)

## 🔄 State Management

The component manages two internal states:
1. `notes` - The optional submission notes
2. `isSubmitting` - Internal loading state

**Auto-reset behavior:**
- Notes are cleared when modal opens
- Internal submitting state is reset on modal open

## ⚠️ Error Handling

```typescript
const handleSubmit = async (notes?: string) => {
  try {
    await api.submitMilestone(milestoneId, { notes });
    // Modal closes automatically on success
  } catch (error) {
    console.error('Submission failed:', error);
    throw error; // Re-throw to keep modal open
  }
};
```

**Important**: If submission fails, throw the error to prevent modal from closing.

## 🎬 Animation Details

**Modal Backdrop:**
- Opacity: 0 → 1
- Duration: 200ms

**Modal Content:**
- Scale: 0.95 → 1
- Opacity: 0 → 1
- Y position: 20 → 0
- Duration: 200ms, easeOut

**Close Button:**
- Hover: scale(1.1) + rotate(90deg)
- Tap: scale(0.9)

**Action Buttons:**
- Hover: scale(1.02)
- Tap: scale(0.98)

## 🧪 Testing Checklist

- [ ] Modal opens with correct milestone information
- [ ] Notes field accepts multiline input
- [ ] Submit button shows loading state
- [ ] Modal closes on successful submission
- [ ] Modal stays open on submission error
- [ ] Cancel button works correctly
- [ ] X button closes modal
- [ ] Click outside closes modal (when not submitting)
- [ ] Escape key closes modal
- [ ] Notes are cleared when reopening
- [ ] Responsive on mobile devices

## 📚 Related Components

- **MilestoneFormModal** - For creating/editing milestones
- **FeedbackModal** - For client feedback on submissions
- **MilestoneList** - List view of all milestones

## 🔗 Type Definitions

The component uses the `Milestone` type from `@/types/milestone`:

```typescript
interface Milestone {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  dueDate: string | null;
  progress: number;
  amount: number | null;
  deliverables: string[];
  acceptanceCriteria: string[];
  estimatedHours: number | null;
  milestoneType: MilestoneType;
  orderIndex: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}
```

## 🎯 API Integration

**Expected API Endpoint:**
```
PUT /projects/milestones/{milestoneId}/submit
```

**Note:** The base URL (`http://localhost:3003/api/v1`) is already configured in apiClient, so you only need to provide the endpoint path.

**Request Body:**
```json
{
  "notes": "Optional developer notes",
  "submittedAt": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "id": "milestone-123",
  "status": "submitted",
  "submittedAt": "2024-01-15T10:30:00Z",
  "notes": "Optional developer notes"
}
```

## 🐛 Troubleshooting

**Modal doesn't close after submission:**
- Ensure your `onSubmit` handler doesn't throw errors on success
- Call `onClose()` in the parent after successful submission

**Notes are persisting:**
- The component auto-resets notes when `isOpen` changes
- Ensure you're toggling `isOpen` properly

**Animations not working:**
- Verify `framer-motion` is installed
- Check that `AnimatePresence` wraps the conditional render

**TypeScript errors:**
- Ensure `@/types/milestone` exports `Milestone` interface
- Verify all required props are provided

## 📄 License

Part of the Team@Once platform. Internal use only.

---

**Last Updated:** October 2024
**Component Version:** 1.0.0
**Maintainer:** Team@Once Development Team
