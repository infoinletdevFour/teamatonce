import React from 'react';

interface ProjectPageLayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

/**
 * Standard layout wrapper for project pages
 * Ensures consistent spacing and styling across all project pages
 */
const ProjectPageLayout: React.FC<ProjectPageLayoutProps> = ({
  children,
  title,
  subtitle,
  headerActions,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header - Minimal & Clean */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            {typeof title === 'string' ? (
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">{subtitle}</p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
};

export { ProjectPageLayout };
export default ProjectPageLayout;
