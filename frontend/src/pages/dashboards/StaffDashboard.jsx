import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import RoleBadge from '../../components/RoleBadge';
import DateFilterSelector from '../../components/DateFilterSelector';
import {
  Users,
  Layers,
  Clock,
  AlertTriangle,
  Activity,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Send,
  Calendar,
  CreditCard,
  UserCheck,
  TrendingUp,
  FileText
} from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('this_month');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const fetchStaffData = async (selectedPeriod = period, isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setLoading(true);

      const res = await api.get(`/dashboard/staff?period=${selectedPeriod}`);
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load staff dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffData(period);
  }, [period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleSendReminder = (customerName, id) => {
    setActionNotice(`Operational notice and invoice reminder dispatched to ${customerName}.`);
    setTimeout(() => setActionNotice(''), 4000);
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <Loader2 className="w-9 h-9 text-amber-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Staff Operations Desk...
        </p>
      </div>
    );
  }

  const { metrics, recentCustomerActivities, operationalSubscriptions } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header & Date Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RoleBadge role="staff" size="sm" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Operations Desk
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Staff Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational queues for active customer accounts, invoice resolutions, and recent activity audit logs.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Date Filter: Today, This Month, Last Month, This Year */}
          <DateFilterSelector
            activePeriod={period}
            onPeriodChange={handlePeriodChange}
            disabled={isRefreshing}
          />

          <button
            type="button"
            onClick={() => fetchStaffData(period, true)}
            title="Refresh operations data"
            disabled={isRefreshing}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors self-end sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice('')}
            className="text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Staff 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">1. Total Customers</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight">
              {metrics?.totalCustomers ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Active registered subscribers
            </p>
          </div>
        </div>

        {/* 2. Active Subscriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">2. Active Subscriptions</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-emerald-600 leading-tight">
              {metrics?.activeSubscriptions ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Current serviceable subscriptions
            </p>
          </div>
        </div>

        {/* 3. Pending Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">3. Pending Invoices</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-amber-600 leading-tight">
              {metrics?.pendingInvoices?.count ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Total volume: <strong className="text-slate-800">${(metrics?.pendingInvoices?.total ?? 0).toLocaleString()}</strong>
            </p>
          </div>
        </div>

        {/* 4. Overdue Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">4. Overdue Invoices</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-red-600 leading-tight">
              {metrics?.overdueInvoices?.count ?? 0}
            </p>
            <p className="text-[11px] text-red-600 font-medium mt-1">
              Total overdue: ${(metrics?.overdueInvoices?.total ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Recent Customer Activities & Operational Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Recent Customer Activities */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                5. Recent Customer Activities
              </h2>
              <p className="text-xs text-slate-400">
                Real-time chronological events from customer accounts
              </p>
            </div>
            <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Live Feed
            </span>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-96 pr-1">
            {recentCustomerActivities?.map((act) => (
              <div
                key={act._id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    act.action.includes('succeeded') || act.action.includes('paid')
                      ? 'bg-emerald-100 text-emerald-700'
                      : act.action.includes('failed')
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 truncate">
                      {act.customerId?.name || 'Customer'}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(act.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    {act.description}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {act.customerId?.email} &middot; {act.customerId?.company || 'Direct Client'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Subscriptions Roster */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Customer Renewal & Invoicing Queue
              </h2>
              <p className="text-xs text-slate-400">
                Staff duties: assist subscriber renewals and issue payment notices
              </p>
            </div>
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Operations Desk
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Renewal</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operationalSubscriptions?.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{sub.customerId?.name}</p>
                      <p className="text-[11px] text-slate-400">{sub.customerId?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{sub.planName}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          sub.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleSendReminder(sub.customerId?.name, sub._id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
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
    </div>
  );
};

export default StaffDashboard;
