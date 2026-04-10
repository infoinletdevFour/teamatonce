/**
 * MODAL USAGE EXAMPLES
 *
 * This file demonstrates all the different ways to use the Modal components.
 * Copy these examples into your components as needed.
 */

import React, { useState } from 'react';
import {
  Modal,
  ConfirmModal,
  AlertModal,
  FormModal,
  ModalProvider,
  useModal,
  confirm,
  alert,
} from './Modal';
import { Trash2, CheckCircle2 } from 'lucide-react';

// ==================== EXAMPLE 1: Basic Modal ====================

export const BasicModalExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Basic Modal</button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Basic Modal"
        description="This is a basic modal with custom content"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            This is a basic modal component. You can put any content here.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ==================== EXAMPLE 2: Confirm Modal ====================

export const ConfirmModalExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Item deleted!');
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Delete Item</button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDelete}
        icon={<Trash2 className="w-8 h-8 text-red-600" />}
      />
    </>
  );
};

// ==================== EXAMPLE 3: Alert Modal ====================

export const AlertModalExample: React.FC = () => {
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="space-x-4">
      <button onClick={() => setSuccessOpen(true)}>Success Alert</button>
      <button onClick={() => setErrorOpen(true)}>Error Alert</button>
      <button onClick={() => setWarningOpen(true)}>Warning Alert</button>
      <button onClick={() => setInfoOpen(true)}>Info Alert</button>

      {/* Success Alert */}
      <AlertModal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        type="success"
        title="Success!"
        message="Your changes have been saved successfully."
      />

      {/* Error Alert */}
      <AlertModal
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        type="error"
        title="Error"
        message="Something went wrong. Please try again later."
      />

      {/* Warning Alert */}
      <AlertModal
        isOpen={warningOpen}
        onClose={() => setWarningOpen(false)}
        type="warning"
        title="Warning"
        message="You are about to perform a potentially dangerous action."
      />

      {/* Info Alert */}
      <AlertModal
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        type="info"
        title="Information"
        message="This feature is currently in beta. Some functionality may be limited."
      />
    </div>
  );
};

// ==================== EXAMPLE 4: Form Modal ====================

export const FormModalExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Form</button>

      <FormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Contact Us"
        description="Fill out the form below and we'll get back to you soon"
        submitText="Send Message"
        onSubmit={handleSubmit}
        size="md"
      >
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Your message..."
            />
          </div>
        </div>
      </FormModal>
    </>
  );
};

// ==================== EXAMPLE 5: Using Modal Context (Recommended) ====================

// First, wrap your app with ModalProvider:
// In App.tsx or main.tsx:
// <ModalProvider>
//   <YourApp />
// </ModalProvider>

// Then use the hook in any component:
export const ContextModalExample: React.FC = () => {
  const { confirm, alert } = useModal();

  const handleDeleteWithContext = async () => {
    const confirmed = await confirm(
      'Are you sure you want to delete this project? All data will be lost.',
      'Delete Project',
      {
        confirmText: 'Delete Project',
        confirmVariant: 'danger',
        icon: <Trash2 className="w-8 h-8 text-red-600" />,
      }
    );

    if (confirmed) {
      // Simulate deletion
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await alert(
        'Project has been deleted successfully.',
        'Success',
        { type: 'success' }
      );
    }
  };

  const handleSaveWithContext = async () => {
    // Simulate save
    const success = Math.random() > 0.3; // 70% success rate

    if (success) {
      await alert(
        'Your changes have been saved successfully!',
        'Saved',
        { type: 'success' }
      );
    } else {
      await alert(
        'Failed to save changes. Please try again.',
        'Error',
        { type: 'error' }
      );
    }
  };

  return (
    <div className="space-x-4">
      <button onClick={handleDeleteWithContext}>
        Delete with Context
      </button>
      <button onClick={handleSaveWithContext}>
        Save with Context
      </button>
    </div>
  );
};

// ==================== EXAMPLE 6: Standalone Functions (No Context Required) ====================

export const StandaloneModalExample: React.FC = () => {
  const handleDeleteStandalone = async () => {
    // Use standalone confirm (no context needed)
    const confirmed = await confirm(
      'Are you sure you want to proceed?',
      'Confirm Action',
      {
        confirmText: 'Yes, proceed',
        confirmVariant: 'primary',
      }
    );

    if (confirmed) {
      console.log('User confirmed!');

      // Show success alert
      await alert(
        'Operation completed successfully!',
        'Success',
        { type: 'success' }
      );
    }
  };

  const showInfoStandalone = async () => {
    await alert(
      'This is a standalone alert that doesn\'t require ModalProvider.',
      'Information',
      { type: 'info' }
    );
  };

  return (
    <div className="space-x-4">
      <button onClick={handleDeleteStandalone}>
        Standalone Confirm
      </button>
      <button onClick={showInfoStandalone}>
        Standalone Alert
      </button>
    </div>
  );
};

// ==================== EXAMPLE 7: Different Sizes ====================

export const SizeExamples: React.FC = () => {
  const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-x-4">
      {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <button
          key={s}
          onClick={() => {
            setSize(s);
            setIsOpen(true);
          }}
        >
          {s.toUpperCase()} Modal
        </button>
      ))}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`${size.toUpperCase()} Modal`}
        size={size}
      >
        <p className="text-gray-700">
          This is a {size} sized modal. Resize your browser to see how it adapts!
        </p>
      </Modal>
    </div>
  );
};

// ==================== EXAMPLE 8: Custom Buttons in Confirm Modal ====================

export const CustomButtonsExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePublish = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Published!');
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Publish Article</button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Publish Article"
        message="Your article will be visible to all users. Ready to publish?"
        confirmText="Publish Now"
        cancelText="Save as Draft"
        confirmVariant="success"
        onConfirm={handlePublish}
        icon={<CheckCircle2 className="w-8 h-8 text-emerald-600" />}
      />
    </>
  );
};

// ==================== EXAMPLE 9: Form with Validation ====================

export const FormWithValidationExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      throw new Error('Validation failed');
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Form submitted:', { email, password });

    // Reset form
    setEmail('');
    setPassword('');
    setErrors({});
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Login Form</button>

      <FormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Sign In"
        submitText="Login"
        onSubmit={handleSubmit}
        size="sm"
      >
        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>
        </div>
      </FormModal>
    </>
  );
};

// ==================== EXAMPLE 10: Complete Demo Component ====================

export const ModalDemoPage: React.FC = () => {
  return (
    <ModalProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-black text-gray-900 mb-8">
            Modal Components Demo
          </h1>

          <div className="space-y-8">
            {/* Basic Modal */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Basic Modal</h2>
              <BasicModalExample />
            </div>

            {/* Confirm Modal */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Confirm Modal</h2>
              <ConfirmModalExample />
            </div>

            {/* Alert Modals */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Alert Modals</h2>
              <AlertModalExample />
            </div>

            {/* Form Modal */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Form Modal</h2>
              <FormModalExample />
            </div>

            {/* Context Modals */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Using Context (Recommended)</h2>
              <ContextModalExample />
            </div>

            {/* Standalone */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Standalone Functions</h2>
              <StandaloneModalExample />
            </div>

            {/* Sizes */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Different Sizes</h2>
              <SizeExamples />
            </div>
          </div>
        </div>
      </div>
    </ModalProvider>
  );
};

export default ModalDemoPage;
