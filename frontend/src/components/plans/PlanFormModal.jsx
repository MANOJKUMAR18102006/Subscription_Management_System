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
  ShieldAlert,
  Clock,
  Check,
  AlertTriangle,
  Info,
  DollarSign
} from 'lucide-react';

const PlanFormModal = ({ isOpen, onClose, onSaved, initialData = null }) => {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    linkedProducts: [],
    billingFrequency: 'Monthly',
    price: 3500,
    currency: 'INR',
    currencySymbol: '₹',
    minQuantity: 1,
    availableFrom: new Date().toISOString().split('T')[0],
    availableUntil: '',
    hasExpiryDate: false,
    autoClose: true,
    allowEarlyClosure: true,
    allowPause: true,
    allowRenewal: true,
    status: 'Active',
    features: ['Standard Entitlement Support', 'Full Platform Access']
  });

  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products to link
  useEffect(() => {
    if (isOpen) {
      const fetchProducts = async () => {
        try {
          setLoadingProducts(true);
          const res = await api.get('/products?limit=100');
          if (res.data.success) {
            setAvailableProducts(res.data.products || []);
          }
        } catch (err) {
          console.error('Failed to load products for plan:', err);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      const linked = Array.isArray(initialData.linkedProducts)
        ? initialData.linkedProducts.map((lp) => ({
            product: lp.product?._id || lp.product,
            productName: lp.product?.name || 'Product',
            minQuantity: lp.minQuantity || 1,
            isPrimary: Boolean(lp.isPrimary)
          }))
        : [];

      const availUntil = initialData.availableUntil
        ? new Date(initialData.availableUntil).toISOString().split('T')[0]
        : '';

      const availFrom = initialData.availableFrom
        ? new Date(initialData.availableFrom).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        linkedProducts: linked,
        billingFrequency: initialData.billingFrequency || 'Monthly',
        price: initialData.price !== undefined ? initialData.price : 0,
        currency: initialData.currency || 'INR',
        currencySymbol: initialData.currencySymbol || '₹',
        minQuantity: initialData.minQuantity || 1,
        availableFrom: availFrom,
        availableUntil: availUntil,
        hasExpiryDate: Boolean(availUntil),
        autoClose: initialData.autoClose !== undefined ? initialData.autoClose : true,
        allowEarlyClosure: initialData.allowEarlyClosure !== undefined ? initialData.allowEarlyClosure : true,
        allowPause: initialData.allowPause !== undefined ? initialData.allowPause : true,
        allowRenewal: initialData.allowRenewal !== undefined ? initialData.allowRenewal : true,
        status: initialData.status || 'Active',
        features: Array.isArray(initialData.features) && initialData.features.length > 0
          ? [...initialData.features]
          : ['Core Platform Access']
      });
    } else {
      setFormData({
        name: '',
        description: '',
        linkedProducts: [],
        billingFrequency: 'Monthly',
        price: 2500,
        currency: 'INR',
        currencySymbol: '₹',
        minQuantity: 1,
        availableFrom: new Date().toISOString().split('T')[0],
        availableUntil: '',
        hasExpiryDate: false,
        autoClose: true,
        allowEarlyClosure: true,
        allowPause: true,
        allowRenewal: true,
        status: 'Active',
        features: ['Standard Support SLA', 'Automated Daily Sync', 'Multi-user Workspace']
      });
    }
    setError('');
  }, [initialData, isOpen]);

  // Product linking toggle
  const handleToggleProduct = (product) => {
    const exists = formData.linkedProducts.find((p) => p.product === product._id);
    if (exists) {
      // Remove
      setFormData((prev) => ({
        ...prev,
        linkedProducts: prev.linkedProducts.filter((p) => p.product !== product._id)
      }));
    } else {
      // Add
      const isFirst = formData.linkedProducts.length === 0;
      setFormData((prev) => ({
        ...prev,
        linkedProducts: [
          ...prev.linkedProducts,
          {
            product: product._id,
            productName: product.name,
            minQuantity: 1,
            isPrimary: isFirst
          }
        ]
      }));
    }
  };

  const handleProductMinQtyChange = (productId, qty) => {
    setFormData((prev) => ({
      ...prev,
      linkedProducts: prev.linkedProducts.map((p) =>
        p.product === productId ? { ...p, minQuantity: Math.max(1, parseInt(qty, 10) || 1) } : p
      )
    }));
  };

  const handleSetPrimaryProduct = (productId) => {
    setFormData((prev) => ({
      ...prev,
      linkedProducts: prev.linkedProducts.map((p) => ({
        ...p,
        isPrimary: p.product === productId
      }))
    }));
  };

  // Features add/remove
  const handleAddFeature = () => {
    if (newFeatureInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeatureInput.trim()]
      }));
      setNewFeatureInput('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Quick date helper presets
  const handleQuickExpiryPreset = (days) => {
    const from = formData.availableFrom ? new Date(formData.availableFrom) : new Date();
    const target = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
    setFormData((prev) => ({
      ...prev,
      hasExpiryDate: true,
      availableUntil: target.toISOString().split('T')[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.name.trim()) {
      setError('Plan name is required.');
      return;
    }

    if (formData.price < 0) {
      setError('Price cannot be negative.');
      return;
    }

    if (formData.minQuantity < 1) {
      setError('Minimum quantity must be at least 1.');
      return;
    }

    if (formData.linkedProducts.length === 0) {
      setError('Requirement 1: You must link at least one product to this plan.');
      return;
    }

    if (formData.hasExpiryDate && formData.availableUntil) {
      const fromDate = new Date(formData.availableFrom);
      const untilDate = new Date(formData.availableUntil);
      if (untilDate < fromDate) {
        setError('Requirement 3: Available Until Date must be on or after Available From Date.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        linkedProducts: formData.linkedProducts.map((lp) => ({
          product: lp.product,
          minQuantity: lp.minQuantity,
          isPrimary: lp.isPrimary
        })),
        billingFrequency: formData.billingFrequency,
        price: Number(formData.price),
        currency: formData.currency,
        currencySymbol: formData.currencySymbol,
        minQuantity: Number(formData.minQuantity),
        availableFrom: formData.availableFrom,
        availableUntil: formData.hasExpiryDate && formData.availableUntil ? formData.availableUntil : null,
        autoClose: Boolean(formData.autoClose),
        allowEarlyClosure: Boolean(formData.allowEarlyClosure),
        allowPause: Boolean(formData.allowPause),
        allowRenewal: Boolean(formData.allowRenewal),
        status: formData.status,
        features: formData.features
      };

      let res;
      if (isEditing) {
        res = await api.put(`/plans/${initialData._id}`, payload);
      } else {
        res = await api.post('/plans', payload);
      }

      if (res.data.success) {
        onSaved(res.data.plan, isEditing ? 'Plan updated successfully' : 'Plan created successfully');
        onClose();
      }
    } catch (err) {
      console.error('Plan save error:', err);
      setError(err.response?.data?.message || 'Failed to save subscription plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? `Edit Plan: ${initialData?.name}` : 'Create Subscription Plan'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure products, billing frequencies, minimum order thresholds, and lifecycle permissions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Form (Left/Top) & Real-time Live Preview (Right/Bottom) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form Fields */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {isEditing && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Requirement 7 Notice:</strong> Existing subscribers will retain their agreed locked pricing even after this plan is updated.
                </span>
              </div>
            )}

            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                1. Plan Identity & Billing Cycle
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plan Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Enterprise Cloud Suite, Starter Pro"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description & Target Audience
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of who this plan is tailored for..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                {/* Billing Frequency */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billing Frequency <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.billingFrequency}
                    onChange={(e) => setFormData({ ...formData, billingFrequency: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  >
                    <option value="Daily">Daily (Every 24 hours)</option>
                    <option value="Weekly">Weekly (Every 7 days)</option>
                    <option value="Monthly">Monthly (Every 30 days)</option>
                    <option value="Yearly">Yearly (Every 365 days)</option>
                  </select>
                </div>

                {/* Base Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price per Billing Cycle (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={0}
                      step="any"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-semibold"
                    />
                  </div>
                </div>

                {/* Minimum Quantity (Requirement 2) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Subscriptions cannot order fewer units than this threshold.
                  </p>
                </div>

                {/* Plan Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="Active">Active (Open for subscriptions)</option>
                    <option value="Draft">Draft (Internal preparation)</option>
                    <option value="Inactive">Inactive (Temporarily suspended)</option>
                    <option value="Closed">Closed (Closed for new signups)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Linked Products (Requirement 1) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  2. Linked Products ({formData.linkedProducts.length} selected)
                </h3>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Requirement 1: 1+ Products
                </span>
              </div>

              {loadingProducts ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  Loading products catalog...
                </div>
              ) : availableProducts.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                  No products found. Please create products first.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                    {availableProducts.map((prod) => {
                      const isSelected = formData.linkedProducts.some((p) => p.product === prod._id);
                      return (
                        <div
                          key={prod._id}
                          onClick={() => handleToggleProduct(prod)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold truncate">{prod.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {prod.productType} • ₹{prod.salesPrice}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected products configuration list */}
                  {formData.linkedProducts.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-600">
                        Configure Selected Linked Products:
                      </p>
                      {formData.linkedProducts.map((lp) => (
                        <div
                          key={lp.product}
                          className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-slate-800 truncate">{lp.productName}</span>
                            {lp.isPrimary && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <label className="text-[10px] text-slate-500 flex items-center gap-1">
                              Min Qty:
                              <input
                                type="number"
                                min={1}
                                value={lp.minQuantity}
                                onChange={(e) => handleProductMinQtyChange(lp.product, e.target.value)}
                                className="w-12 px-1 py-0.5 text-center text-xs border border-slate-200 rounded bg-white"
                              />
                            </label>
                            {!lp.isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryProduct(lp.product)}
                                className="text-[10px] text-blue-600 hover:underline"
                              >
                                Set Primary
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Availability Dates & Auto-Close (Requirements 3 & 4) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                3. Availability Schedule & Auto Close
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Available From Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.availableFrom}
                    onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Available Until Date
                    </label>
                    <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasExpiryDate}
                        onChange={(e) => setFormData({ ...formData, hasExpiryDate: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      Enable End Date
                    </label>
                  </div>
                  <input
                    type="date"
                    disabled={!formData.hasExpiryDate}
                    value={formData.availableUntil}
                    onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-lg border ${
                      formData.hasExpiryDate
                        ? 'border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  />
                  {formData.hasExpiryDate && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-slate-400">Presets:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickExpiryPreset(30)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                      >
                        +30d
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickExpiryPreset(90)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                      >
                        +90d
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickExpiryPreset(365)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                      >
                        +1 yr
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement 4: Auto Close Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Auto Close on Expiration (Requirement 4)
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Automatically transition plan to 'Closed' when Available Until Date passes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoClose}
                  onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Section 4: Lifecycle Policies (Requirement 5) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                4. Contract Lifecycle Permissions (Requirement 5)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Allow Early Closure */}
                <div
                  onClick={() => setFormData({ ...formData, allowEarlyClosure: !formData.allowEarlyClosure })}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    formData.allowEarlyClosure
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/60 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Early Closure</span>
                    <input
                      type="checkbox"
                      checked={formData.allowEarlyClosure}
                      onChange={() => {}}
                      className="rounded text-emerald-600 pointer-events-none"
                    />
                  </div>
                  <p className="text-[10px] opacity-80">
                    {formData.allowEarlyClosure ? 'Allowed before period end' : 'Prohibited by contract'}
                  </p>
                </div>

                {/* Allow Pause */}
                <div
                  onClick={() => setFormData({ ...formData, allowPause: !formData.allowPause })}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    formData.allowPause
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/60 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Allow Pause</span>
                    <input
                      type="checkbox"
                      checked={formData.allowPause}
                      onChange={() => {}}
                      className="rounded text-emerald-600 pointer-events-none"
                    />
                  </div>
                  <p className="text-[10px] opacity-80">
                    {formData.allowPause ? 'Permit temporary hold' : 'Pausing restricted'}
                  </p>
                </div>

                {/* Allow Renewal */}
                <div
                  onClick={() => setFormData({ ...formData, allowRenewal: !formData.allowRenewal })}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    formData.allowRenewal
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/60 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Allow Renewal</span>
                    <input
                      type="checkbox"
                      checked={formData.allowRenewal}
                      onChange={() => {}}
                      className="rounded text-emerald-600 pointer-events-none"
                    />
                  </div>
                  <p className="text-[10px] opacity-80">
                    {formData.allowRenewal ? 'Recurring renewal on' : 'Expires at term'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: Feature Entitlements */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                5. Feature Entitlements Checklist
              </h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  placeholder="e.g. 24/7 Dedicated Support, 100k API Requests"
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {formData.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200"
                  >
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving Plan...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    {isEditing ? 'Update Subscription Plan' : 'Publish Subscription Plan'}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Column: Real-time Interactive Live Preview Card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-2xl text-white shadow-xl flex flex-col justify-between border border-slate-800 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800/60">
                  Live Preview Card
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    formData.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {formData.status}
                </span>
              </div>

              <h4 className="text-xl font-extrabold text-white tracking-tight">
                {formData.name || 'Untitled Plan'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {formData.description || 'Provide plan details and target audience overview...'}
              </p>

              {/* Price Tag */}
              <div className="mt-5 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xs">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">
                    ₹{Number(formData.price || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    / {formData.billingFrequency}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300 border-t border-slate-700/50 pt-2">
                  <span>Minimum Quantity:</span>
                  <span className="font-bold text-blue-400">{formData.minQuantity} unit(s)</span>
                </div>
              </div>

              {/* Linked Products Preview */}
              <div className="mt-4 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Linked Products ({formData.linkedProducts.length}):
                </p>
                {formData.linkedProducts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No products selected yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.linkedProducts.map((lp) => (
                      <span
                        key={lp.product}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1"
                      >
                        <Package className="w-3 h-3 text-blue-400" />
                        {lp.productName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Lifecycle Permissions Pillbox */}
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px]">
                <div
                  className={`p-2 rounded-lg border ${
                    formData.allowEarlyClosure
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  }`}
                >
                  <p className="font-bold">Early Close</p>
                  <p>{formData.allowEarlyClosure ? 'Allowed' : 'Prohibited'}</p>
                </div>
                <div
                  className={`p-2 rounded-lg border ${
                    formData.allowPause
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  }`}
                >
                  <p className="font-bold">Pause</p>
                  <p>{formData.allowPause ? 'Allowed' : 'Prohibited'}</p>
                </div>
                <div
                  className={`p-2 rounded-lg border ${
                    formData.allowRenewal
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  }`}
                >
                  <p className="font-bold">Renewal</p>
                  <p>{formData.allowRenewal ? 'Allowed' : 'Prohibited'}</p>
                </div>
              </div>

              {/* Features List */}
              <div className="mt-5 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Entitlements & Features:
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {formData.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Availability Badge */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Availability:</span>
              <span className="text-white font-medium">
                {formData.hasExpiryDate && formData.availableUntil
                  ? `${formData.availableFrom} → ${formData.availableUntil}`
                  : `From ${formData.availableFrom} (Perpetual)`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanFormModal;
