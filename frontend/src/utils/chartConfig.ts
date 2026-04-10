/**
 * Chart Configuration Utility
 * Centralized configuration for all Recharts components
 */

// ============================================
// COLOR SCHEMES
// ============================================

export const chartColors = {
  // Primary gradient colors
  primary: {
    start: '#3B82F6', // blue-600
    end: '#9333EA', // purple-600
  },

  // Status colors
  status: {
    completed: '#10B981', // green-500
    inProgress: '#3B82F6', // blue-600
    pending: '#F59E0B', // amber-500
    delayed: '#EF4444', // red-500
    onHold: '#6B7280', // gray-500
    cancelled: '#DC2626', // red-600
  },

  // Priority colors
  priority: {
    high: '#EF4444', // red-500
    medium: '#F59E0B', // amber-500
    low: '#10B981', // green-500
  },

  // Multi-color palette for charts
  palette: [
    '#3B82F6', // blue-600
    '#9333EA', // purple-600
    '#10B981', // green-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#06B6D4', // cyan-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#14B8A6', // teal-500
    '#F97316', // orange-500
  ],

  // Background colors
  background: {
    light: '#F9FAFB', // gray-50
    medium: '#F3F4F6', // gray-100
    dark: '#E5E7EB', // gray-200
  },

  // Text colors
  text: {
    primary: '#111827', // gray-900
    secondary: '#6B7280', // gray-500
    tertiary: '#9CA3AF', // gray-400
  },

  // Grid and axis colors
  grid: '#E5E7EB', // gray-200
  axis: '#6B7280', // gray-500
};

// ============================================
// GRADIENTS
// ============================================

export const chartGradients = {
  blueToPurple: {
    id: 'blueToPurple',
    colors: [
      { offset: '0%', color: '#3B82F6', opacity: 0.8 },
      { offset: '100%', color: '#9333EA', opacity: 0.8 },
    ],
  },
  greenToBlue: {
    id: 'greenToBlue',
    colors: [
      { offset: '0%', color: '#10B981', opacity: 0.8 },
      { offset: '100%', color: '#3B82F6', opacity: 0.8 },
    ],
  },
  amberToRed: {
    id: 'amberToRed',
    colors: [
      { offset: '0%', color: '#F59E0B', opacity: 0.8 },
      { offset: '100%', color: '#EF4444', opacity: 0.8 },
    ],
  },
  areaGradient: {
    id: 'areaGradient',
    colors: [
      { offset: '5%', color: '#3B82F6', opacity: 0.3 },
      { offset: '95%', color: '#9333EA', opacity: 0.1 },
    ],
  },
};

// ============================================
// CHART THEME CONFIGURATION
// ============================================

export const chartTheme = {
  // Font settings
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

// ============================================
// COMMON CHART PROPS
// ============================================

export const commonChartProps = {
  // Default margins
  margin: {
    top: 10,
    right: 30,
    left: 0,
    bottom: 0,
  },

  // Axis styling
  xAxis: {
    stroke: chartColors.axis,
    style: {
      fontSize: chartTheme.fontSize.sm,
      fontWeight: chartTheme.fontWeight.semibold,
    },
  },

  yAxis: {
    stroke: chartColors.axis,
    style: {
      fontSize: chartTheme.fontSize.sm,
      fontWeight: chartTheme.fontWeight.semibold,
    },
  },

  // Grid styling
  cartesianGrid: {
    strokeDasharray: '3 3',
    stroke: chartColors.grid,
  },

  // Legend styling
  legend: {
    iconType: 'circle' as const,
    wrapperStyle: {
      fontSize: chartTheme.fontSize.sm,
      fontWeight: chartTheme.fontWeight.medium,
    },
  },
};

// ============================================
// CUSTOM TOOLTIP STYLES
// ============================================

export const tooltipStyles = {
  container: 'bg-white border-2 border-gray-200 rounded-xl p-4 shadow-xl',
  title: 'text-sm font-semibold text-gray-900 mb-2',
  value: 'text-lg font-bold',
  label: 'text-xs text-gray-600',
  separator: 'border-t border-gray-200 my-2',
};

// ============================================
// RESPONSIVE BREAKPOINTS
// ============================================

export const responsiveConfig = {
  mobile: {
    width: 320,
    height: 200,
    fontSize: chartTheme.fontSize.xs,
  },
  tablet: {
    width: 768,
    height: 300,
    fontSize: chartTheme.fontSize.sm,
  },
  desktop: {
    width: 1024,
    height: 400,
    fontSize: chartTheme.fontSize.md,
  },
};

// ============================================
// ANIMATION SETTINGS
// ============================================

export const animationConfig = {
  duration: 800,
  easing: 'ease-in-out' as const,
  delay: 0,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format currency values for display
 */
export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Format large numbers
 */
export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toFixed(0);
};

/**
 * Format date for chart display
 */
export const formatChartDate = (dateString: string, format: 'short' | 'medium' | 'long' = 'short'): string => {
  const date = new Date(dateString);

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    case 'medium':
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    case 'long':
      return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
    default:
      return dateString;
  }
};

