import React from 'react';
import { SimpleMegaMenu } from '@/components/layout/SimpleMegaMenu';

/**
 * MinimalLayout Component
 * Minimal layout for pages that have their own sidebar/navigation
 * Only includes the top menu bar
 */

interface MinimalLayoutProps {
  children: React.ReactNode;
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      {/* Top Header with SimpleMegaMenu */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm">
        <SimpleMegaMenu />
      </div>

      {/* Main Content - pt-20 provides space for fixed SimpleMegaMenu */}
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
};

export default MinimalLayout;
