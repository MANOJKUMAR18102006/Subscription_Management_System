import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import RoleBadge from '../../components/RoleBadge';
import DateFilterSelector from '../../components/DateFilterSelector';
import RevenueOverviewChart from '../../components/charts/RevenueOverviewChart';
import SubscriptionStatusChart from '../../components/charts/SubscriptionStatusChart';
import PasswordRequirements, { checkPasswordCriteria } from '../../components/PasswordRequirements';
import {
  Users,
  UserPlus,
  Layers,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Calendar,
  CreditCard,
  Receipt,
  RefreshCw,
  Loader2,
  CheckCircle2,
  X,
  Mail,
  User,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  Building
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('this_month');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Staff creation modal state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: 'Operations Desk',
    phone: ''
  });
  const [staffFormError, setStaffFormError] = useState('');
  const [staffFormSuccess, setStaffFormSuccess] = useState('');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  const fetchAdminData = async (selectedPeriod = period, isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setLoading(true);

      const res = await api.get(`/dashboard/admin?period=${selectedPeriod}`);
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData(period);
  }, [period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleStaffFormChange = (e) => {
    setStaffForm({ ...staffForm, [e.target.name]: e.target.value });
    setStaffFormError('');
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffFormError('');
    setStaffFormSuccess('');

    if (!staffForm.name || !staffForm.email || !staffForm.password || !staffForm.confirmPassword) {
      setStaffFormError('Please fill in all required fields');
      return;
    }

    if (staffForm.password !== staffForm.confirmPassword) {
      setStaffFormError('Passwords do not match');
      return;
    }

    const criteria = checkPasswordCriteria(staffForm.password, staffForm.confirmPassword);
    if (!criteria.allMet) {
      setStaffFormError('Password must contain > 8 characters, uppercase, lowercase, and special character');
      return;
    }

    try {
      setIsCreatingStaff(true);
      const res = await api.post('/users/staff', staffForm);
      if (res.data.success) {
        setStaffFormSuccess(`Staff account created successfully for ${staffForm.name}`);
        setStaffForm({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          company: 'Operations Desk',
          phone: ''
        });
        fetchAdminData(period, true);
        setTimeout(() => {
          setShowStaffModal(false);
          setStaffFormSuccess('');
        }, 1500);
      }
    } catch (err) {
      setStaffFormError(err.response?.data?.message || err.message || 'Failed to create staff account');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Aggregating Real Database Metrics...
        </p>
      </div>
    );
  }

  const { metrics, recentSubscriptions, recentPayments, charts } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RoleBadge role="admin" size="sm" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Executive Governance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Admin Business Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time MongoDB aggregated analytics, recurring revenue metrics, and system activity.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Date Filter: Today, This Month, Last Month, This Year */}
          <DateFilterSelector
            activePeriod={period}
            onPeriodChange={handlePeriodChange}
            disabled={isRefreshing}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchAdminData(period, true)}
              title="Refresh live data"
              disabled={isRefreshing}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowStaffModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Staff</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary 7 Key Metric Cards */}
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
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+{metrics?.periodCustomers ?? 0} joined in selected period</span>
            </p>
          </div>
        </div>

        {/* 2. Total Active Subscriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">2. Active Subscriptions</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight">
              {metrics?.totalActiveSubscriptions ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Live subscriptions with active access
            </p>
          </div>
        </div>

        {/* 3. Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">3. Total Revenue ({period.replace('_', ' ')})</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight">
              ${(metrics?.totalRevenue ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Lifetime: <strong className="text-slate-700">${(metrics?.lifetimeRevenue ?? 0).toLocaleString()}</strong>
            </p>
          </div>
        </div>

        {/* 4. Pending Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">4. Pending Payments</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-amber-600 leading-tight">
              ${(metrics?.pendingPayments?.total ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {metrics?.pendingPayments?.count ?? 0} transaction{metrics?.pendingPayments?.count !== 1 ? 's' : ''} awaiting settlement
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Overdue Invoices, MRR, ARR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 5. Overdue Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">5. Overdue Invoices</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-red-600 leading-tight">
              ${(metrics?.overdueInvoices?.total ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-red-700 font-medium mt-1">
              {metrics?.overdueInvoices?.count ?? 0} invoice{metrics?.overdueInvoices?.count !== 1 ? 's' : ''} past due date
            </p>
          </div>
        </div>

        {/* 6. Monthly Recurring Revenue (MRR) */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-300">6. Monthly Recurring Revenue (MRR)</span>
            <div className="w-9 h-9 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white leading-tight">
              ${(metrics?.mrr ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              Normalized monthly run-rate from active subscriptions
            </p>
          </div>
        </div>

        {/* 7. Annual Recurring Revenue (ARR) */}
        <div className="bg-gradient-to-br from-indigo-950 to-purple-950 p-5 rounded-2xl text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-300">7. Annual Recurring Revenue (ARR)</span>
            <div className="w-9 h-9 rounded-xl bg-white/10 text-purple-300 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white leading-tight">
              ${(metrics?.arr ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              Annualized contract projection (MRR &times; 12)
            </p>
          </div>
        </div>
      </div>

      {/* Row 3: Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 10. Revenue Overview Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                10. Revenue Overview (Historical Trend)
              </h2>
              <p className="text-xs text-slate-400">
                Monthly revenue distribution generated from MongoDB payment transactions
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Recharts Area
            </span>
          </div>
          <RevenueOverviewChart data={charts?.revenueOverview || []} />
        </div>

        {/* 11. Subscription Status Distribution Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                11. Status Distribution
              </h2>
              <p className="text-xs text-slate-400">
                Live breakdown across active, trialing, and churned
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Recharts Donut
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <SubscriptionStatusChart data={charts?.subscriptionStatusDistribution || []} />
          </div>
        </div>
      </div>

      {/* Row 4: Recent Subscriptions & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 8. Recent Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">8. Recent Subscriptions</h2>
              <p className="text-xs text-slate-400">Latest subscriber registrations in the database</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Top {recentSubscriptions?.length || 0}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSubscriptions?.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{sub.customerId?.name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400">{sub.customerId?.email}</p>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700">{sub.planName}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">
                      ${sub.amount} <span className="text-[10px] text-slate-400 font-normal">/{sub.billingCycle}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          sub.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sub.status === 'past_due'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : sub.status === 'trialing'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sub.status === 'active'
                              ? 'bg-emerald-600'
                              : sub.status === 'past_due'
                              ? 'bg-amber-600'
                              : sub.status === 'trialing'
                              ? 'bg-blue-600'
                              : 'bg-red-600'
                          }`}
                        />
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 9. Recent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">9. Recent Payments</h2>
              <p className="text-xs text-slate-400">Processed transaction history from database</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Top {recentPayments?.length || 0}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Transaction ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments?.map((pay) => (
                  <tr key={pay._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-blue-600">
                      {pay.transactionId}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{pay.customerId?.name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400">{pay.paymentMethod}</p>
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">${pay.amount}.00</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          pay.status === 'succeeded'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : pay.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            pay.status === 'succeeded' ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}
                        />
                        {pay.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(pay.paidAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Staff Provisioning Modal (Admin Only) */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowStaffModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <UserPlus className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Provision Staff Account</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Administrator authority: Staff accounts have operational access to daily subscription queues.
            </p>

            {staffFormSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{staffFormSuccess}</span>
              </div>
            )}

            {staffFormError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{staffFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={staffForm.name}
                    onChange={handleStaffFormChange}
                    placeholder="David Miller"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={staffForm.email}
                    onChange={handleStaffFormChange}
                    placeholder="david.staff@subscriptionms.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={staffForm.password}
                      onChange={handleStaffFormChange}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={staffForm.confirmPassword}
                      onChange={handleStaffFormChange}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              <PasswordRequirements
                password={staffForm.password}
                confirmPassword={staffForm.confirmPassword}
                showMatch={true}
              />

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingStaff}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingStaff && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
