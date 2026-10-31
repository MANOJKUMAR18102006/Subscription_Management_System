import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import {
  X,
  Plus,
  Trash2,
  Package,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  User,
  CreditCard,
  Percent,
  Clock,
  ShieldCheck,
  Tag
} from 'lucide-react';

const TAX_RATES = [
  { label: '0% (Tax Exempt)', value: 0 },
  { label: '5% (GST 5%)', value: 5 },
  { label: '12% (GST 12%)', value: 12 },
  { label: '18% (Standard 18%)', value: 18 },
  { label: '28% (Luxury 28%)', value: 28 }
];

const PAYMENT_TERMS_OPTIONS = ['Immediate', 'Net 15', 'Net 30', 'Net 60', 'Due on Receipt'];
const BILLING_FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

const SubscriptionFormModal = ({ isOpen, onClose, onSaved, initialData = null }) => {
  const isEditing = !!initialData;

  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [billingFrequency, setBillingFrequency] = useState('Monthly');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState('Draft');

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

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      setError('');
      loadDependencies();

      if (initialData) {
        setSelectedCustomerId(initialData.customerId?._id || initialData.customerId || '');
        setSelectedPlanId(initialData.planId?._id || initialData.planId || '');
        setBillingFrequency(initialData.billingFrequency || 'Monthly');
        setPaymentTerms(initialData.paymentTerms || 'Net 30');
        setStartDate(
          initialData.startDate
            ? new Date(initialData.startDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
        );
        setExpiryDate(
          initialData.expiryDate
            ? new Date(initialData.expiryDate).toISOString().split('T')[0]
            : ''
        );
        setStatus(initialData.status || 'Draft');

        if (Array.isArray(initialData.subscriptionLines) && initialData.subscriptionLines.length > 0) {
          setLines(
            initialData.subscriptionLines.map((l) => ({
              product: l.product?._id || l.product || '',
              name: l.name || '',
              variant: l.variant || '',
              quantity: l.quantity || 1,
              unitPrice: l.unitPrice || 0,
              taxRate: l.taxRate !== undefined ? l.taxRate : 18,
              discount: l.discount || 0
            }))
          );
        }
      } else {
        // Defaults for new subscription
        setSelectedCustomerId('');
        setSelectedPlanId('');
        setBillingFrequency('Monthly');
        setPaymentTerms('Net 30');
        const today = new Date();
        setStartDate(today.toISOString().split('T')[0]);
        const oneYear = new Date(today);
        oneYear.setFullYear(oneYear.getFullYear() + 1);
        setExpiryDate(oneYear.toISOString().split('T')[0]);
        setStatus('Draft');
        setLines([
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
      }
    }
  }, [isOpen, initialData]);

  const loadDependencies = async () => {
    try {
      setLoadingData(true);
      const [usersRes, plansRes, prodsRes] = await Promise.all([
        api.get('/users?limit=100'),
        api.get('/plans?status=Active&limit=100'),
        api.get('/products?status=Active&limit=100')
      ]);

      if (usersRes.data.success) {
        const allUsers = usersRes.data.users || usersRes.data.data || [];
        setCustomers(allUsers.filter((u) => u.role === 'customer' || !u.role));
      }
      if (plansRes.data.success) {
        setPlans(plansRes.data.plans || []);
      }
      if (prodsRes.data.success) {
        setProducts(prodsRes.data.products || prodsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load dependencies:', err);
      setError('Could not load customer, plan, or product catalog dependencies.');
    } finally {
      setLoadingData(false);
    }
  };

  // When a plan is picked, auto-populate terms & default lines
  const handlePlanChange = (planId) => {
    setSelectedPlanId(planId);
    if (!planId) return;

    const plan = plans.find((p) => p._id === planId);
    if (plan) {
      if (plan.billingFrequency) setBillingFrequency(plan.billingFrequency);

      // Auto populate linked products if available
      if (Array.isArray(plan.linkedProducts) && plan.linkedProducts.length > 0) {
        const newLines = plan.linkedProducts.map((lp) => {
          const prodObj = lp.product?._id ? lp.product : products.find((pr) => pr._id === (lp.product?._id || lp.product));
          return {
            product: prodObj?._id || lp.product?._id || lp.product,
            name: prodObj?.name || lp.productName || 'Linked Product',
            variant: '',
            quantity: lp.minQuantity || plan.minQuantity || 1,
            unitPrice: prodObj?.salesPrice || plan.price || 0,
            taxRate: 18,
            discount: 0
          };
        });
        setLines(newLines);
      } else if (products.length > 0) {
        setLines([
          {
            product: products[0]._id,
            name: products[0].name,
            variant: '',
            quantity: plan.minQuantity || 1,
            unitPrice: plan.price || products[0].salesPrice || 0,
            taxRate: 18,
            discount: 0
          }
        ]);
      }
    }
  };

  // Subscription lines manipulation
  const handleAddLine = () => {
    const defaultProd = products[0];
    setLines([
      ...lines,
      {
        product: defaultProd ? defaultProd._id : '',
        name: defaultProd ? defaultProd.name : '',
        variant: '',
        quantity: 1,
        unitPrice: defaultProd ? defaultProd.salesPrice : 0,
        taxRate: 18,
        discount: 0
      }
    ]);
  };

  const handleRemoveLine = (index) => {
    if (lines.length <= 1) {
      setError('A subscription must have at least one product line.');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;

    if (field === 'product') {
      const prod = products.find((p) => p._id === value);
      if (prod) {
        updated[index].name = prod.name;
        updated[index].unitPrice = prod.salesPrice || 0;
      }
    }

    setLines(updated);
  };

  // Calculate live financial figures
  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    lines.forEach((line) => {
      const qty = Number(line.quantity) || 1;
      const unit = Number(line.unitPrice) || 0;
      const discPercent = Number(line.discount) || 0;
      const taxRate = Number(line.taxRate) || 0;

      const base = qty * unit;
      const lineDisc = base * (discPercent / 100);
      const lineNet = base - lineDisc;
      const lineTax = lineNet * (taxRate / 100);

      subtotal += lineNet;
      taxTotal += lineTax;
      discountTotal += lineDisc;
    });

    const totalAmount = Number((subtotal + taxTotal).toFixed(2));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discountTotal.toFixed(2)),
      taxAmount: Number(taxTotal.toFixed(2)),
      totalAmount
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer for this subscription.');
      return;
    }

    if (lines.length === 0) {
      setError('Please add at least one product line item.');
      return;
    }

    // Check line validity
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!l.product) {
        setError(`Line #${i + 1} is missing a product selection.`);
        return;
      }
      if (Number(l.quantity) < 1) {
        setError(`Line #${i + 1} quantity must be at least 1.`);
        return;
      }
    }

    // Check plan min quantity if plan selected
    if (selectedPlanId) {
      const plan = plans.find((p) => p._id === selectedPlanId);
      if (plan && plan.minQuantity) {
        const totalQty = lines.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);
        if (totalQty < plan.minQuantity) {
          setError(`Plan '${plan.name}' requires a minimum quantity of ${plan.minQuantity}. Your lines sum to ${totalQty}.`);
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        customerId: selectedCustomerId,
        planId: selectedPlanId || undefined,
        billingFrequency,
        paymentTerms,
        startDate,
        expiryDate: expiryDate || undefined,
        status,
        subscriptionLines: lines.map((l) => ({
          product: l.product,
          name: l.name,
          variant: l.variant || '',
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
          taxRate: Number(l.taxRate) || 0,
          discount: Number(l.discount) || 0
        }))
      };

      let res;
      if (isEditing) {
        res = await api.put(`/subscriptions/${initialData._id}`, payload);
      } else {
        res = await api.post('/subscriptions', payload);
      }

      if (res.data.success) {
        onSaved(res.data.subscription);
        onClose();
      }
    } catch (err) {
      console.error('Subscription save failed:', err);
      setError(err.response?.data?.message || 'Failed to save subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-lg text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {isEditing ? `Edit Subscription ${initialData?.subscriptionNumber || ''}` : 'Create Direct Subscription'}
              </h2>
              <p className="text-xs text-slate-400">
                Setup a multi-product subscription contract with locked pricing, tax rates, and lifecycle terms.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Section 1: Customer & Plan Association */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Customer Account <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.company ? `(${c.company})` : ''} - {c.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Link Subscription Plan (Optional)
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- Custom Subscription (No Linked Plan) --</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} - ₹{p.price}/{p.billingFrequency} (Min Qty: {p.minQuantity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Contract Schedule & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
              </input>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
              </input>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Billing Frequency
              </label>
              <select
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {BILLING_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {PAYMENT_TERMS_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Selection */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="font-bold text-slate-700 text-xs">Contract Stage / Initial Status:</span>
            {['Draft', 'Confirmed', 'Active'].map((s) => (
              <label key={s} className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={status.toLowerCase() === s.toLowerCase()}
                  onChange={() => setStatus(s)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{s}</span>
              </label>
            ))}
          </div>

          {/* Section 3: Subscription Lines Table (Requirement 4) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600" /> Subscription Lines & Products
                </h3>
                <p className="text-[11px] text-slate-400">
                  Multiple products and variants with individual unit pricing, taxes, and discount rates.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Line
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[180px]">Product</th>
                    <th className="py-2.5 px-3 min-w-[110px]">Variant</th>
                    <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-24">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 w-28">Tax Rate</th>
                    <th className="py-2.5 px-3 w-20">Disc (%)</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                    <th className="py-2.5 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {lines.map((line, idx) => {
                    const lineBase = (Number(line.quantity) || 1) * (Number(line.unitPrice) || 0);
                    const lineDiscAmt = lineBase * ((Number(line.discount) || 0) / 100);
                    const lineNet = lineBase - lineDiscAmt;
                    const lineTaxAmt = lineNet * ((Number(line.taxRate) || 0) / 100);
                    const lineTotal = lineNet + lineTaxAmt;

                    const prodObj = products.find((p) => p._id === line.product);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        {/* Product Picker */}
                        <td className="py-2 px-3">
                          <select
                            value={line.product}
                            onChange={(e) => handleLineChange(idx, 'product', e.target.value)}
                            required
                            className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Select Product --</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} (₹{p.salesPrice})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Variant */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="e.g. Cloud, 64GB"
                            value={line.variant}
                            onChange={(e) => handleLineChange(idx, 'variant', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                            required
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-center text-slate-800 font-bold focus:outline-none"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                            required
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-bold focus:outline-none"
                          />
                        </td>

                        {/* Tax Rate */}
                        <td className="py-2 px-3">
                          <select
                            value={line.taxRate}
                            onChange={(e) => handleLineChange(idx, 'taxRate', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:outline-none"
                          >
                            {TAX_RATES.map((tr) => (
                              <option key={tr.value} value={tr.value}>
                                {tr.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Discount */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={line.discount}
                            onChange={(e) => handleLineChange(idx, 'discount', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 focus:outline-none"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="py-2 px-3 text-right font-black text-slate-900">
                          ₹{Number(lineTotal).toFixed(2)}
                        </td>

                        {/* Delete Button */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            disabled={lines.length <= 1}
                            className="text-slate-400 hover:text-rose-600 p-1 disabled:opacity-20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Live Totals & Summary Card */}
          <div className="flex flex-col sm:flex-row justify-end items-end gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal (Net):</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Total Discounts:</span>
                <span>- ₹{totals.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Total Applicable Taxes:</span>
                <span>+ ₹{totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm">Grand Recurring Total:</span>
                <span className="font-black text-base text-blue-600">₹{totals.totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-slate-400 text-right">
                Billed {billingFrequency} under payment terms {paymentTerms}.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Create Subscription'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionFormModal;

