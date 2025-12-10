import React, { useState } from 'react';
import { useAppContext } from './context';
import { UserRole, LeaveStatus } from './types';
import { ShieldCheck, Calendar, LogOut } from 'lucide-react';
import { askPolicyBot } from './services/geminiService';

const Dashboard = () => {
  const { currentUser, leaves, holidays } = useAppContext();
  const [policyQuery, setPolicyQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Stats
  const pendingLeaves = leaves.filter(l => l.status !== LeaveStatus.APPROVED && l.status !== LeaveStatus.REJECTED).length;
  const nextHoliday = holidays.find(h => new Date(h.date) > new Date()) || holidays[0];

  const handleAskAi = async () => {
    if (!policyQuery.trim()) return;
    setLoadingAi(true);
    setAiResponse('');
    const answer = await askPolicyBot(policyQuery);
    setAiResponse(answer);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Welcome back, {currentUser?.name}!</h2>
        <p className="opacity-90">Here is your HR summary for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Leave Balance</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {/* Simplified placeholder, detailed view in Leaves page */}
                View Details
              </h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Next Holiday</p>
              <h3 className="text-xl font-bold text-gray-800 truncate max-w-[150px]">{nextHoliday?.name || 'None'}</h3>
              <p className="text-xs text-gray-400">{nextHoliday ? new Date(nextHoliday.date).toLocaleDateString() : '-'}</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <LogOut size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Actions</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {currentUser?.role === UserRole.EMPLOYEE ? leaves.filter(l => l.userId === currentUser.id && l.status !== 'APPROVED' && l.status !== 'REJECTED').length : pendingLeaves}
              </h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center space-x-2">
           <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
           <h3 className="font-semibold text-gray-700">HR Policy Assistant (AI)</h3>
        </div>
        <div className="p-6">
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Ask about leave policy, payroll dates, etc..." 
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              value={policyQuery}
              onChange={(e) => setPolicyQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
            />
            <button 
              onClick={handleAskAi}
              disabled={loadingAi}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loadingAi ? 'Asking...' : 'Ask'}
            </button>
          </div>
          {aiResponse && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-700">
              <strong className="block text-gray-900 mb-1">Answer:</strong>
              {aiResponse}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;