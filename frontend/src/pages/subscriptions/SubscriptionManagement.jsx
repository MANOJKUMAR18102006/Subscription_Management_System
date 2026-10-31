import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  XCircle,
  RefreshCw,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  DollarSign,
  Package,
  User,
  Ban,
  Check
} from 'lucide-react';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isCustomer = user?.role === 'customer';

  const [subscriptions, setSubscriptions] = useState([]);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');

  // Action status message
  const [toastMessage, setToastMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchSubscriptions = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (frequencyFilter !== 'all') params.append('billingFrequency', frequencyFilter);

      const res = await api.get(`/subscriptions?${params.toString()}`);
      if (res.data.success) {
        setSubscriptions(res.data.subscriptions);
        setTotalSubscriptions(res.data.totalSubscriptions);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.currentPage);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(1);
  }, [statusFilter, frequencyFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSubscriptions(1);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Requirement 5: Pause Subscription (enforces plan.allowPause)
  const handlePause = async (sub) => {
    try {
      setActionLoadingId(sub._id);
      const res = await api.patch(`/subscriptions/${sub._id}/pause`);
      if (res.data.success) {
        showToast(`Subscription to '${sub.planName}' paused.`);
        fetchSubscriptions(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pause subscription');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Resume Subscription
  const handleResume = async (sub) => {
    try {
      setActionLoadingId(sub._id);
      const res = await api.patch(`/subscriptions/${sub._id}/resume`);
      if (res.data.success) {
        showToast(`Subscription to '${sub.planName}' resumed to active.`);
        fetchSubscriptions(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resume subscription');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Requirement 5: Early Close Subscription (enforces plan.allowEarlyClosure)
  const handleEarlyClose = async (sub) => {
    const reason = window.prompt(`Are you sure you want to close this subscription early? Please provide a reason:`, 'Customer requested early closure');
    if (reason === null) return;

    try {
      setActionLoadingId(sub._id);
      const res = await api.patch(`/subscriptions/${sub._id}/early-close`, { reason });
      if (res.data.success) {
        showToast(`Subscription to '${sub.planName}' closed early.`);
        fetchSubscriptions(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close subscription early');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Requirement 5: Renew Subscription (enforces plan.allowRenewal)
  const handleRenew = async (sub) => {
    try {
      setActionLoadingId(sub._id);
      const res = await api.post(`/subscriptions/${sub._id}/renew`);
      if (res.data.success) {
        showToast(`Subscription to '${sub.planName}' renewed until ${new Date(res.data.nextBillingDate).toLocaleDateString()}.`);
        fetchSubscriptions(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to renew subscription');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Subscription Management
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {isCustomer ? 'My Active Contracts & Rates' : 'System Oversight & Lifecycle Controls'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Subscriptions Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live subscription agreements linked to subscription plans. Displays agreed unit pricing locked at signup (Requirement 7) and enforces contractual pause, renewal, and early closure controls (Requirement 5).
          </p>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by plan name or subscriber..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed Early</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
            </select>

            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">Frequency: All</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-xs font-medium">Loading subscriptions...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No subscriptions found</h3>
          <p className="text-xs text-slate-500">No subscription records match your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Subscriber</th>
                  <th className="py-3.5 px-4">Plan & Agreement</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Locked Unit Rate</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Next Renewal</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {subscriptions.map((sub) => {
                  const isActionLoading = actionLoadingId === sub._id;
                  const allowPause = sub.planSnapshot?.allowPause !== undefined
                    ? sub.planSnapshot.allowPause
                    : sub.planId?.allowPause !== undefined ? sub.planId.allowPause : true;

                  const allowEarlyClosure = sub.planSnapshot?.allowEarlyClosure !== undefined
                    ? sub.planSnapshot.allowEarlyClosure
                    : sub.planId?.allowEarlyClosure !== undefined ? sub.planId.allowEarlyClosure : true;

                  const allowRenewal = sub.planSnapshot?.allowRenewal !== undefined
                    ? sub.planSnapshot.allowRenewal
                    : sub.planId?.allowRenewal !== undefined ? sub.planId.allowRenewal : true;

                  return (
                    <tr key={sub._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Subscriber */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sub.customerId?.name || 'Customer'}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {sub.customerId?.email}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{sub.planName}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100 uppercase">
                            {sub.billingFrequency || sub.billingCycle}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sub.productId?.name || 'Linked Bundle'}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {sub.quantity || 1} unit(s)
                        </span>
                      </td>

                      {/* Locked Unit Rate (Requirement 7) */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          ₹{Number(sub.unitPrice || 0).toLocaleString()}
                        </div>
                        <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" /> Price Locked
                        </span>
                      </td>

                      {/* Total Recurring Amount */}
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        ₹{Number(sub.amount || 0).toLocaleString()}
                      </td>

                      {/* Next Renewal Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sub.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sub.status === 'paused'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : sub.status === 'closed'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : sub.status === 'past_due'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      {/* Lifecycle Actions (Requirement 5) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pause / Resume Button */}
                          {sub.status === 'paused' ? (
                            <button
                              type="button"
                              onClick={() => handleResume(sub)}
                              disabled={isActionLoading}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-colors"
                              title="Resume subscription"
                            >
                              <Play className="w-2.5 h-2.5" /> Resume
                            </button>
                          ) : sub.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => handlePause(sub)}
                              disabled={!allowPause || isActionLoading}
                              className={`px-2 py-1 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-colors ${
                                allowPause
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                              title={allowPause ? 'Pause subscription' : 'Pausing disabled by admin plan setting'}
                            >
                              <Pause className="w-2.5 h-2.5" /> Pause
                            </button>
                          ) : null}

                          {/* Renew Button */}
                          {['active', 'past_due', 'paused'].includes(sub.status) && (
                            <button
                              type="button"
                              onClick={() => handleRenew(sub)}
                              disabled={!allowRenewal || isActionLoading}
                              className={`px-2 py-1 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-colors ${
                                allowRenewal
                                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                              title={allowRenewal ? 'Renew subscription period' : 'Renewal disabled by admin plan setting'}
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> Renew
                            </button>
                          )}

                          {/* Early Close Button */}
                          {['active', 'paused'].includes(sub.status) && (
                            <button
                              type="button"
                              onClick={() => handleEarlyClose(sub)}
                              disabled={!allowEarlyClosure || isActionLoading}
                              className={`px-2 py-1 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-colors ${
                                allowEarlyClosure
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                              title={allowEarlyClosure ? 'Close subscription early' : 'Early closure prohibited by admin plan setting'}
                            >
                              <XCircle className="w-2.5 h-2.5" /> Close Early
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 text-xs text-slate-500">
          <span>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalSubscriptions} subscriptions)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => fetchSubscriptions(currentPage - 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800 px-2">{currentPage}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => fetchSubscriptions(currentPage + 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
