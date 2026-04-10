# Modal Components - Quick Integration Guide

## Step 1: Wrap Your App with ModalProvider

### Option A: If using App.tsx (Vite/React Router setup)

```tsx
// src/App.tsx
import { ModalProvider } from './components/ui/Modal';

function App() {
  return (
    <ModalProvider>
      {/* Your existing app content */}
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
    </ModalProvider>
  );
}

export default App;
```

### Option B: If using main.tsx entry point

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ModalProvider } from './components/ui/Modal';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </StrictMode>
);
```

## Step 2: Start Using Modals

### Quick Example 1: Simple Confirmation

```tsx
import { useModal } from '@/components/ui/Modal';

function DeleteButton({ itemId }: { itemId: string }) {
  const { confirm, alert } = useModal();

  const handleDelete = async () => {
    const confirmed = await confirm(
      'Are you sure you want to delete this item? This action cannot be undone.',
      'Delete Item',
      { confirmVariant: 'danger' }
    );

    if (confirmed) {
      try {
        await deleteItemAPI(itemId);
        await alert('Item deleted successfully!', 'Success', { type: 'success' });
      } catch (error) {
        await alert('Failed to delete item. Please try again.', 'Error', { type: 'error' });
      }
    }
  };

  return (
    <button onClick={handleDelete} className="btn-danger">
      Delete
    </button>
  );
}
```

### Quick Example 2: Without Context (Standalone)

```tsx
import { confirm, alert } from '@/components/ui/Modal';

async function handleLogout() {
  const confirmed = await confirm(
    'Are you sure you want to log out?',
    'Confirm Logout'
  );

  if (confirmed) {
    await logoutAPI();
    await alert('You have been logged out successfully.', 'Goodbye!', { type: 'info' });
    window.location.href = '/login';
  }
}
```

### Quick Example 3: Form Modal

```tsx
import { useState } from 'react';
import { FormModal } from '@/components/ui/Modal';

function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    await createProjectAPI({ name: projectName, description });
    // Reset form
    setProjectName('');
    setDescription('');
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Create Project</button>

      <FormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Project"
        submitText="Create"
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe your project..."
            />
          </div>
        </div>
      </FormModal>
    </>
  );
}
```

## Step 3: Replace Existing Browser Alerts

### Before (Using browser alerts - DON'T DO THIS):
```tsx
// ❌ Bad - browser alerts are ugly and not customizable
const handleDelete = () => {
  if (window.confirm('Are you sure?')) {
    deleteItem();
    window.alert('Deleted!');
  }
};
```

### After (Using Modal components - DO THIS):
```tsx
// ✅ Good - beautiful, accessible, branded modals
import { useModal } from '@/components/ui/Modal';

const handleDelete = async () => {
  const { confirm, alert } = useModal();

  const confirmed = await confirm('Are you sure you want to delete this item?');
  if (confirmed) {
    await deleteItem();
    await alert('Item deleted successfully!', 'Success', { type: 'success' });
  }
};
```

## Common Use Cases

### 1. Destructive Actions (Delete, Remove, Cancel)
```tsx
const result = await confirm(
  'This will permanently delete all data.',
  'Delete Project?',
  { confirmVariant: 'danger', confirmText: 'Delete Permanently' }
);
```

### 2. Save Confirmations
```tsx
await alert('Your changes have been saved.', 'Saved', { type: 'success' });
```

### 3. Error Messages
```tsx
await alert('An error occurred. Please try again.', 'Error', { type: 'error' });
```

### 4. Warnings
```tsx
await alert('This action may affect other users.', 'Warning', { type: 'warning' });
```

### 5. Information
```tsx
await alert('This feature is currently in beta.', 'Beta Feature', { type: 'info' });
```

## TypeScript Path Aliases (Optional)

If you want to use `@/components/ui/Modal` instead of relative paths, add this to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

And to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## Testing the Modals

Create a test page to try out all modal types:

```tsx
// src/pages/ModalTest.tsx
import { useState } from 'react';
import { useModal, FormModal } from '@/components/ui/Modal';

export default function ModalTestPage() {
  const { confirm, alert } = useModal();
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold mb-8">Modal Test Page</h1>

      <button
        onClick={async () => {
          const result = await confirm('Delete this item?');
          console.log('Result:', result);
        }}
        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Test Confirm Modal
      </button>

      <button
        onClick={() => alert('This is a success message!', 'Success', { type: 'success' })}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Test Alert Modal
      </button>

      <button
        onClick={() => setIsFormOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Test Form Modal
      </button>

      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Test Form"
        onSubmit={async () => {
          await new Promise(r => setTimeout(r, 1000));
          await alert('Form submitted!', 'Success', { type: 'success' });
        }}
      >
        <input
          type="text"
          placeholder="Enter something..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
        />
      </FormModal>
    </div>
  );
}
```

## Migration Checklist

- [ ] Wrap app with `<ModalProvider>`
- [ ] Replace all `window.confirm()` with `await confirm()`
- [ ] Replace all `window.alert()` with `await alert()`
- [ ] Replace all custom confirmation dialogs with `<ConfirmModal>`
- [ ] Replace all alert/notification dialogs with `<AlertModal>`
- [ ] Test keyboard navigation (ESC, Tab, Enter)
- [ ] Test on mobile devices
- [ ] Verify accessibility with screen reader

## Next Steps

1. ✅ Read `Modal.README.md` for complete API reference
2. ✅ Check `ModalExamples.tsx` for all usage patterns
3. ✅ Start replacing browser alerts in your components
4. ✅ Customize colors/styles if needed (edit Modal.tsx)

---

**That's it!** You now have production-ready modal components that replace browser alerts with beautiful, accessible dialogs. 🎉
