import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Shield, AlertCircle } from 'lucide-react';
import {
  supportService,
  SupportPackageResponseDto,
  SupportPackageType,
  SupportStatus,
} from '@/services/supportService';

interface SupportPackageSelectorProps {
  onSelect: (packageId: string) => void;
  selectedPackageId?: string;
}

export const SupportPackageSelector: React.FC<SupportPackageSelectorProps> = ({
  onSelect,
  selectedPackageId,
}) => {
  const [packages, setPackages] = useState<SupportPackageResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supportService.getSupportPackages();
      // Filter only active packages
      const activePackages = data.filter((pkg) => pkg.status === SupportStatus.ACTIVE);
      setPackages(activePackages);
    } catch (err: any) {
      setError(err.message || 'Failed to load support packages');
      console.error('Error loading support packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPackageTypeLabel = (type: SupportPackageType) => {
    const labels = {
      [SupportPackageType.BASIC]: 'Basic',
      [SupportPackageType.STANDARD]: 'Standard',
      [SupportPackageType.PREMIUM]: 'Premium',
      [SupportPackageType.ENTERPRISE]: 'Enterprise',
    };
    return labels[type] || type;
  };

  const getPackageTypeIndex = (type: SupportPackageType): number => {
    const order = {
      [SupportPackageType.BASIC]: 0,
      [SupportPackageType.STANDARD]: 1,
      [SupportPackageType.PREMIUM]: 2,
      [SupportPackageType.ENTERPRISE]: 3,
    };
    return order[type] || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading support packages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-xl border-2 border-red-200">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-bold text-red-900">Error Loading Packages</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={loadPackages}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200 text-center">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="font-bold text-gray-900 mb-2">No Support Packages Available</h3>
        <p className="text-gray-600">
          There are currently no support packages available. Please contact support for more
          information.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {packages.map((pkg, idx) => {
        const isSelected = selectedPackageId === pkg.id;
        const isPremium = getPackageTypeIndex(pkg.package_type) === 1; // Standard package highlighted

        return (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white rounded-2xl p-6 border-2 shadow-lg hover:shadow-xl transition-all cursor-pointer ${
              isSelected
                ? 'border-blue-500 ring-4 ring-blue-200'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => onSelect(pkg.id)}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-gray-900 mb-2">{pkg.package_name}</h3>
              <p className="text-gray-600 mb-1">{getPackageTypeLabel(pkg.package_type)}</p>
              <p className="text-sm text-gray-500">{pkg.monthly_hours} hours/month</p>
              {pkg.response_time_sla && (
                <p className="text-xs text-blue-600 mt-1">
                  SLA: {pkg.response_time_sla}h response time
                </p>
              )}
              <div className="mb-4 mt-4">
                <span className="text-5xl font-black text-gray-900">
                  {pkg.currency === 'USD' ? '$' : pkg.currency}
                  {pkg.monthly_cost.toLocaleString()}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {pkg.includes_features && pkg.includes_features.length > 0 ? (
                pkg.includes_features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 italic">No features listed</li>
              )}
            </ul>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all ${
                isPremium
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSelected ? 'Selected' : 'Select Package'}
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SupportPackageSelector;
