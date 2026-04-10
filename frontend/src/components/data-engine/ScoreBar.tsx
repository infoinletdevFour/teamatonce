import React from 'react';

interface ScoreBarProps {
  scores: {
    quality?: number;
    activity?: number;
    completeness?: number;
    availability?: number;
  };
  compact?: boolean;
}

const dimensions = [
  { key: 'quality', label: 'Quality', color: 'bg-blue-500' },
  { key: 'activity', label: 'Activity', color: 'bg-green-500' },
  { key: 'completeness', label: 'Completeness', color: 'bg-purple-500' },
  { key: 'availability', label: 'Availability', color: 'bg-orange-500' },
] as const;

const ScoreBar: React.FC<ScoreBarProps> = ({ scores, compact = false }) => {
  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-3'}>
      {dimensions.map((dim) => {
        const value = scores[dim.key] ?? 0;
        return (
          <div key={dim.key}>
            <div className="flex items-center justify-between mb-1">
              <span className={`font-medium text-gray-700 ${compact ? 'text-xs' : 'text-sm'}`}>
                {dim.label}
              </span>
              <span className={`font-semibold text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>
                {Math.round(value)}
              </span>
            </div>
            <div className={`w-full bg-gray-100 rounded-full ${compact ? 'h-1.5' : 'h-2'}`}>
              <div
                className={`${dim.color} rounded-full transition-all duration-500 ${compact ? 'h-1.5' : 'h-2'}`}
                style={{ width: `${Math.min(100, value)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScoreBar;
