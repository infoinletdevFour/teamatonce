# FeedbackModal Quick Start Guide

## 🚀 Installation Complete

The `FeedbackModal` component is ready to use at:
```
/frontend/src/components/milestone/FeedbackModal.tsx
```

## ⚡ Quick Usage (Copy & Paste)

### 1. Import the Component

```tsx
import { FeedbackModal } from '@/components/milestone';
import type { FeedbackModalProps } from '@/components/milestone';
```

### 2. Basic Implementation

```tsx
import React, { useState } from 'react';
import { FeedbackModal } from '@/components/milestone';

function MilestoneApproval({ milestone }) {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleFeedback = async (feedback: string) => {
    await fetch(`/api/milestones/${milestone.id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
    setShowFeedback(false);
  };

  return (
    <>
      <button onClick={() => setShowFeedback(true)}>
        Request Changes
      </button>

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedback}
        milestone={milestone}
      />
    </>
  );
}
```

## 📋 Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Show/hide modal |
| `onClose` | `() => void` | ✅ | Close handler |
| `onSubmit` | `(feedback: string) => void \| Promise<void>` | ✅ | Submit handler |
| `milestone` | `Milestone` | ✅ | Milestone data |
| `loading` | `boolean` | ❌ | Loading state (optional) |

## 🎨 Styling

The component uses:
- **Orange/Yellow Theme**: Warning-style design
- **Tailwind CSS**: All styles
- **Framer Motion**: Smooth animations
- **Lucide Icons**: AlertCircle, X, Send

## ✅ Features

- ✅ Required feedback validation
- ✅ Loading states with spinner
- ✅ Error handling and display
- ✅ Smooth animations
- ✅ Responsive design
- ✅ Keyboard support (ESC to close)
- ✅ Click outside to close
- ✅ Auto-reset on open

## 🔧 Common Patterns

### With Loading State

```tsx
const [loading, setLoading] = useState(false);

<FeedbackModal
  loading={loading}
  onSubmit={async (feedback) => {
    setLoading(true);
    try {
      await api.submit(feedback);
      setShowFeedback(false);
    } finally {
      setLoading(false);
    }
  }}
  {...otherProps}
/>
```

### With Toast Notification

```tsx
import { toast } from 'sonner';

<FeedbackModal
  onSubmit={async (feedback) => {
    try {
      await api.submit(feedback);
      toast.success('Feedback submitted!');
      setShowFeedback(false);
    } catch (error) {
      toast.error('Failed to submit');
      throw error; // Keep modal open
    }
  }}
  {...otherProps}
/>
```

### With Error Handling

```tsx
<FeedbackModal
  onSubmit={async (feedback) => {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit'); // Shows in modal
    }

    setShowFeedback(false);
  }}
  {...otherProps}
/>
```

## 📁 File Structure

```
/frontend/src/components/milestone/
├── FeedbackModal.tsx                        # Main component
├── FeedbackModal.example.tsx                # Usage examples
├── FEEDBACK_MODAL_INTEGRATION.md            # Full integration guide
├── FEEDBACK_MODAL_QUICKSTART.md             # This file
└── index.ts                                 # Export file
```

## 🎯 Integration Checklist

- [x] Component created
- [x] Types defined
- [x] Exports added to index.ts
- [ ] Create backend API endpoint for feedback
- [ ] Integrate in milestone approval page
- [ ] Add toast notifications
- [ ] Test with real milestone data

## 📚 Full Documentation

For complete documentation, see:
- **Integration Guide**: `FEEDBACK_MODAL_INTEGRATION.md`
- **Examples**: `FeedbackModal.example.tsx`
- **Type Definitions**: `/frontend/src/types/project.ts`

## 🐛 Troubleshooting

**Modal won't close?**
```tsx
// Make sure to call setIsOpen(false) after submission
const handleSubmit = async (feedback) => {
  await api.submit(feedback);
  setIsOpen(false); // ← Add this
};
```

**Validation not working?**
```tsx
// Component validates automatically, just throw errors
const handleSubmit = async (feedback) => {
  if (feedback.length < 10) {
    throw new Error('Too short!'); // Shows in modal
  }
};
```

**Loading state not showing?**
```tsx
// Use the loading prop
<FeedbackModal loading={isLoading} ... />
```

## 🎨 Color Theme

The component uses these Tailwind colors:
- Primary: `orange-500`, `amber-500`
- Backgrounds: `orange-50`, `amber-50`
- Borders: `orange-200`, `amber-200`
- Text: `orange-600`

## 🔗 Related Components

- `MilestoneFormModal` - Create/edit milestones
- `SubmitMilestoneModal` - Submit milestone for approval
- `MilestoneList` - Display milestone list

## 💡 Tips

1. Always close modal on successful submission
2. Use toast notifications for user feedback
3. Re-throw errors to keep modal open on failure
4. Test with different milestone states
5. Consider adding custom validation

## 🚀 Next Steps

1. Create backend endpoint: `POST /api/milestones/:id/feedback`
2. Integrate in your milestone approval page
3. Add toast notifications
4. Test the component
5. Customize colors if needed

---

**Questions?** Check the full integration guide in `FEEDBACK_MODAL_INTEGRATION.md`
