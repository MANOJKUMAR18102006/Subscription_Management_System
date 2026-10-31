import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  User,
  Package,
  Calendar,
  AlertCircle,
  Tag,
  Check
} from 'lucide-react';
import api from '../../api/axiosInstance';

const InvoiceFormModal = ({ isOpen, onClose, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [dueDate, setDueDate] = useState('');
  const [billingFrequency, setBillingFrequency] = useState('Monthly');
  const [status, setStatus] = useState('Confirmed');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponFeedback, setCouponFeedback] = useState(null);

  // Line items
  const [lines, setLines] = useState([
    {
      product: '',
      name: '',
      variant: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 18,
      discount: 0
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchPrerequisites = async () => {
      try {
        setLoadingInitial(true);
        const [custRes, prodRes, taxRes] = await Promise.all([
          api.get('/users?role=customer'),
          api.get('/products?limit=100'),
          api.get('/taxes')
        ]);

        if (custRes.data.success) {
          setCustomers(custRes.data.users || []);
          if (custRes.data.users?.length > 0 && !customerId) {
            setCustomerId(custRes.data.users[0]._id);
          }
        }
        if (prodRes.data.success) {
          setProducts(prodRes.data.products || []);
        }
        if (taxRes.data.success) {
          setTaxes(taxRes.data.taxes || []);
        }
      } catch (err) {
        console.error('Error fetching prerequisites:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchPrerequisites();

    // Default due date: today + 30 days
    const due = new Date();
    due.setDate(due.getDate() + 30);
    setDueDate(due.toISOString().split('T')[0]);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProductSelect = (index, prodId) => {
    const selected = products.find((p) => p._id === prodId);
    const updated = [...lines];
    if (selected) {
      updated[index] = {
        ...updated[index],
        product: selected._id,
        name: selected.name,
        unitPrice: selected.salesPrice || 0,
        taxRate: 18,
        discount: 0
      };
    } else {
      updated[index] = {
        ...updated[index],
        product: '',
        name: ''
      };
    }
    setLines(updated);
  };

  const updateLine = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        product: '',
        name: '',
        variant: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
        discount: 0
      }
    ]);
  };

  const removeLine = (index) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Compute live totals
  let subtotal = 0;
  let taxTotal = 0;
  let lineDiscountTotal = 0;

  lines.forEach((l) => {
    const qty = Number(l.quantity) || 1;
    const price = Number(l.unitPrice) || 0;
    const disc = Number(l.discount) || 0;
    const taxR = Number(l.taxRate) || 0;

    const base = qty * price;
    const discAmt = base * (disc / 100);
    const net = base - discAmt;
    const taxAmt = net * (taxR / 100);

    subtotal += net;
    lineDiscountTotal += discAmt;
    taxTotal += taxAmt;
  });

  const grandTotal = Number((subtotal + taxTotal).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerId) {
      setError('Please select a customer for this invoice');
      return;
    }

    if (lines.length === 0 || !lines[0].name.trim()) {
      setError('Please add at least one line item with a valid name');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        customerId,
        invoiceLines: lines.map((l) => ({
          product: l.product || undefined,
          name: l.name.trim() || 'Service Line',
          variant: l.variant || '',
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
          taxRate: Number(l.taxRate) || 0,
          discount: Number(l.discount) || 0
        })),
        paymentTerms,
        dueDate,
        billingFrequency,
        status,
        notes,
        couponCode: couponCode.trim() || undefined
      };

      const res = await api.post('/invoices', payload);
      onSuccess(res.data.message || 'Invoice created successfully!');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invoice. Please check the line items.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Generate New Invoice</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Create an itemized invoice with automatic tax and discount calculations
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="Immediate">Immediate / Due on Receipt</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Billing Frequency
              </label>
              <select
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="Monthly">Monthly Cycle</option>
                <option value="Daily">Daily Cycle</option>
                <option value="Weekly">Weekly Cycle</option>
                <option value="Yearly">Yearly Cycle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="Confirmed">Confirmed (Issued & Ready for Payment)</option>
                <option value="Draft">Draft (Editable preliminary)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Apply Coupon Code (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. SAVE100"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-sm uppercase font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <Tag className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Invoice Line Items
              </h3>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2.5 w-1/4">Product / Item</th>
                    <th className="px-3 py-2.5 w-1/4">Line Description</th>
                    <th className="px-2 py-2.5 w-16 text-center">Qty</th>
                    <th className="px-2 py-2.5 w-24">Price (₹)</th>
                    <th className="px-2 py-2.5 w-20">Tax (%)</th>
                    <th className="px-2 py-2.5 w-20">Disc (%)</th>
                    <th className="px-3 py-2.5 w-24 text-right">Total (₹)</th>
                    <th className="px-2 py-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, idx) => {
                    const lineNet = line.quantity * line.unitPrice * (1 - line.discount / 100);
                    const lineTot = lineNet * (1 + line.taxRate / 100);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <select
                            value={line.product}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="w-full p-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Custom Item --</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} (₹{p.salesPrice})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Line item name"
                            value={line.name}
                            onChange={(e) => updateLine(idx, 'name', e.target.value)}
                            className="w-full p-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(idx, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-full p-1.5 text-xs text-center border border-slate-200 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={line.taxRate}
                            onChange={(e) => updateLine(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={line.discount}
                            onChange={(e) => updateLine(idx, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          ₹{lineTot.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          {lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                              className="text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Notes & Terms (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="Payment instructions, bank details, or remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 resize-none bg-white"
              />
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (Net):</span>
                <span className="font-mono font-semibold text-slate-700">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Line Discounts:</span>
                <span className="font-mono font-semibold text-amber-600">- ₹{lineDiscountTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Tax Amount:</span>
                <span className="font-mono font-semibold text-blue-600">+ ₹{taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-800 pt-2 border-t border-slate-200">
                <span>Invoice Total:</span>
                <span className="text-emerald-600 font-mono">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
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
              {loading ? 'Generating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceFormModal;

