import React from 'react';
import { motion } from 'framer-motion';
import {
  Upload, Brain, Target, Workflow, Award,
  MessageSquare, Sparkles, Star, Clock, Shield,
  CheckCircle2, Download
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface TimelineStep {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  mockup: React.ReactNode;
}

export const timelineSteps: TimelineStep[] = [
  {
    number: "01",
    title: "Post Your Project",
    description: "Describe your project using natural language. AI understands React 18, TypeScript, Node.js - any tech stack.",
    icon: Upload,
    color: "from-blue-500 to-cyan-500",
    mockup: (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
        <div className="flex items-start space-x-4">
          <MessageSquare className="w-8 h-8 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <div className="text-sm text-gray-600 mb-2">Project Requirements</div>
              <div className="text-gray-800">"Need a React + TypeScript developer for 3-month e-commerce project..."</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">React 18</span>
              <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-sm">TypeScript</span>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">3 months</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    number: "02",
    title: "AI Finds Perfect Match",
    description: "Within 2 minutes, AI analyzes skills, experience, availability, timezone, and rates to find your ideal developer.",
    icon: Brain,
    color: "from-purple-500 to-pink-500",
    mockup: (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
        <div className="flex items-center justify-center mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
        </div>
        <div className="text-center mb-4">
          <div className="text-sm text-gray-600 mb-2">Analyzing 10,247 developers...</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white rounded-lg p-2">
            <div className="font-semibold text-purple-600">Skills</div>
            <div className="text-gray-600">98% match</div>
          </div>
          <div className="bg-white rounded-lg p-2">
            <div className="font-semibold text-pink-600">Timezone</div>
            <div className="text-gray-600">Perfect</div>
          </div>
          <div className="bg-white rounded-lg p-2">
            <div className="font-semibold text-purple-600">Rate</div>
            <div className="text-gray-600">In budget</div>
          </div>
        </div>
      </div>
    )
  },
  {
    number: "03",
    title: "Review & Select",
    description: "Get detailed profiles with exact tool versions, portfolios, reviews, and video introductions. Chat before hiring.",
    icon: Target,
    color: "from-pink-500 to-rose-500",
    mockup: (
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border-2 border-pink-200">
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-gray-900">Sarah Chen</div>
              <div className="flex items-center space-x-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-3">Senior React Developer • 8 years exp</div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-white px-2 py-1 rounded text-xs">React 18.2</span>
              <span className="bg-white px-2 py-1 rounded text-xs">TypeScript 5.0</span>
              <span className="bg-white px-2 py-1 rounded text-xs">Next.js 14</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">$85/hr • Available now</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-1 rounded-full"
              >
                Chat
              </motion.button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3">
          <div className="text-xs text-gray-600 mb-2">Recent Review</div>
          <div className="text-sm text-gray-800">"Excellent communication and technical skills. Delivered ahead of schedule!"</div>
        </div>
      </div>
    )
  },
  {
    number: "04",
    title: "Collaborate & Build",
    description: "Use built-in Kanban boards, time tracking, video calls, and file sharing. Everything synced in real-time.",
    icon: Workflow,
    color: "from-green-500 to-teal-500",
    mockup: (
      <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border-2 border-green-200">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['To Do', 'Doing', 'Done'].map((col, idx) => (
            <div key={col} className="bg-white rounded-xl p-3">
              <div className="text-xs font-semibold text-gray-700 mb-2">{col}</div>
              <div className="space-y-2">
                <div className="bg-gradient-to-br from-green-100 to-teal-100 rounded-lg p-2 text-xs">
                  <div className="font-medium mb-1">Task {idx + 1}</div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>2h</span>
                    <div className="w-5 h-5 rounded-full bg-green-300" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-700">
            <Clock className="w-4 h-4" />
            <span>32h tracked this week</span>
          </div>
          <div className="flex -space-x-2">
            {[1,2,3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-teal-400 border-2 border-white" />
            ))}
          </div>
        </div>
      </div>
    )
  },
  {
    number: "05",
    title: "Pay Securely",
    description: "Release milestone payments through escrow. Automatic invoicing, multi-currency, and tax compliance in 170+ countries.",
    icon: Award,
    color: "from-orange-500 to-amber-500",
    mockup: (
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-orange-600" />
            <span className="font-semibold text-gray-900">Escrow Protected</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
        <div className="space-y-3 mb-4">
          {[
            { name: "Milestone 1", status: "Completed", amount: "$2,500" },
            { name: "Milestone 2", status: "In Progress", amount: "$3,000" }
          ].map((m, idx) => (
            <div key={idx} className="bg-white rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{m.name}</div>
                <div className="text-xs text-gray-600">{m.status}</div>
              </div>
              <div className="text-lg font-bold text-orange-600">{m.amount}</div>
            </div>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Invoice</span>
        </motion.button>
      </div>
    )
  }
];
