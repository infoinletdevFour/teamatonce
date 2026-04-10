# Modal Components - 60 Second Quick Start

## What You Got

**Production-ready modal system** to replace `window.alert()` and `window.confirm()` with beautiful, accessible dialogs that match your design system.

## Files Created

```
/frontend/src/components/ui/
├── Modal.tsx                 (Main code - 672 lines)
├── ModalExamples.tsx         (10+ examples)
├── Modal.README.md           (Full docs)
├── Modal.INTEGRATION.md      (Setup guide)
├── Modal.QUICKREF.md         (Quick reference)
└── MODAL_SUMMARY.txt         (This summary)
```

## Setup (30 seconds)

### 1. Wrap Your App

```tsx
// In src/App.tsx or src/main.tsx
import { ModalProvider } from './components/ui/Modal';

function App() {
  return (
    <ModalProvider>
      {/* Your existing app */}
    </ModalProvider>
  );
}
```

### 2. Start Using

```tsx
import { useModal } from './components/ui/Modal';

function MyComponent() {
  const { confirm, alert } = useModal();

  const handleDelete = async () => {
    const ok = await confirm('Are you sure?', 'Delete Item?');
    if (ok) {
      await deleteItem();
      await alert('Deleted successfully!', 'Success', { type: 'success' });
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

**That's it!** You're ready to go.

## Common Examples

### Delete Confirmation
```tsx
const ok = await confirm(
  'This will permanently delete all data.',
  'Delete Project?',
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

### Form Modal
```tsx
const [open, setOpen] = useState(false);

<FormModal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Create Project"
  onSubmit={async () => await createProject(data)}
>
  <input type="text" placeholder="Name" />
</FormModal>
```

## Components Available

| Component | Purpose |
|-----------|---------|
| `Modal` | Generic modal with custom content |
| `ConfirmModal` | Yes/No confirmations |
| `AlertModal` | Info/Success/Warning/Error alerts |
| `FormModal` | Forms with submit/cancel |
| `ModalProvider` | Context wrapper (use once) |
| `useModal()` | Hook to access confirm/alert |
| `confirm()` | Standalone confirm function |
| `alert()` | Standalone alert function |

## Features

- Accessible (ARIA, keyboard nav, focus trap)
- Animated (Framer Motion)
- Responsive (mobile-friendly)
- TypeScript (fully typed)
- 4 sizes (sm, md, lg, xl)
- 4 button variants (primary, danger, warning, success)
- 4 alert types (info, success, warning, error)
- Matches your design system

## Next Steps

1. **Setup**: Wrap app with `<ModalProvider>`
2. **Learn**: Read `Modal.INTEGRATION.md`
3. **Reference**: Check `Modal.QUICKREF.md`
4. **Examples**: See `ModalExamples.tsx`
5. **Docs**: Full API in `Modal.README.md`

## Need Help?

- **Quick answers**: `Modal.QUICKREF.md`
- **Setup help**: `Modal.INTEGRATION.md`
- **Full docs**: `Modal.README.md`
- **Examples**: `ModalExamples.tsx`
- **Troubleshooting**: `Modal.README.md` (bottom section)

---

**Ready to use!** No additional dependencies needed - everything is already installed.
