import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import PlanFormModal from '../../components/plans/PlanFormModal';
import PlanDetailsModal from '../../components/plans/PlanDetailsModal';
import PlanSubscribeModal from '../../components/plans/PlanSubscribeModal';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Archive,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Clock,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  LayoutGrid,
  List,
  Check,
  Ban,
  Package,
  Users
} from 'lucide-react';

const PlanList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isCustomer = user?.role === 'customer';

  // Plans state
  const [plans, setPlans] = useState([]);
  const [totalPlans, setTotalPlans] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [summaryStats, setSummaryStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [subscribingPlan, setSubscribingPlan] = useState(null);

  // Blocked Alert Modal
  const [blockedAlert, setBlockedAlert] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isScanningAutoClose, setIsScanningAutoClose] = useState(false);

  const fetchPlans = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', viewMode === 'grid' ? 6 : 10);
      if (search.trim()) params.append('search', search.trim());
      if (frequencyFilter !== 'all') params.append('billingFrequency', frequencyFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (availabilityFilter !== 'all') params.append('availability', availabilityFilter);

      const [plansRes, statsRes] = await Promise.all([
        api.get(`/plans?${params.toString()}`),
        !isCustomer ? api.get('/plans/stats/summary') : Promise.resolve({ data: { success: false } })
      ]);

      if (plansRes.data.success) {
        setPlans(plansRes.data.plans);
        setTotalPlans(plansRes.data.totalPlans);
        setTotalPages(plansRes.data.totalPages);
        setCurrentPage(plansRes.data.currentPage);
      }

      if (statsRes.data.success) {
        setSummaryStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans(1);
  }, [frequencyFilter, statusFilter, availabilityFilter, viewMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPlans(1);
  };

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    setIsFormModalOpen(true);
  };

  const handleOpenDetails = (plan) => {
    setSelectedPlan(plan);
    setIsDetailsModalOpen(true);
  };

  const handleOpenSubscribe = (plan) => {
    setSubscribingPlan(plan);
    setIsSubscribeModalOpen(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Safe Deletion Handler (Guard against plans with active subscriptions)
  const handleDeletePlan = async (plan) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${plan.name}'?`)) {
      return;
    }

    try {
      const res = await api.delete(`/plans/${plan._id}`);
      if (res.data.success) {
        showToast(`Plan '${plan.name}' permanently deleted.`);
        fetchPlans(currentPage);
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.activeSubscriptionsCount > 0) {
        setBlockedAlert({
          planName: plan.name,
          planId: plan._id,
          count: err.response.data.activeSubscriptionsCount,
          message: err.response.data.message
        });
      } else {
        alert(err.response?.data?.message || 'Failed to delete plan.');
      }
    }
  };

  // Archive Plan
  const handleArchivePlan = async (planId, planName) => {
    try {
      const res = await api.patch(`/plans/${planId}/archive`);
      if (res.data.success) {
        showToast(`Plan '${planName}' safely archived.`);
        setBlockedAlert(null);
        fetchPlans(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive plan');
    }
  };

  // Status toggle
  const handleToggleStatus = async (plan, newStatus) => {
    try {
      const res = await api.patch(`/plans/${plan._id}/status`, { status: newStatus });
      if (res.data.success) {
        showToast(`Plan status updated to '${newStatus}'.`);
        fetchPlans(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update plan status');
    }
  };

  // Trigger Auto Close Scan (Requirement 4)
  const handleTriggerAutoCloseScan = async () => {
    try {
      setIsScanningAutoClose(true);
      const res = await api.post('/plans/check-auto-close');
      if (res.data.success) {
        showToast(res.data.message || 'Auto-close scan completed successfully.');
        fetchPlans(1);
      }
    } catch (err) {
      console.error('Auto close scan error:', err);
    } finally {
      setIsScanningAutoClose(false);
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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {isAdmin ? 'Full Plan Lifecycle Admin' : isStaff ? 'Operations Plan Directory' : 'Available Subscription Catalog'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Subscription Plans
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure recurring billing plans, link one or more products, define minimum order quantities, and enforce contract lifecycle rules (early closure, pause, and renewal).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {(isAdmin || isStaff) && (
            <button
              type="button"
              onClick={handleTriggerAutoCloseScan}
              disabled={isScanningAutoClose}
              title="Run Auto-Close check for expired plans"
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningAutoClose ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Auto-Close Scan</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar (Admin & Staff) */}
      {!isCustomer && summaryStats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Plans
            </span>
            <span className="text-2xl font-black text-slate-900">{summaryStats.totalPlans}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Configured catalog</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Active Plans
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-600">{summaryStats.activePlans}</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Open for subscriber signups</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Closed / Expired
            </span>
            <span className="text-2xl font-black text-slate-700">{summaryStats.closedPlans}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Auto-closed: {summaryStats.autoCloseEnabledCount}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Active Subscribers
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-600">{summaryStats.totalSubsUsingPlans}</span>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                Contracts
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Using modular plans</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Average Rate
            </span>
            <span className="text-2xl font-black text-slate-900">
              ₹{Math.round(summaryStats.averagePrice).toLocaleString()}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500">
              <span className="px-1 py-0.5 bg-slate-100 rounded">D: {summaryStats.frequencyMap?.Daily || 0}</span>
              <span className="px-1 py-0.5 bg-slate-100 rounded">W: {summaryStats.frequencyMap?.Weekly || 0}</span>
              <span className="px-1 py-0.5 bg-slate-100 rounded">M: {summaryStats.frequencyMap?.Monthly || 0}</span>
              <span className="px-1 py-0.5 bg-slate-100 rounded">Y: {summaryStats.frequencyMap?.Yearly || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search, Filter & View Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by plan name, description, or linked product..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </form>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Pricing Cards Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Operational Table"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Billing Frequency Filter */}
          <select
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Frequency: All</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Status: All</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Inactive">Inactive</option>
            <option value="Closed">Closed</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Availability Filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Availability: All</option>
            <option value="available">Available Now</option>
            <option value="upcoming">Scheduled (Future)</option>
            <option value="expired">Expired / Ended</option>
          </select>

          {(search || frequencyFilter !== 'all' || statusFilter !== 'all' || availabilityFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFrequencyFilter('all');
                setStatusFilter('all');
                setAvailabilityFilter('all');
              }}
              className="text-[10px] text-blue-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-xs font-medium">Loading subscription plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">No subscription plans found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or create a new plan to get started.
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Plan
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Pricing Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isAvailable = plan.availabilityState === 'active';

            return (
              <div
                key={plan._id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group relative"
              >
                {/* Card Top Banner */}
                <div className="p-5 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {plan.billingFrequency} Frequency
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isAvailable ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Available
                        </span>
                      ) : plan.availabilityState === 'scheduled' ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Scheduled
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {plan.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-8">
                    {plan.description || 'Enterprise recurring plan with contract lifecycle permissions.'}
                  </p>

                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">
                      {plan.currencySymbol || '₹'}{Number(plan.price || 0).toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      / {plan.billingFrequency}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Minimum Quantity:</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {plan.minQuantity || 1} unit(s)
                    </span>
                  </div>
                </div>

                {/* Linked Products (Req 1) & Permissions (Req 5) */}
                <div className="p-5 py-4 space-y-3.5 flex-1">
                  {/* Linked Products */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Linked Products ({plan.linkedProducts?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.linkedProducts?.slice(0, 3).map((lp, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 text-[11px]"
                        >
                          <Package className="w-3 h-3 text-blue-500" />
                          <span className="truncate max-w-[120px]">{lp.product?.name || 'Product'}</span>
                          {lp.isPrimary && <span className="text-[9px] text-blue-600 font-bold">*</span>}
                        </span>
                      ))}
                      {plan.linkedProducts?.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                          +{plan.linkedProducts.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contract Rules Pillbox (Req 5) */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Contract Permissions:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          plan.allowEarlyClosure
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                        title={plan.allowEarlyClosure ? 'Early closure permitted' : 'Early closure prohibited'}
                      >
                        <p className="font-bold">Close</p>
                        <p>{plan.allowEarlyClosure ? 'Allow' : 'Lock'}</p>
                      </div>

                      <div
                        className={`p-1.5 rounded-lg border ${
                          plan.allowPause
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                        title={plan.allowPause ? 'Pausing permitted' : 'Pausing prohibited'}
                      >
                        <p className="font-bold">Pause</p>
                        <p>{plan.allowPause ? 'Allow' : 'Lock'}</p>
                      </div>

                      <div
                        className={`p-1.5 rounded-lg border ${
                          plan.allowRenewal
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                        title={plan.allowRenewal ? 'Renewal permitted' : 'Renewal prohibited'}
                      >
                        <p className="font-bold">Renew</p>
                        <p>{plan.allowRenewal ? 'Allow' : 'Lock'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Features preview */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {plan.features.slice(0, 2).map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(plan)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Details</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Subscribe / Test Action */}
                    {isAvailable && (
                      <button
                        type="button"
                        onClick={() => handleOpenSubscribe(plan)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Subscribe</span>
                      </button>
                    )}

                    {/* Admin Actions */}
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(plan)}
                          title="Edit Plan"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(plan)}
                          title="Delete Plan"
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dense Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Plan Name</th>
                  <th className="py-3.5 px-4">Frequency</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Min Qty</th>
                  <th className="py-3.5 px-4">Linked Products</th>
                  <th className="py-3.5 px-4">Rules (Close/Pause/Renew)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {plans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{plan.name}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">{plan.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                        {plan.billingFrequency}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      ₹{Number(plan.price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{plan.minQuantity || 1} unit(s)</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-blue-500" />
                        <span>{plan.linkedProducts?.length || 0} product(s)</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className={plan.allowEarlyClosure ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                          Close
                        </span>
                        <span>•</span>
                        <span className={plan.allowPause ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                          Pause
                        </span>
                        <span>•</span>
                        <span className={plan.allowRenewal ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                          Renew
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          plan.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : plan.status === 'Closed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(plan)}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {plan.status === 'Active' && (
                          <button
                            type="button"
                            onClick={() => handleOpenSubscribe(plan)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold text-[10px]"
                          >
                            Subscribe
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(plan)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlan(plan)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 text-xs text-slate-500">
          <span>
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalPlans} total plans)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => fetchPlans(currentPage - 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800 px-2">{currentPage}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => fetchPlans(currentPage + 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Deletion Blocked Alert Modal */}
      {blockedAlert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Deletion Blocked</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {blockedAlert.message}
              </p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left">
              <strong>Requirement 7 & Contract Guard:</strong> Existing subscriptions retain their agreed terms. To decommission this plan without breaking active contracts, you can archive it instead.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBlockedAlert(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => handleArchivePlan(blockedAlert.planId, blockedAlert.planName)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive Plan Safely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Form Modal (Create & Edit) */}
      <PlanFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialData={editingPlan}
        onSaved={(_plan, msg) => {
          showToast(msg);
          fetchPlans(1);
        }}
      />

      {/* Plan Details Modal */}
      <PlanDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        plan={selectedPlan}
        onEdit={isAdmin ? handleOpenEditModal : null}
        onSubscribe={handleOpenSubscribe}
      />

      {/* Plan Subscribe Simulation Modal */}
      <PlanSubscribeModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
        plan={subscribingPlan}
        onSubscribed={(sub) => {
          showToast(`Subscription activated: ${sub.planName} (${sub.quantity} units)`);
          fetchPlans(currentPage);
        }}
      />
    </div>
  );
};

export default PlanList;
