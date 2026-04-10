import { motion } from 'framer-motion';
import { CheckCircle2, X, Zap, BarChart3 } from 'lucide-react';
import { comparisonData, platformFees, FeatureValue } from '@/lib/comparison-data';

const ComparisonTable = () => {
  const renderFeatureCell = (value: FeatureValue, isTeamAtOnce: boolean = false) => {
    if (value === "full") {
      if (isTeamAtOnce) {
        return (
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span>Full</span>
          </div>
        );
      }
      return <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" />;
    } else if (value === "partial") {
      if (isTeamAtOnce) {
        return (
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold">
            <span>Partial</span>
          </div>
        );
      }
      return <div className="text-sm font-semibold text-yellow-600">Partial</div>;
    } else if (value === "basic") {
      return <div className="text-sm font-semibold text-yellow-600">Basic</div>;
    } else {
      return <X className="w-6 h-6 text-gray-300 mx-auto" />;
    }
  };

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-3 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-blue-900">See The Difference</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Why Team@Once
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Beats The Competition
            </span>
          </h2>
          <p className="text-base text-gray-600 max-w-3xl mx-auto">
            We&apos;ve built the all-in-one platform that does what others can&apos;t
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-100"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <th className="px-8 py-6 text-left">
                    <div className="text-lg font-black text-gray-900">Feature</div>
                  </th>
                  <th className="px-8 py-6 text-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-2">
                        <Zap className="w-7 h-7 text-purple-600" />
                      </div>
                      <div className="text-lg font-black text-white">Team@Once</div>
                      <div className="text-xs text-white/80">All-in-One Platform</div>
                    </div>
                  </th>
                  <th className="px-8 py-6 text-center">
                    <div className="text-lg font-bold text-gray-700">Upwork</div>
                    <div className="text-xs text-gray-500">Marketplace</div>
                  </th>
                  <th className="px-8 py-6 text-center">
                    <div className="text-lg font-bold text-gray-700">Deel</div>
                    <div className="text-xs text-gray-500">Payment Platform</div>
                  </th>
                  <th className="px-8 py-6 text-center">
                    <div className="text-lg font-bold text-gray-700">Toptal</div>
                    <div className="text-xs text-gray-500">Elite Talent</div>
                  </th>
                  <th className="px-8 py-6 text-center">
                    <div className="text-lg font-bold text-gray-700">Fiverr</div>
                    <div className="text-xs text-gray-500">Gig Platform</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparisonData.map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-blue-50 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-900">{row.feature}</div>
                      <div className="text-sm text-gray-600 mt-1">{row.desc}</div>
                    </td>
                    <td className="px-8 py-5 text-center bg-gradient-to-r from-blue-50 to-purple-50">
                      {renderFeatureCell(row.teamatonce, true)}
                    </td>
                    <td className="px-8 py-5 text-center">
                      {renderFeatureCell(row.upwork)}
                    </td>
                    <td className="px-8 py-5 text-center">
                      {renderFeatureCell(row.deel)}
                    </td>
                    <td className="px-8 py-5 text-center">
                      {renderFeatureCell(row.toptal)}
                    </td>
                    <td className="px-8 py-5 text-center">
                      {renderFeatureCell(row.fiverr)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <td className="px-8 py-6 font-black text-gray-900 text-lg">Platform Fee</td>
                  <td className="px-8 py-6 text-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                    <div className="text-2xl font-black text-white">{platformFees.teamatonce.fee}</div>
                    {platformFees.teamatonce.note && (
                      <div className="text-xs text-white/80 mt-1">{platformFees.teamatonce.note}</div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="text-lg font-bold text-gray-700">{platformFees.upwork.fee}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="text-lg font-bold text-gray-700">{platformFees.deel.fee}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="text-lg font-bold text-gray-700">{platformFees.toptal.fee}</div>
                    {platformFees.toptal.note && (
                      <div className="text-xs text-gray-500">{platformFees.toptal.note}</div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="text-lg font-bold text-gray-700">{platformFees.fiverr.fee}</div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-black text-base shadow-2xl shadow-purple-500/30"
          >
            Start Using Team@Once Free
          </motion.button>
          <p className="text-sm text-gray-600 mt-4">No credit card required • 14-day trial • Cancel anytime</p>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonTable;