/**
 * Get color by index from palette
 */
export const getColorByIndex = (index: number): string => {
  return chartColors.palette[index % chartColors.palette.length];
};

/**
 * Get status color
 */
export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase().replace(/[_\s]/g, '');

  if (statusLower.includes('complete') || statusLower.includes('done')) {
    return chartColors.status.completed;
  }
  if (statusLower.includes('progress') || statusLower.includes('active')) {
    return chartColors.status.inProgress;
  }
  if (statusLower.includes('pending') || statusLower.includes('waiting')) {
    return chartColors.status.pending;
  }
  if (statusLower.includes('delay') || statusLower.includes('overdue')) {
    return chartColors.status.delayed;
  }
  if (statusLower.includes('hold') || statusLower.includes('pause')) {
    return chartColors.status.onHold;
  }
  if (statusLower.includes('cancel')) {
    return chartColors.status.cancelled;
  }

  return chartColors.palette[0];
};

/**
 * Get priority color
 */
export const getPriorityColor = (priority: string): string => {
  const priorityLower = priority.toLowerCase();

  if (priorityLower.includes('high') || priorityLower.includes('urgent')) {
    return chartColors.priority.high;
  }
  if (priorityLower.includes('medium') || priorityLower.includes('normal')) {
    return chartColors.priority.medium;
  }
  if (priorityLower.includes('low')) {
    return chartColors.priority.low;
  }

  return chartColors.priority.medium;
};

/**
 * Generate gradient definition config for SVG
 * Returns props that can be spread into linearGradient components
 */
export const generateGradientDef = (id: string, colors: { offset: string; color: string; opacity: number }[]) => {
  return {
    id,
    x1: '0',
    y1: '0',
    x2: '0',
    y2: '1',
    stops: colors.map((color, index) => ({
      key: index,
      offset: color.offset,
      stopColor: color.color,
      stopOpacity: color.opacity,
    })),
  };
};

/**
 * Export chart data to CSV
 */
export const exportChartDataToCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) return;

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Escape values with commas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export chart to PNG
 */
export const exportChartToPNG = (_chartRef: any, _filename: string): void => {
  // TODO: Implement with html2canvas or similar library to capture chart
};

// ============================================
// LOADING SKELETON CONFIGURATION
// ============================================

export const skeletonConfig = {
  baseColor: '#E5E7EB',
  highlightColor: '#F3F4F6',
  duration: 1.5,
  height: {
    sm: 200,
    md: 300,
    lg: 400,
  },
};

// ============================================
// EMPTY STATE CONFIGURATION
// ============================================

export const emptyStateConfig = {
  icon: {
    size: 48,
    color: chartColors.text.tertiary,
  },
  title: {
    fontSize: chartTheme.fontSize.lg,
    color: chartColors.text.secondary,
  },
  description: {
    fontSize: chartTheme.fontSize.sm,
    color: chartColors.text.tertiary,
  },
};

// Export all configurations as default
export default {
  colors: chartColors,
  gradients: chartGradients,
  theme: chartTheme,
  commonProps: commonChartProps,
  tooltip: tooltipStyles,
  responsive: responsiveConfig,
  animation: animationConfig,
  skeleton: skeletonConfig,
  emptyState: emptyStateConfig,
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatChartDate,
  getColorByIndex,
  getStatusColor,
  getPriorityColor,
  generateGradientDef,
  exportChartDataToCSV,
  exportChartToPNG,
};
