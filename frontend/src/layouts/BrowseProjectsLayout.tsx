import React from 'react';
import { SimpleMegaMenu } from '@/components/layout/SimpleMegaMenu';

/**
 * BrowseProjectsLayout
 * Layout specifically for Browse Projects page with its own custom sidebar
 * Different from MinimalLayout as it wraps the page content that already has sidebar
 */

interface BrowseProjectsLayoutProps {
  children: React.ReactNode;
}

export const BrowseProjectsLayout: React.FC<BrowseProjectsLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Top Header with SimpleMegaMenu */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <SimpleMegaMenu />
      </div>

      {/* Main Content - BrowseProjects component already has its own sidebar */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default BrowseProjectsLayout;
