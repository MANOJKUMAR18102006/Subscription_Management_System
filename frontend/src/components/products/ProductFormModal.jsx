import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Package,
  DollarSign,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Tag,
  Calculator
} from 'lucide-react';

const ProductFormModal = ({ isOpen, onClose, onSaved, initialData = null }) => {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: '',
    productType: 'Software',
    salesPrice: 2000,
    costPrice: 1200,
    currency: 'INR',
    currencySymbol: '₹',
    description: '',
    image: '',
    status: 'Active',
    variants: [
      {
        name: 'Brand',
        options: [
          { value: 'Odoo', additionalPrice: 560, sku: '' }
        ]
      }
    ]
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live preview interactive state
  const [previewSelections, setPreviewSelections] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        productType: initialData.productType || 'Software',
        salesPrice: initialData.salesPrice !== undefined ? initialData.salesPrice : 0,
        costPrice: initialData.costPrice !== undefined ? initialData.costPrice : 0,
        currency: initialData.currency || 'INR',
        currencySymbol: initialData.currencySymbol || '₹',
        description: initialData.description || '',
        image: initialData.image || '',
        status: initialData.status || 'Active',
        variants: Array.isArray(initialData.variants) && initialData.variants.length > 0
          ? initialData.variants.map((v) => ({
              name: v.name,
              options: Array.isArray(v.options)
                ? v.options.map((o) => ({
                    value: o.value,
                    additionalPrice: o.additionalPrice || 0,
                    sku: o.sku || ''
                  }))
                : []
            }))
          : []
      });
    } else {
      setFormData({
        name: '',
        productType: 'Software',
        salesPrice: 2000,
        costPrice: 1200,
        currency: 'INR',
        currencySymbol: '₹',
        description: '',
        image: '',
        status: 'Active',
        variants: [
          {
            name: 'Brand',
            options: [
              { value: 'Odoo', additionalPrice: 560, sku: '' }
            ]
          }
        ]
      });
    }
    setError('');
  }, [initialData, isOpen]);

  // Update preview selection default when variants change
  useEffect(() => {
    const defaultSelections = {};
    formData.variants.forEach((v) => {
      if (v.name && v.options && v.options.length > 0) {
        defaultSelections[v.name] = v.options[0].value;
      }
    });
    setPreviewSelections(defaultSelections);
  }, [formData.variants]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Variant operations
  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: '',
          options: [{ value: '', additionalPrice: 0, sku: '' }]
        }
      ]
    }));
  };

  const handleRemoveVariant = (variantIndex) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== variantIndex)
    }));
  };

  const handleVariantNameChange = (variantIndex, newName) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[variantIndex].name = newName;
      return { ...prev, variants: updated };
    });
  };

  // Option operations
  const handleAddOption = (variantIndex) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[variantIndex].options.push({ value: '', additionalPrice: 0, sku: '' });
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveOption = (variantIndex, optionIndex) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[variantIndex].options = updated[variantIndex].options.filter((_, idx) => idx !== optionIndex);
      return { ...prev, variants: updated };
    });
  };

  const handleOptionChange = (variantIndex, optionIndex, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[variantIndex].options[optionIndex][field] =
        field === 'additionalPrice' ? Math.max(0, Number(value) || 0) : value;
      return { ...prev, variants: updated };
    });
  };

  // Compute live preview price
  const calculateLivePrice = () => {
    const base = Number(formData.salesPrice) || 0;
    let additional = 0;

    formData.variants.forEach((v) => {
      const selectedVal = previewSelections[v.name];
      if (selectedVal) {
        const option = v.options.find((o) => o.value === selectedVal);
        if (option) {
          additional += Number(option.additionalPrice) || 0;
        }
      }
    });

    return {
      base,
      additional,
      total: base + additional
    };
  };

  const liveCalculation = calculateLivePrice();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Product Name is required');
      return;
    }

    if (formData.salesPrice === '' || Number(formData.salesPrice) < 0) {
      setError('Sales Price must be a valid positive amount');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaved(formData, initialData?._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {isEditing ? 'Edit Product' : 'Create New Product'}
              </h2>
              <p className="text-xs text-slate-400">
                Module 3: Manage product details, multiple variants, and automatic price calculations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Business Software, Cloud CRM Suite"
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium bg-white"
              >
                <option value="Software">Software</option>
                <option value="Service">Service</option>
                <option value="Add-on">Add-on</option>
                <option value="Subscription Plan">Subscription Plan</option>
                <option value="Hardware">Hardware</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium bg-white"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived (Safe for existing subscriptions)</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Sales Price & Cost Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Sales Price ({formData.currencySymbol}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  {formData.currencySymbol}
                </span>
                <input
                  type="number"
                  name="salesPrice"
                  value={formData.salesPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="2000"
                  className="w-full pl-8 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost Price ({formData.currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  {formData.currencySymbol}
                </span>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="1200"
                  className="w-full pl-8 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Image URL (Optional)
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/product-image.jpg"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Notes
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                placeholder="Detailed specifications, included entitlements, and notes..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Product Variants & Options Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Product Variants & Option Pricing</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Add variants (e.g., Brand, Edition, Tier) with option values and additional prices.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            {formData.variants.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400">
                No variants added yet. Click &quot;Add Variant&quot; above to create options like Brand, Edition, or Storage.
              </div>
            ) : (
              <div className="space-y-3.5">
                {formData.variants.map((variant, vIdx) => (
                  <div
                    key={vIdx}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => handleVariantNameChange(vIdx, e.target.value)}
                          placeholder="Variant Name (e.g. Brand, Edition, Category)"
                          required
                          className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(vIdx)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Options Table inside Variant */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                        <div className="col-span-5">Option Value (e.g. Odoo, SAP)</div>
                        <div className="col-span-4">Additional Price ({formData.currencySymbol})</div>
                        <div className="col-span-2">SKU (Opt)</div>
                        <div className="col-span-1 text-right">Del</div>
                      </div>

                      {variant.options.map((opt, oIdx) => (
                        <div key={oIdx} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <input
                              type="text"
                              value={opt.value}
                              onChange={(e) => handleOptionChange(vIdx, oIdx, 'value', e.target.value)}
                              placeholder="e.g. Odoo"
                              required
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div className="col-span-4 relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                              {formData.currencySymbol}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={opt.additionalPrice}
                              onChange={(e) => handleOptionChange(vIdx, oIdx, 'additionalPrice', e.target.value)}
                              placeholder="560"
                              className="w-full pl-6 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                            />
                          </div>

                          <div className="col-span-2">
                            <input
                              type="text"
                              value={opt.sku}
                              onChange={(e) => handleOptionChange(vIdx, oIdx, 'sku', e.target.value)}
                              placeholder="SKU-1"
                              className="w-full px-2 py-1.5 text-[11px] border border-slate-300 rounded-lg bg-white focus:outline-none"
                            />
                          </div>

                          <div className="col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(vIdx, oIdx)}
                              disabled={variant.options.length <= 1}
                              className="text-slate-400 hover:text-red-500 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddOption(vIdx)}
                        className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Option Value</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Automatic Final Price Live Demonstration Widget */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Automatic Price Calculator Preview
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Live Calculation
              </span>
            </div>

            {/* Selector simulation */}
            {formData.variants.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {formData.variants.map((v) => (
                  <div key={v.name} className="flex items-center justify-between bg-white/10 px-3 py-1.5 rounded-xl">
                    <span className="text-slate-300 font-medium">{v.name}:</span>
                    <select
                      value={previewSelections[v.name] || ''}
                      onChange={(e) =>
                        setPreviewSelections((prev) => ({ ...prev, [v.name]: e.target.value }))
                      }
                      className="bg-slate-800 text-white text-xs border border-slate-700 rounded-lg px-2 py-0.5 focus:outline-none"
                    >
                      {v.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value} (+{formData.currencySymbol}{opt.additionalPrice})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Calculation summary matching prompt's example */}
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-slate-300 flex items-center gap-2 flex-wrap">
                <span>Base: <strong>{formData.currencySymbol}{liveCalculation.base}</strong></span>
                <span>+</span>
                <span>Variant Add: <strong className="text-emerald-400">+{formData.currencySymbol}{liveCalculation.additional}</strong></span>
                <span>=</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block uppercase text-[10px] font-semibold">
                  Final Product Price
                </span>
                <span className="text-xl font-extrabold text-emerald-400">
                  {formData.currencySymbol}{liveCalculation.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Save Product Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;

