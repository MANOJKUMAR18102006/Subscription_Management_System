import React, { useState, useEffect } from 'react';
import { X, Percent, DollarSign, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/axiosInstance';

const TaxFormModal = ({ isOpen, onClose, onSuccess, initialTax = null }) => {
  const isEdit = Boolean(initialTax?._id);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage',
    rate: 0,
    description: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveUntil: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTax) {
      setFormData({
        name: initialTax.name || '',
        code: initialTax.code || '',
        type: initialTax.type || 'percentage',
        rate: initialTax.rate || 0,
        description: initialTax.description || '',
        effectiveFrom: initialTax.effectiveFrom ? new Date(initialTax.effectiveFrom).toISOString().split('T')[0] : '',
        effectiveUntil: initialTax.effectiveUntil ? new Date(initialTax.effectiveUntil).toISOString().split('T')[0] : '',
        status: initialTax.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        code: '',
        type: 'percentage',
        rate: 18,
        description: '',
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveUntil: '',
        status: 'active'
      });
    }
    setError('');
  }, [initialTax, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Tax rule name is required');
      return;
    }

    if (!formData.code.trim()) {
      setError('Tax code is required (e.g., GST_18)');
      return;
    }

    if (Number(formData.rate) < 0) {
      setError('Tax rate/amount cannot be negative');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        rate: Number(formData.rate),
        description: formData.description.trim(),
        effectiveFrom: formData.effectiveFrom || undefined,
        effectiveUntil: formData.effectiveUntil || null,
        status: formData.status
      };

      if (isEdit) {
        await api.put(`/taxes/${initialTax._id}`, payload);
      } else {
        await api.post('/taxes', payload);
      }

      onSuccess(isEdit ? 'Tax rule updated successfully!' : 'Tax rule created successfully!');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save tax rule. Please check input values.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? 'Edit Tax Rule' : 'Create New Tax Rule'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure tax calculation rate, type, and effective dates
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
                Tax Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Standard GST 18%"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tax Code *
              </label>
              <input
                type="text"
                placeholder="e.g. GST18"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2 text-sm uppercase font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tax Type
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
                  <DollarSign className="w-3.5 h-3.5" /> Fixed (₹)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {formData.type === 'percentage' ? 'Tax Rate (%) *' : 'Fixed Amount (₹) *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                  {formData.type === 'percentage' ? '%' : '₹'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Effective From
              </label>
              <input
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Effective Until (Optional)
              </label>
              <input
                type="date"
                value={formData.effectiveUntil}
                onChange={(e) => setFormData({ ...formData, effectiveUntil: e.target.value })}
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
              <option value="active">Active (Applied to Invoices)</option>
              <option value="inactive">Inactive (Disabled)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Standard Goods & Services Tax under Section 9"
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
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Tax Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaxFormModal;

