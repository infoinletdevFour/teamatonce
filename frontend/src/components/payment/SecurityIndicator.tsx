import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SecurityIndicatorProps {
  level?: 'high' | 'medium' | 'low';
  text?: string;
  variant?: 'default' | 'compact';
}

export const SecurityIndicator: React.FC<SecurityIndicatorProps> = ({
  level = 'high',
  text,
  variant = 'default'
}) => {
  const configs = {
    high: {
      icon: Shield,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      label: text || 'Secured by Escrow'
    },
    medium: {
      icon: Lock,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      label: text || 'Secure Connection'
    },
    low: {
      icon: AlertTriangle,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      label: text || 'Verification Required'
    }
  };

  const config = configs[level];
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2"
      >
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className={`text-sm font-semibold ${config.textColor}`}>
          {config.label}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-gradient-to-r ${config.bgColor} border-2 ${config.borderColor}
        rounded-xl p-4 shadow-sm
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className={`font-bold ${config.textColor} mb-1`}>
            {config.label}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            <span>SSL Encrypted</span>
            <span>•</span>
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityIndicator;
