import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import {
  Sliders,
  Plus,
  ArrowLeft,
  FileText,
  Edit,
  Trash2,
  Sparkles,
  Layers,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

const QuotationTemplates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const canManage = isAdmin || isStaff;

  const [templates, setTemplates] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formValidity, setFormValidity] = useState(30);
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 30');
  const [formDefaultTax, setFormDefaultTax] = useState(18);
  const [formDefaultQty, setFormDefaultQty] = useState(1);
  const [formSelectedProducts, setFormSelectedProducts] = useState([]);
  const [formSelectedPlans, setFormSelectedPlans] = useState([]);
  const [formTerms, setFormTerms] = useState(
    '1. Quotation is valid until the specified expiry date.\n2. Payment terms as agreed above.\n3. Taxes applicable as per statutory rates.'
  );
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const [tplRes, prodRes, planRes] = await Promise.all([
        api.get('/quotation-templates'),
        api.get('/products?limit=100').catch(() => ({ data: { products: [] } })),
        api.get('/plans?limit=100').catch(() => ({ data: { plans: [] } }))
      ]);

      if (tplRes.data.success) {
        setTemplates(tplRes.data.data);
      }
      if (prodRes.data?.products) setAvailableProducts(prodRes.data.products);
      if (planRes.data?.plans) setAvailablePlans(planRes.data.plans);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err.response?.data?.message || 'Failed to load quotation templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormDesc('');
    setFormValidity(30);
    setFormPaymentTerms('Net 30');
    setFormDefaultTax(18);
    setFormDefaultQty(1);
    setFormSelectedProducts([]);
    setFormSelectedPlans([]);
    setFormTerms(
      '1. Quotation is valid until the specified expiry date.\n2. Payment terms as agreed above.\n3. Taxes applicable as per statutory rates.'
    );
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (tpl) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name || '');
    setFormDesc(tpl.description || '');
    setFormValidity(tpl.validityDuration || 30);
    setFormPaymentTerms(tpl.paymentTerms || 'Net 30');
    setFormDefaultTax(tpl.defaultTaxes !== undefined ? tpl.defaultTaxes : 18);
    setFormDefaultQty(tpl.defaultQuantities || 1);
    setFormSelectedProducts(
      tpl.selectedProducts?.map((sp) => ({
        product: sp.product?._id || sp.product,
        defaultQuantity: sp.defaultQuantity || 1,
        unitPrice: sp.unitPrice || 0,
        defaultTaxRate: sp.defaultTaxRate || 18,
        defaultDiscount: sp.defaultDiscount || 0
      })) || []
    );
    setFormSelectedPlans(
      tpl.selectedPlans?.map((spl) => ({
        plan: spl.plan?._id || spl.plan,
        defaultQuantity: spl.defaultQuantity || 1,
        unitPrice: spl.unitPrice || 0,
        billingFrequency: spl.billingFrequency || 'Monthly',
        defaultTaxRate: spl.defaultTaxRate || 18,
        defaultDiscount: spl.defaultDiscount || 0
      })) || []
    );
    setFormTerms(tpl.termsAndConditions || '');
    setFormIsActive(tpl.isActive !== undefined ? tpl.isActive : true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddProductToForm = (prodId) => {
    if (!prodId) return;
    const prod = availableProducts.find((p) => p._id === prodId);
    if (!prod) return;
    setFormSelectedProducts([
      ...formSelectedProducts,
      {
        product: prod._id,
        defaultQuantity: formDefaultQty || 1,
        unitPrice: prod.salesPrice || 0,
        defaultTaxRate: formDefaultTax || 18,
        defaultDiscount: 0
      }
    ]);
  };

  const handleAddPlanToForm = (planId) => {
    if (!planId) return;
    const plan = availablePlans.find((p) => p._id === planId);
    if (!plan) return;
    setFormSelectedPlans([
      ...formSelectedPlans,
      {
        plan: plan._id,
        defaultQuantity: formDefaultQty || 1,
        unitPrice: plan.price || 0,
        billingFrequency: plan.billingFrequency || 'Monthly',
        defaultTaxRate: formDefaultTax || 18,
        defaultDiscount: 0
      }
    ]);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Template Name is required');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const payload = {
        name: formName.trim(),
        description: formDesc.trim(),
        validityDuration: Number(formValidity) || 30,
        paymentTerms: formPaymentTerms,
        defaultTaxes: Number(formDefaultTax) || 18,
        defaultQuantities: Number(formDefaultQty) || 1,
        selectedProducts: formSelectedProducts,
        selectedPlans: formSelectedPlans,
        termsAndConditions: formTerms,
        isActive: formIsActive
      };

      if (editingTemplate) {
        await api.put(`/quotation-templates/${editingTemplate._id}`, payload);
      } else {
        await api.post('/quotation-templates', payload);
      }

      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      await api.delete(`/quotation-templates/${id}`);
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete template');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-6 h-6 text-blue-600" />
              Quotation Templates
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Reusable presets with default products, subscription plans, taxes, and validity terms.
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        )}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Sparkles className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm">Loading quotation templates...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-600 bg-white rounded-xl border border-slate-200">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <Sliders className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Templates Defined</h3>
          <p className="text-sm text-slate-500 mt-1">
            Create templates to standardize customer proposals and speed up quotation generation.
          </p>
          {canManage && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Quotation Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl._id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base leading-snug">{tpl.name}</h3>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold ${
                      tpl.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tpl.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {tpl.description || 'No description provided.'}
                </p>

                {/* Preconfigured specs */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Validity Window:</span>
                    <span className="font-semibold text-slate-900">{tpl.validityDuration} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Terms:</span>
                    <span className="font-semibold text-slate-900">{tpl.paymentTerms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Default GST Tax:</span>
                    <span className="font-semibold text-slate-900">{tpl.defaultTaxes || 18}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Preset Items:</span>
                    <span className="font-semibold text-blue-600">
                      {(tpl.selectedPlans?.length || 0) + (tpl.selectedProducts?.length || 0)} Items
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => navigate('/quotations/new')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Use Template
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(tpl)}
                    title="Edit Template"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteTemplate(tpl._id, tpl.name)}
                      title="Delete Template"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                {editingTemplate ? 'Edit Quotation Template' : 'New Quotation Template'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Enterprise Cloud Offer"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Internal summary of offer package..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={formValidity}
                    onChange={(e) => setFormValidity(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={formPaymentTerms}
                    onChange={(e) => setFormPaymentTerms(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={formDefaultTax}
                    onChange={(e) => setFormDefaultTax(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={formDefaultQty}
                    onChange={(e) => setFormDefaultQty(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 text-center"
                  />
                </div>
              </div>

              {/* Preconfigured Plans */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Add Preconfigured Plans ({formSelectedPlans.length})
                  </label>
                  <select
                    onChange={(e) => {
                      handleAddPlanToForm(e.target.value);
                      e.target.value = '';
                    }}
                    className="text-xs border border-slate-300 rounded px-2 py-1"
                  >
                    <option value="">+ Add Subscription Plan</option>
                    {availablePlans.map((pl) => (
                      <option key={pl._id} value={pl._id}>
                        {pl.name} (₹{pl.price})
                      </option>
                    ))}
                  </select>
                </div>

                {formSelectedPlans.map((spl, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-200"
                  >
                    <span className="font-semibold text-slate-800">
                      {availablePlans.find((p) => p._id === spl.plan)?.name || 'Plan Item'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span>₹{spl.unitPrice}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormSelectedPlans(formSelectedPlans.filter((_, i) => i !== idx))
                        }
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preconfigured Products */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Add Preconfigured Products ({formSelectedProducts.length})
                  </label>
                  <select
                    onChange={(e) => {
                      handleAddProductToForm(e.target.value);
                      e.target.value = '';
                    }}
                    className="text-xs border border-slate-300 rounded px-2 py-1"
                  >
                    <option value="">+ Add Product</option>
                    {availableProducts.map((prod) => (
                      <option key={prod._id} value={prod._id}>
                        {prod.name} (₹{prod.salesPrice})
                      </option>
                    ))}
                  </select>
                </div>

                {formSelectedProducts.map((sp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-200"
                  >
                    <span className="font-semibold text-slate-800">
                      {availableProducts.find((p) => p._id === sp.product)?.name || 'Product Item'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span>₹{sp.unitPrice}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormSelectedProducts(formSelectedProducts.filter((_, i) => i !== idx))
                        }
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationTemplates;

