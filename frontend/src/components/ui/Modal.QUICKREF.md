# Modal Components - Quick Reference Card

## 🚀 Quick Start (30 seconds)

### 1. Setup (Once)
```tsx
// In App.tsx or main.tsx
import { ModalProvider } from './components/ui/Modal';

<ModalProvider>
  <YourApp />
</ModalProvider>
```

### 2. Use Anywhere
```tsx
import { useModal } from './components/ui/Modal';

function MyComponent() {
  const { confirm, alert } = useModal();

  const handleDelete = async () => {
    const ok = await confirm('Are you sure?');
    if (ok) {
      await alert('Deleted!', 'Success', { type: 'success' });
    }
  };
}
```

## 📦 Available Components

| Component | Purpose | Usage |
|-----------|---------|-------|
| `Modal` | Generic modal | Custom content |
| `ConfirmModal` | Yes/No dialogs | Delete, confirm actions |
| `AlertModal` | Notifications | Success, error, info, warning |
| `FormModal` | Forms | Create, edit, input |
| `ModalProvider` | Context wrapper | Wrap your app once |
| `useModal()` | Hook | Access confirm/alert anywhere |
| `confirm()` | Standalone function | No context needed |
| `alert()` | Standalone function | No context needed |

## 🎯 Common Patterns

### Delete Confirmation
```tsx
const { confirm, alert } = useModal();

const ok = await confirm(
  'This will permanently delete the item.',
  'Delete Item?',
  { confirmVariant: 'danger' }
);
```

### Success Message
```tsx
await alert('Saved successfully!', 'Success', { type: 'success' });
```

### Error Message
```tsx
await alert('Something went wrong.', 'Error', { type: 'error' });
```

### Warning
```tsx
await alert('This action may affect others.', 'Warning', { type: 'warning' });
```

### Info
```tsx
await alert('Feature is in beta.', 'Info', { type: 'info' });
```

## 🎨 Variants & Sizes

### Confirm Variants
- `primary` - Blue gradient (default)
- `danger` - Red gradient (delete, remove)
- `warning` - Orange gradient (caution)
- `success` - Green gradient (confirm, proceed)

### Alert Types
- `info` - Blue (informational)
- `success` - Green (completed successfully)
- `warning` - Amber (be careful)
- `error` - Red (something failed)

### Sizes
- `sm` - Small (448px) - Alerts, confirmations
- `md` - Medium (512px) - Default, forms
- `lg` - Large (672px) - Complex forms
- `xl` - Extra large (896px) - Full content

## 💡 Usage Methods

### Method 1: Context Hook (Recommended)
```tsx
const { confirm, alert } = useModal();
const result = await confirm('Sure?');
```

**Pros**: Clean, reusable, centralized
**Use when**: Multiple modals in your app

### Method 2: Standalone Functions
```tsx
import { confirm, alert } from './components/ui/Modal';
const result = await confirm('Sure?');
```

**Pros**: No setup, works anywhere
**Use when**: Quick one-off confirmations

### Method 3: Component-Based
```tsx
const [open, setOpen] = useState(false);
<ConfirmModal isOpen={open} onClose={() => setOpen(false)} ... />
```

**Pros**: Full control, custom logic
**Use when**: Complex state management needed

## 🔑 Key Props

### All Modals
```tsx
{
  isOpen: boolean;              // Required
  onClose: () => void;          // Required
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
  showCloseButton?: boolean;    // Default: true
  closeOnOverlayClick?: boolean; // Default: true
  closeOnEscape?: boolean;      // Default: true
}
```

### ConfirmModal Specific
```tsx
{
  message: string;              // Required
  confirmText?: string;         // Default: "Confirm"
  cancelText?: string;          // Default: "Cancel"
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  icon?: React.ReactNode;
}
```

### AlertModal Specific
```tsx
{
  message: string;              // Required
  type?: 'info' | 'success' | 'warning' | 'error';
  okText?: string;              // Default: "OK"
  onOk?: () => void;
  icon?: React.ReactNode;
}
```

### FormModal Specific
```tsx
{
  children: React.ReactNode;    // Form fields
  onSubmit?: () => void | Promise<void>;
  submitText?: string;          // Default: "Submit"
  cancelText?: string;          // Default: "Cancel"
  isLoading?: boolean;
}
```

## ⚡ Code Snippets

### Complete Delete Flow
```tsx
const { confirm, alert } = useModal();

const handleDelete = async () => {
  const ok = await confirm(
    'This action cannot be undone.',
    'Delete Project?',
    { confirmVariant: 'danger', confirmText: 'Delete' }
  );

  if (ok) {
    try {
      await deleteAPI();
      await alert('Deleted!', 'Success', { type: 'success' });
    } catch (error) {
      await alert(error.message, 'Error', { type: 'error' });
    }
  }
};
```

### Form Modal with Validation
```tsx
const [open, setOpen] = useState(false);
const [errors, setErrors] = useState({});

const handleSubmit = async () => {
  const newErrors = validate(formData);
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    throw new Error('Validation failed'); // Prevents close
  }
  await saveAPI(formData);
};

<FormModal
  isOpen={open}
  onClose={() => setOpen(false)}
  onSubmit={handleSubmit}
>
  <input className={errors.email ? 'border-red-500' : ''} />
  {errors.email && <span className="text-red-600">{errors.email}</span>}
</FormModal>
```

### Chained Modals
```tsx
const step1 = await confirm('Start process?');
if (step1) {
  await doStep1();

  const step2 = await confirm('Continue?');
  if (step2) {
    await doStep2();
    await alert('Complete!', 'Success', { type: 'success' });
  }
}
```

### Custom Icon
```tsx
import { Trash2 } from 'lucide-react';

await confirm('Delete?', 'Confirm', {
  icon: <Trash2 className="w-8 h-8 text-red-600" />
});
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal doesn't show | Check `isOpen` state, verify ModalProvider wrapper |
| Standalone doesn't work | Import `{ confirm, alert }` from correct path |
| Close button not working | Ensure `onClose` updates state |
| Animation issues | Verify framer-motion is installed |

## ✅ Best Practices

1. **Use descriptive messages**: "Delete project?" not "Are you sure?"
2. **Match variant to action**: Use `danger` for destructive actions
3. **Handle async properly**: Always use `await` with modal functions
4. **Add icons**: Visual cues improve UX
5. **Validate before submit**: Throw error to prevent close
6. **Provide feedback**: Show success/error after actions

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `Modal.tsx` | Main component code (672 lines) |
| `Modal.README.md` | Complete documentation |
| `Modal.INTEGRATION.md` | Step-by-step setup guide |
| `ModalExamples.tsx` | 10+ working examples |
| `Modal.QUICKREF.md` | This quick reference |

## 🔗 Import Paths

```tsx
// All components and utilities
import {
  Modal,
  ConfirmModal,
  AlertModal,
  FormModal,
  ModalProvider,
  useModal,
  confirm,
  alert,
} from './components/ui/Modal';
```

---

**Pro Tip**: Start with `useModal()` hook for most cases. Use standalone `confirm()`/`alert()` for quick one-offs. Use component-based for complex scenarios.

**Need more help?** See `Modal.README.md` for full API docs or `ModalExamples.tsx` for code examples.
