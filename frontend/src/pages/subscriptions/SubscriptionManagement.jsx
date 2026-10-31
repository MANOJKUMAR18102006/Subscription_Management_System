import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Plus,
  Eye,
  Check,
  TrendingUp,
  Receipt
} from 'lucide-react';
import SubscriptionFormModal from '../../components/subscriptions/SubscriptionFormModal';

const SubscriptionManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isCustomer = user?.role === 'customer';
  const canManage = isAdmin || isStaff;

  const [subscriptions, setSubscriptions] = useState([]);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Summary Metrics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    confirmed: 0,
    paused: 0,
    closed: 0,
    mrr: 0
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');

  // Modal & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [expiringLoading, setExpiringLoading] = useState(false);

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
        if (res.data.stats) {
          setStats(res.data.stats);
        }
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

  // Lifecycle Quick Handlers
  const handleConfirm = async (sub) => {
    try {
      setActionLoadingId(sub._id);
      const res = await api.patch(`/subscriptions/${sub._id}/confirm`);
      if (res.data.success) {
        showToast(`Subscription ${sub.subscriptionNumber || ''} confirmed.`);
        fetchSubscriptions(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm subscription');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActivate = async (sub) => {
    try {
      setActionLoadingId(sub._id);
      const res = await api.patch(`/subscriptions/${sub._id}/activate`);
      if (res.data.success) {
        showToast(`Subscription ${sub.subscriptionNumber || ''} activated.`);
        fetchSubscriptions(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to activate subscription');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePause = async (sub) => {
    try {
      setActionLoadingId(sub._id);
      const res = await api.patch(`/subscriptions/${sub._id}/pause`);
      if (res.data.success) {
        showToast(`Subscription ${sub.subscriptionNumber || sub.planName} paused.`);
        fetchSubscriptions(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pause subscription');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResume = async (sub) => {
    try {
      setActionLoadingId(sub._id);
      const res = await api.patch(`/subscriptions/${sub._id}/resume`);
      if (res.data.success) {
        showToast(`Subscription ${sub.subscriptionNumber || sub.planName} resumed to active.`);
        fetchSubscriptions(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resume subscription');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEarlyClose = async (sub) => {
    const reason = window.prompt(
      'Are you sure you want to close this subscription early? Please provide a reason:',
      'Customer requested early contract closure'
    );
    if (reason === null) return;

    try {
      setActionLoadingId(sub._id);
      const res = await api.patch(`/subscriptions/${sub._id}/early-close`, { reason });
      if (res.data.success) {
        showToast(`Subscription ${sub.subscriptionNumber || sub.planName} closed early.`);
        fetchSubscriptions(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close subscription early');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRenew = async (sub) => {
    try {
      setActionLoadingId(sub._id);
      const res = await api.post(`/subscriptions/${sub._id}/renew`);
      if (res.data.success) {
        showToast(`Subscription ${sub.subscriptionNumber || sub.planName} renewed until ${new Date(res.data.nextBillingDate).toLocaleDateString()}.`);
        fetchSubscriptions(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to renew subscription');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleProcessAutoExpirations = async () => {
    try {
      setExpiringLoading(true);
      const res = await api.post('/subscriptions/process-expirations');
      if (res.data.success) {
        showToast(res.data.message || 'Auto-expiration scan completed.');
        fetchSubscriptions(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to run auto-expiration check');
    } finally {
      setExpiringLoading(false);
    }
  };

  const getStatusBadge = (st) => {
    const s = (st || 'draft').toLowerCase();
    switch (s) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'confirmed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'paused':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'closed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'quotation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'draft':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
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
              Module 6: Subscriptions
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Complete Subscription Lifecycle & Recurring Agreement Management
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Subscription Contracts Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live recurring contracts with locked pricing, multi-product lines, automated unique numbering, billing schedules, and pause/early-close lifecycle governance.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={handleProcessAutoExpirations}
              disabled={expiringLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs border border-slate-200 transition-colors"
              title="Run automated check for expired subscription agreements"
            >
              {expiringLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
              ) : (
                <Clock className="w-4 h-4 text-slate-600" />
              )}
              <span>Check Expirations</span>
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Subscription</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Agreements</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total || totalSubscriptions}</h3>
            <span className="text-[10px] text-slate-400">All registered contracts</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Active Contracts</span>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{stats.active || 0}</h3>
            <span className="text-[10px] text-slate-400">In recurring billing</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: MRR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">Monthly Run-Rate (MRR)</span>
            <h3 className="text-2xl font-black text-purple-700 mt-1">₹{Number(stats.mrr || 0).toLocaleString()}</h3>
            <span className="text-[10px] text-slate-400">Recurring active revenue</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Paused / Needs Attention */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Paused / In Review</span>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{(stats.paused || 0) + (stats.draft || 0)}</h3>
            <span className="text-[10px] text-slate-400">{stats.paused || 0} paused, {stats.draft || 0} draft</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Pause className="w-5 h-5" />
          </div>
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
              placeholder="Search by Subscription Number (SUB-...), customer, plan name..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">Status: All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Quotation">Quotation</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
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
          <p className="text-xs font-medium">Loading subscription contracts...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No subscriptions found</h3>
          <p className="text-xs text-slate-500">No subscription records match your search or filter criteria.</p>
          {canManage && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Subscription
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Subscription #</th>
                  <th className="py-3.5 px-4">Subscriber</th>
                  <th className="py-3.5 px-4">Plan & Terms</th>
                  <th className="py-3.5 px-4">Lines</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Next Billing</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {subscriptions.map((sub) => {
                  const isActionLoading = actionLoadingId === sub._id;
                  const normStatus = (sub.status || 'draft').toLowerCase();

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
                      {/* Subscription Number */}
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/subscriptions/${sub._id}`}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                        >
                          <span>{sub.subscriptionNumber || 'SUB-2026-XXXX'}</span>
                        </Link>
                        <div className="text-[10px] text-slate-400">
                          {new Date(sub.startDate).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Subscriber */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sub.customerId?.name || 'Customer'}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                          {sub.customerId?.company ? `${sub.customerId.company} • ` : ''}
                          {sub.customerId?.email}
                        </div>
                      </td>

                      {/* Plan & Frequency */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{sub.planName}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100 uppercase">
                            {sub.billingFrequency || 'Monthly'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">Terms: {sub.paymentTerms || 'Net 30'}</div>
                      </td>

                      {/* Lines Summary */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {sub.subscriptionLines?.length || 1} product(s)
                        </span>
                      </td>

                      {/* Total Recurring Amount */}
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        ₹{Number(sub.totalAmount || sub.amount || 0).toLocaleString()}
                        <div className="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" /> Price Locked
                        </div>
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
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                            normStatus
                          )}`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      {/* Lifecycle Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail Link */}
                          <Link
                            to={`/subscriptions/${sub._id}`}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                            title="View detailed contract"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Confirm (Draft/Quotation) */}
                          {canManage && ['draft', 'quotation'].includes(normStatus) && (
                            <button
                              type="button"
                              onClick={() => handleConfirm(sub)}
                              disabled={isActionLoading}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-colors"
                              title="Confirm subscription agreement"
                            >
                              <Check className="w-2.5 h-2.5" /> Confirm
                            </button>
                          )}

                          {/* Activate (Confirmed) */}
                          {canManage && normStatus === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleActivate(sub)}
                              disabled={isActionLoading}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-colors"
                              title="Activate subscription"
                            >
                              <Play className="w-2.5 h-2.5" /> Activate
                            </button>
                          )}

                          {/* Pause / Resume Button */}
                          {normStatus === 'paused' ? (
                            <button
                              type="button"
                              onClick={() => handleResume(sub)}
                              disabled={isActionLoading}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-colors"
                              title="Resume subscription"
                            >
                              <Play className="w-2.5 h-2.5" /> Resume
                            </button>
                          ) : normStatus === 'active' ? (
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
                          {['active', 'paused'].includes(normStatus) && (
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
                          {['active', 'paused'].includes(normStatus) && (
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
                              <XCircle className="w-2.5 h-2.5" /> Close
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

      {/* Subscription Creation Modal */}
      {isModalOpen && (
        <SubscriptionFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={(newSub) => {
            showToast(`Subscription ${newSub.subscriptionNumber || ''} created successfully!`);
            fetchSubscriptions(1);
          }}
        />
      )}
    </div>
  );
};

export default SubscriptionManagement;
