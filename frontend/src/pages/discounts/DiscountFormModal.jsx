import React, { useState, useEffect } from 'react';
import { X, Tag, Percent, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import api from '../../api/axiosInstance';

const DiscountFormModal = ({ isOpen, onClose, onSuccess, initialDiscount = null }) => {
  const isEdit = Boolean(initialDiscount?._id);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: 10,
    minPurchaseAmount: 0,
    minQuantity: 1,
    maxUsageCount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialDiscount) {
      setFormData({
        name: initialDiscount.name || '',
        code: initialDiscount.code || '',
        type: initialDiscount.type || 'percentage',
        value: initialDiscount.value || 0,
        minPurchaseAmount: initialDiscount.minPurchaseAmount || 0,
        minQuantity: initialDiscount.minQuantity || 1,
        maxUsageCount: initialDiscount.maxUsageCount || '',
        startDate: initialDiscount.startDate ? new Date(initialDiscount.startDate).toISOString().split('T')[0] : '',
        endDate: initialDiscount.endDate ? new Date(initialDiscount.endDate).toISOString().split('T')[0] : '',
        status: initialDiscount.status || 'active',
        description: initialDiscount.description || ''
      });
    } else {
      setFormData({
        name: '',
        code: '',
        type: 'percentage',
        value: 15,
        minPurchaseAmount: 0,
        minQuantity: 1,
        maxUsageCount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'active',
        description: ''
      });
    }
    setError('');
  }, [initialDiscount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Discount name is required');
      return;
    }

    if (!formData.code.trim()) {
      setError('Discount coupon code is required');
      return;
    }

    if (Number(formData.value) <= 0) {
      setError('Discount value must be greater than zero');
      return;
    }

    if (formData.type === 'percentage' && Number(formData.value) > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
        minPurchaseAmount: Number(formData.minPurchaseAmount) || 0,
        minQuantity: Math.max(1, parseInt(formData.minQuantity, 10) || 1),
        maxUsageCount: formData.maxUsageCount !== '' ? parseInt(formData.maxUsageCount, 10) : null,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || null,
        status: formData.status,
        description: formData.description.trim()
      };

      if (isEdit) {
        await api.put(`/discounts/${initialDiscount._id}`, payload);
      } else {
        await api.post('/discounts', payload);
      }

      onSuccess(isEdit ? 'Discount updated successfully!' : 'Discount coupon created successfully!');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save discount. Please check input values.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? 'Edit Promotional Discount' : 'Create New Promotional Coupon'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set fixed or percentage savings, minimum purchase rules, and usage ceilings
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Promotion Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Festival Launch Promo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Coupon Code *
              </label>
              <input
                type="text"
                placeholder="e.g. FESTIVAL20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2 text-sm font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'percentage' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                    formData.type === 'percentage'
                      ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" /> Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'fixed' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                    formData.type === 'fixed'
                      ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" /> Flat (₹)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {formData.type === 'percentage' ? 'Discount Value (%) *' : 'Flat Amount (₹) *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={formData.type === 'percentage' ? '100' : undefined}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                  {formData.type === 'percentage' ? '%' : '₹'}
                </span>
              </div>
            </div>
          </div>

          {/* Eligibility Rules */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Purchase Rules & Eligibility
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Min Purchase (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                  placeholder="0 (None)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Min Quantity (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Max Redemptions
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUsageCount}
                  onChange={(e) => setFormData({ ...formData, maxUsageCount: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="active">Active (Available for checkout & invoices)</option>
              <option value="inactive">Inactive (Disabled)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Special festive promo code for enterprise clients"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-60 flex items-center gap-1.5"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Promotion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscountFormModal;

