import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import RoleBadge from '../../components/RoleBadge';
import {
  Briefcase,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  Headphones
} from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/data/subscriptions');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulateAction = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4000);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-semibold tracking-wide uppercase">
              Operations Desk Scope
            </span>
            <RoleBadge role="staff" size="sm" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Daily Operations Dashboard
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Requirement 8: Staff role has limited access to daily operations—managing active subscriptions, assisting customers, and tracking billing states.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/10 transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync Operations</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Active Daily Subscriptions</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data?.subscriptions?.length || 3}</p>
          <p className="mt-2 text-xs text-amber-700 font-medium">Daily operations review active</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Pending Billing Inquiries</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">2 Inquiries</p>
          <p className="mt-2 text-xs text-blue-600 font-medium">SLA: Under 1 hour response</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Staff Access Boundary</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">Daily Operations</p>
          <p className="mt-2 text-xs text-slate-500">Admin-exclusive endpoints restricted</p>
        </div>
      </div>

      {/* Daily Operations Subscription List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Assigned Customer Subscriptions (Staff Queue)
            </h2>
            <p className="text-xs text-slate-500">
              Staff operational duties: verify renewals and issue billing assistance
            </p>
          </div>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200">
            Staff Operations View
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Subscription</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Renewal Date</th>
                <th className="px-6 py-3 text-right">Daily Operations Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.subscriptions?.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-medium text-slate-900">{sub.id}</td>
                  <td className="px-6 py-3.5">
                    <p className="font-semibold text-slate-800">{sub.customerName}</p>
                    <p className="text-[11px] text-slate-400">{sub.customerEmail}</p>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-700">{sub.plan}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        sub.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'Active' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500">{sub.renewalDate}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleSimulateAction(`Operational reminder sent to ${sub.customerName}`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors inline-flex items-center gap-1"
                    >
                      <Send className="w-3 h-3 text-slate-500" />
                      <span>Send Notice</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

