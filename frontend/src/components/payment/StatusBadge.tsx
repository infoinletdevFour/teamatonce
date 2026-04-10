import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, XCircle, DollarSign, AlertTriangle } from 'lucide-react';
import type { MilestoneStatus, PaymentStatus, ContractStatus, InvoiceStatus } from '@/types/payment';

interface StatusBadgeProps {
  status: MilestoneStatus | PaymentStatus | ContractStatus | InvoiceStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const getStatusConfig = () => {
    const configs: Record<string, {
      label: string;
      icon: React.ElementType;
      bgColor: string;
      textColor: string;
      borderColor: string;
    }> = {
      // Milestone statuses
      'pending': {
        label: 'Pending',
        icon: Clock,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300'
      },
      'in-progress': {
        label: 'In Progress',
        icon: Clock,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300'
      },
      'review': {
        label: 'Under Review',
        icon: AlertCircle,
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-300'
      },
      'completed': {
        label: 'Completed',
        icon: CheckCircle2,
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-300'
      },
      'paid': {
        label: 'Paid',
        icon: DollarSign,
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-300'
      },
      'disputed': {
        label: 'Disputed',
        icon: AlertTriangle,
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300'
      },
      // Payment statuses
      'processing': {
        label: 'Processing',
        icon: Clock,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300'
      },
      'failed': {
        label: 'Failed',
        icon: XCircle,
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300'
      },
      'refunded': {
        label: 'Refunded',
        icon: AlertCircle,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-300'
      },
      // Contract statuses
      'draft': {
        label: 'Draft',
        icon: Clock,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300'
      },
      'active': {
        label: 'Active',
        icon: CheckCircle2,
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-300'
      },
      'terminated': {
        label: 'Terminated',
        icon: XCircle,
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300'
      },
      // Invoice statuses
      'sent': {
        label: 'Sent',
        icon: Clock,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300'
      },
      'overdue': {
        label: 'Overdue',
        icon: AlertTriangle,
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300'
      },
      'cancelled': {
        label: 'Cancelled',
        icon: XCircle,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300'
      }
    };

    return configs[status] || configs['pending'];
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold border-2
        ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </motion.span>
  );
};

export default StatusBadge;
