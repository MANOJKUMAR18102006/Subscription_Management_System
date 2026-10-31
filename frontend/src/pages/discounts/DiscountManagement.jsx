import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Percent,
  DollarSign,
  Copy,
  Check,
  Calendar,
  Sparkles,
  ShoppingBag,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import DiscountFormModal from './DiscountFormModal';

const DiscountManagement = () => {
  const { user } = useAuth();
  const canManage = ['admin', 'staff'].includes(user?.role);

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  // Live Coupon Validator State
  const [testCode, setTestCode] = useState('');
  const [testAmount, setTestAmount] = useState(1500);
  const [testQty, setTestQty] = useState(1);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/discounts');
      if (res.data.success) {
        setDiscounts(res.data.discounts || []);
        if (res.data.discounts?.length > 0 && !testCode) {
          const firstActive = res.data.discounts.find((d) => d.status === 'active');
          if (firstActive) setTestCode(firstActive.code);
        }
      }
    } catch (err) {
      console.error('Error fetching discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  // Validate coupon test
  const handleValidateCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!testCode.trim()) return;

    try {
      setTestLoading(true);
      setTestResult(null);
      const res = await api.post('/discounts/validate', {
        code: testCode.trim().toUpperCase(),
        amount: Number(testAmount) || 0,
        quantity: Number(testQty) || 1
      });
      setTestResult(res.data);
    } catch (err) {
      setTestResult({
        success: false,
        valid: false,
        message: err.response?.data?.message || 'Invalid or ineligible coupon code'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleToggleStatus = async (discount) => {
    try {
      const newStatus = discount.status === 'active' ? 'inactive' : 'active';
      await api.put(`/discounts/${discount._id}`, { status: newStatus });
      setToastMessage(`Coupon '${discount.code}' marked as ${newStatus}`);
      fetchDiscounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteDiscount = async (discount) => {
    if (!window.confirm(`Are you sure you want to delete coupon '${discount.code}'?`)) return;
    try {
      await api.delete(`/discounts/${discount._id}`);
      setToastMessage(`Coupon '${discount.code}' deleted successfully`);
      fetchDiscounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  // Filtered list
  const filteredDiscounts = discounts.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Metrics
  const activeCount = discounts.filter((d) => d.status === 'active').length;
  const pctCount = discounts.filter((d) => d.type === 'percentage').length;
  const fixedCount = discounts.filter((d) => d.type === 'fixed').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Tag className="w-7 h-7 text-indigo-600" />
            Discounts & Promotional Coupons
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure percentage and fixed savings, minimum purchase rules, expiration dates, and usage limits
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setSelectedDiscount(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            Create Discount
          </button>
        )}
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Coupons</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{discounts.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Coupons</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Percentage (%) Deals</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{pctCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flat (₹) Off Deals</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{fixedCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Live Coupon Validation Simulator */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-indigo-900/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-indigo-900/60">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Live Coupon Eligibility & Savings Simulator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Test coupon code validation against order amounts, quantity thresholds, and customer criteria
            </p>
          </div>

          <form onSubmit={handleValidateCoupon} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-300 font-medium">Coupon Code:</label>
              <input
                type="text"
                placeholder="PROMO20"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                className="w-32 px-3 py-1.5 text-xs font-mono font-bold uppercase text-slate-900 bg-white rounded-lg border-0 focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-300 font-medium">Order Total (₹):</label>
              <input
                type="number"
                min="0"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="w-24 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white rounded-lg border-0 focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <button
              type="submit"
              disabled={testLoading}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-sm disabled:opacity-60"
            >
              {testLoading ? 'Testing...' : 'Test Coupon'}
            </button>
          </form>
        </div>

        {/* Validation Result Display */}
        {testResult && (
          <div className="mt-4 pt-2">
            {testResult.success && testResult.valid ? (
              <div className="p-4 bg-emerald-950/70 border border-emerald-700/60 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-900 text-emerald-300 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-200">
                      Coupon Applied: {testResult.discount?.name} ({testResult.discount?.code})
                    </h4>
                    <p className="text-xs text-emerald-300/80">{testResult.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 uppercase">Customer Savings</p>
                    <p className="text-lg font-bold text-emerald-400">
                      - ₹{testResult.discount?.discountAmount?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right pl-6 border-l border-emerald-800">
                    <p className="text-[11px] text-slate-400 uppercase">Final Total</p>
                    <p className="text-xl font-black text-white">
                      ₹{testResult.discount?.finalAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-950/70 border border-rose-800/60 rounded-xl flex items-center gap-3 text-rose-200 text-xs">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{testResult.message || 'Coupon code is not valid for this order amount or quantity.'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by coupon code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Discount Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Flat Amount (₹)</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Coupon Code</th>
                <th className="px-6 py-4">Promotion Name</th>
                <th className="px-6 py-4">Discount Value</th>
                <th className="px-6 py-4">Minimum Rules</th>
                <th className="px-6 py-4">Usage Limit</th>
                <th className="px-6 py-4">Validity</th>
                <th className="px-6 py-4">Status</th>
                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading discounts...
                  </td>
                </tr>
              ) : filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-6 py-12 text-center text-slate-400">
                    No discounts found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((discount) => {
                  const isActive = discount.status === 'active';
                  const usageCount = discount.currentUsageCount || 0;
                  const maxUsage = discount.maxUsageCount;
                  const usagePercent = maxUsage ? Math.min(100, Math.round((usageCount / maxUsage) * 100)) : null;

                  return (
                    <tr key={discount._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded text-xs">
                            {discount.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(discount.code)}
                            className="text-slate-400 hover:text-indigo-600 transition"
                            title="Copy code"
                          >
                            {copiedCode === discount.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{discount.name}</div>
                        {discount.description && (
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{discount.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${
                            discount.type === 'percentage'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {discount.type === 'percentage' ? `${discount.value}% Off` : `₹${discount.value} Flat`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 space-y-0.5">
                        <div>Min Spend: <span className="font-semibold text-slate-800">₹{discount.minPurchaseAmount || 0}</span></div>
                        <div>Min Qty: <span className="font-semibold text-slate-800">{discount.minQuantity || 1} item(s)</span></div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {maxUsage ? (
                          <div>
                            <div className="flex items-center justify-between text-slate-600 mb-1">
                              <span>{usageCount} / {maxUsage}</span>
                              <span className="text-[10px] text-slate-400">{usagePercent}%</span>
                            </div>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  usagePercent >= 100 ? 'bg-rose-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">Unlimited</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {discount.startDate ? new Date(discount.startDate).toLocaleDateString() : 'Now'} →{' '}
                            {discount.endDate ? new Date(discount.endDate).toLocaleDateString() : 'Forever'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => canManage && handleToggleStatus(discount)}
                          disabled={!canManage}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                            </>
                          )}
                        </button>
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDiscount(discount);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Edit Discount"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDiscount(discount)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Discount"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discount Form Modal */}
      <DiscountFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDiscount={selectedDiscount}
        onSuccess={(msg) => {
          setToastMessage(msg);
          fetchDiscounts();
        }}
      />
    </div>
  );
};

export default DiscountManagement;

