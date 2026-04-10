import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronDown, ChevronUp, Clock, RefreshCw } from 'lucide-react';

interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string | number;
}

interface CrawlSourceCardProps {
  name: string;
  source: string;
  icon: React.ReactNode;
  lastCrawl?: string;
  totalItems?: number;
  configFields: ConfigField[];
  onCrawl: (config: Record<string, unknown>) => Promise<void>;
  delay?: number;
}

const CrawlSourceCard: React.FC<CrawlSourceCardProps> = ({
  name,
  source,
  icon,
  lastCrawl,
  totalItems,
  configFields,
  onCrawl,
  delay = 0,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    configFields.forEach((f) => {
      if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
    });
    return defaults;
  });

  const handleCrawl = async () => {
    setLoading(true);
    try {
      await onCrawl(config);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
              <p className="text-xs text-gray-500">{source}</p>
            </div>
          </div>
          <button
            onClick={handleCrawl}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Crawl Now
          </button>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Last: {formatTime(lastCrawl)}
          </div>
          {totalItems !== undefined && (
            <div>Total: {totalItems.toLocaleString()} items</div>
          )}
        </div>
      </div>

      {configFields.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-5 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <span>Configuration</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="px-5 pb-4 space-y-3"
            >
              {configFields.map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={(config[field.name] as string) || ''}
                      onChange={(e) => setConfig({ ...config, [field.name]: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Default</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={(config[field.name] as string | number) ?? ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          [field.name]: field.type === 'number' ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default CrawlSourceCard;
