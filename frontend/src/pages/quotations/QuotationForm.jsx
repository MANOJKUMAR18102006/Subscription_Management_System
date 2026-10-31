import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Package,
  Calculator,
  Save,
  Send,
  AlertCircle,
  HelpCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';

const QuotationForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Reference data
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [validityDuration, setValidityDuration] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState(
    '1. Quotation is valid until the specified expiry date.\n2. Payment terms as agreed above.\n3. Taxes applicable as per statutory GST rates.'
  );

  // Line Items
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');

  // Initial Load: Customers, Templates, Products, Plans
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        setInitLoading(true);
        const [custRes, tplRes, prodRes, planRes] = await Promise.all([
          api.get('/users?role=customer').catch(() => ({ data: { users: [] } })),
          api.get('/quotation-templates?isActive=true').catch(() => ({ data: { data: [] } })),
          api.get('/products?limit=100').catch(() => ({ data: { products: [] } })),
          api.get('/plans?limit=100').catch(() => ({ data: { plans: [] } }))
        ]);

        if (custRes.data?.users) setCustomers(custRes.data.users);
        if (tplRes.data?.data) setTemplates(tplRes.data.data);
        if (prodRes.data?.products) setAvailableProducts(prodRes.data.products);
        if (planRes.data?.plans) setAvailablePlans(planRes.data.plans);

        // If editing existing quotation
        if (isEditing) {
          const qRes = await api.get(`/quotations/${id}`);
          if (qRes.data?.success) {
            const q = qRes.data.data;
            setCustomerId(q.customer?._id || q.customer || '');
            setSelectedTemplateId(q.quotationTemplate?._id || q.quotationTemplate || '');
            setValidityDuration(q.validityDuration || 30);
            setPaymentTerms(q.paymentTerms || 'Net 30');
            setStatus(q.status || 'Draft');
            setNotes(q.notes || '');
            setTermsAndConditions(q.termsAndConditions || '');
            setProducts(
              q.products?.map((p) => ({
                product: p.product?._id || p.product,
                name: p.name,
                variant: p.variant || '',
                quantity: p.quantity || 1,
                unitPrice: p.unitPrice || 0,
                taxRate: p.taxRate !== undefined ? p.taxRate : 18,
                discount: p.discount || 0
              })) || []
            );
            setPlans(
              q.plans?.map((pl) => ({
                plan: pl.plan?._id || pl.plan,
                name: pl.name,
                billingFrequency: pl.billingFrequency || 'Monthly',
                quantity: pl.quantity || 1,
                unitPrice: pl.unitPrice || 0,
                taxRate: pl.taxRate !== undefined ? pl.taxRate : 18,
                discount: pl.discount || 0
              })) || []
            );
          }
        }
      } catch (err) {
        console.error('Error loading form data:', err);
        setError('Failed to load required catalog or customer data');
      } finally {
        setInitLoading(false);
      }
    };

    loadDependencies();
  }, [id, isEditing]);

  // When template is selected, auto-fill default values
  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tpl = templates.find((t) => t._id === templateId);
    if (!tpl) return;

    if (tpl.validityDuration) setValidityDuration(tpl.validityDuration);
    if (tpl.paymentTerms) setPaymentTerms(tpl.paymentTerms);
    if (tpl.termsAndConditions) setTermsAndConditions(tpl.termsAndConditions);

    // Populate products from template
    if (tpl.selectedProducts && tpl.selectedProducts.length > 0) {
      const templateProductLines = tpl.selectedProducts
        .filter((sp) => sp.product)
        .map((sp) => {
          const prodObj = sp.product;
          return {
            product: prodObj._id,
            name: prodObj.name,
            variant: '',
            quantity: sp.defaultQuantity || tpl.defaultQuantities || 1,
            unitPrice: sp.unitPrice > 0 ? sp.unitPrice : prodObj.salesPrice || 0,
            taxRate: sp.defaultTaxRate !== undefined ? sp.defaultTaxRate : tpl.defaultTaxes || 18,
            discount: sp.defaultDiscount || 0
          };
        });
      setProducts(templateProductLines);
    }

    // Populate plans from template
    if (tpl.selectedPlans && tpl.selectedPlans.length > 0) {
      const templatePlanLines = tpl.selectedPlans
        .filter((spl) => spl.plan)
        .map((spl) => {
          const planObj = spl.plan;
          return {
            plan: planObj._id,
            name: planObj.name,
            billingFrequency: spl.billingFrequency || planObj.billingFrequency || 'Monthly',
            quantity: spl.defaultQuantity || tpl.defaultQuantities || 1,
            unitPrice: spl.unitPrice > 0 ? spl.unitPrice : planObj.price || 0,
            taxRate: spl.defaultTaxRate !== undefined ? spl.defaultTaxRate : tpl.defaultTaxes || 18,
            discount: spl.defaultDiscount || 0
          };
        });
      setPlans(templatePlanLines);
    }
  };

  // Add line item handlers
  const handleAddProductLine = () => {
    const firstProd = availableProducts[0];
    setProducts([
      ...products,
      {
        product: firstProd?._id || '',
        name: firstProd?.name || 'New Product Item',
        variant: '',
        quantity: 1,
        unitPrice: firstProd?.salesPrice || 0,
        taxRate: 18,
        discount: 0
      }
    ]);
  };

  const handleUpdateProductLine = (index, field, value) => {
    const updated = [...products];
    if (field === 'product') {
      const prodObj = availableProducts.find((p) => p._id === value);
      if (prodObj) {
        updated[index].product = prodObj._id;
        updated[index].name = prodObj.name;
        updated[index].unitPrice = prodObj.salesPrice || 0;
      }
    } else {
      updated[index][field] = value;
    }
    setProducts(updated);
  };

  const handleRemoveProductLine = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleAddPlanLine = () => {
    const firstPlan = availablePlans[0];
    setPlans([
      ...plans,
      {
        plan: firstPlan?._id || '',
        name: firstPlan?.name || 'New Plan Item',
        billingFrequency: firstPlan?.billingFrequency || 'Monthly',
        quantity: 1,
        unitPrice: firstPlan?.price || 0,
        taxRate: 18,
        discount: 0
      }
    ]);
  };

  const handleUpdatePlanLine = (index, field, value) => {
    const updated = [...plans];
    if (field === 'plan') {
      const planObj = availablePlans.find((p) => p._id === value);
      if (planObj) {
        updated[index].plan = planObj._id;
        updated[index].name = planObj.name;
        updated[index].unitPrice = planObj.price || 0;
        updated[index].billingFrequency = planObj.billingFrequency || 'Monthly';
      }
    } else {
      updated[index][field] = value;
    }
    setPlans(updated);
  };

  const handleRemovePlanLine = (index) => {
    setPlans(plans.filter((_, i) => i !== index));
  };

  // Compute live calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    products.forEach((p) => {
      const qty = Number(p.quantity) || 1;
      const price = Number(p.unitPrice) || 0;
      const disc = Number(p.discount) || 0;
      const taxRate = Number(p.taxRate) || 18;

      const base = qty * price;
      const lineDisc = base * (disc / 100);
      const lineNet = base - lineDisc;
      const tax = lineNet * (taxRate / 100);

      subtotal += lineNet;
      taxTotal += tax;
      discountTotal += lineDisc;
    });

    plans.forEach((pl) => {
      const qty = Number(pl.quantity) || 1;
      const price = Number(pl.unitPrice) || 0;
      const disc = Number(pl.discount) || 0;
      const taxRate = Number(pl.taxRate) || 18;

      const base = qty * price;
      const lineDisc = base * (disc / 100);
      const lineNet = base - lineDisc;
      const tax = lineNet * (taxRate / 100);

      subtotal += lineNet;
      taxTotal += tax;
      discountTotal += lineDisc;
    });

    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxTotal.toFixed(2)),
      discountAmount: Number(discountTotal.toFixed(2)),
      totalAmount: Number((subtotal + taxTotal).toFixed(2))
    };
  };

  const totals = calculateTotals();
  const calculatedExpiryDate = new Date(Date.now() + (Number(validityDuration) || 30) * 24 * 60 * 60 * 1000);

  const handleSubmit = async (targetStatus) => {
    setError('');

    if (!customerId) {
      setError('Please select a customer');
      return;
    }

    if (products.length === 0 && plans.length === 0) {
      setError('Please add at least one product or subscription plan line item');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        customerId,
        quotationTemplateId: selectedTemplateId || undefined,
        validityDuration: Number(validityDuration) || 30,
        paymentTerms,
        status: targetStatus || status,
        notes,
        termsAndConditions,
        products,
        plans
      };

      if (isEditing) {
        const res = await api.put(`/quotations/${id}`, payload);
        if (res.data.success) {
          navigate(`/quotations/${id}`);
        }
      } else {
        const res = await api.post('/quotations', payload);
        if (res.data.success) {
          navigate(`/quotations/${res.data.data._id}`);
        }
      }
    } catch (err) {
      console.error('Error saving quotation:', err);
      setError(err.response?.data?.message || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Sparkles className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Initializing Quotation Builder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              {isEditing ? 'Edit Quotation' : 'Create Customer Quotation'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Build personalized quotes using reusable templates, custom line items, and dynamic tax calculations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('Draft')}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-slate-500" />
            Save as Draft
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('Quotation')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            Send as Quotation
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Details & Line Items (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Section: Template & Customer Selector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              General Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Template selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Load From Template (Optional)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Start from Scratch --</option>
                  {templates.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.validityDuration} days)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pre-fills products, plans, taxes, and terms.
                </p>
              </div>

              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.company || c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Validity duration in days */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Validity Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={validityDuration}
                  onChange={(e) => setValidityDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment terms */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Immediate">Immediate</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Subscription Plans Line Items */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                Subscription Plans Line Items ({plans.length})
              </h2>
              <button
                type="button"
                onClick={handleAddPlanLine}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Plan Line
              </button>
            </div>

            {plans.length === 0 ? (
              <div className="py-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg text-xs">
                No subscription plans added to this quotation yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Plan</th>
                      <th className="py-2.5 px-2">Frequency</th>
                      <th className="py-2.5 px-2 w-16">Qty</th>
                      <th className="py-2.5 px-2 w-24">Price (₹)</th>
                      <th className="py-2.5 px-2 w-20">Disc (%)</th>
                      <th className="py-2.5 px-2 w-20">Tax (%)</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {plans.map((pl, idx) => {
                      const base = (Number(pl.quantity) || 1) * (Number(pl.unitPrice) || 0);
                      const disc = base * ((Number(pl.discount) || 0) / 100);
                      const lineNet = base - disc;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          {/* Plan selector */}
                          <td className="py-2.5 px-3">
                            <select
                              value={pl.plan}
                              onChange={(e) => handleUpdatePlanLine(idx, 'plan', e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none"
                            >
                              {availablePlans.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} (₹{p.price})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Billing Frequency */}
                          <td className="py-2.5 px-2">
                            <select
                              value={pl.billingFrequency}
                              onChange={(e) => handleUpdatePlanLine(idx, 'billingFrequency', e.target.value)}
                              className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none"
                            >
                              <option value="Daily">Daily</option>
                              <option value="Weekly">Weekly</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Yearly">Yearly</option>
                            </select>
                          </td>

                          {/* Qty */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="1"
                              value={pl.quantity}
                              onChange={(e) => handleUpdatePlanLine(idx, 'quantity', e.target.value)}
                              className="w-16 text-xs border border-slate-300 rounded px-2 py-1.5 text-center focus:outline-none"
                            />
                          </td>

                          {/* Unit price */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0"
                              value={pl.unitPrice}
                              onChange={(e) => handleUpdatePlanLine(idx, 'unitPrice', e.target.value)}
                              className="w-24 text-xs border border-slate-300 rounded px-2 py-1.5 text-right focus:outline-none"
                            />
                          </td>

                          {/* Discount */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={pl.discount}
                              onChange={(e) => handleUpdatePlanLine(idx, 'discount', e.target.value)}
                              className="w-16 text-xs border border-slate-300 rounded px-2 py-1.5 text-center focus:outline-none"
                            />
                          </td>

                          {/* Tax */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0"
                              value={pl.taxRate}
                              onChange={(e) => handleUpdatePlanLine(idx, 'taxRate', e.target.value)}
                              className="w-16 text-xs border border-slate-300 rounded px-2 py-1.5 text-center focus:outline-none"
                            />
                          </td>

                          {/* Line total */}
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                            ₹{lineNet.toFixed(2)}
                          </td>

                          {/* Remove */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePlanLine(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Products Line Items */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Product Line Items ({products.length})
              </h2>
              <button
                type="button"
                onClick={handleAddProductLine}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product Line
              </button>
            </div>

            {products.length === 0 ? (
              <div className="py-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg text-xs">
                No physical or software products added to this quotation yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-2 w-28">Variant / Note</th>
                      <th className="py-2.5 px-2 w-16">Qty</th>
                      <th className="py-2.5 px-2 w-24">Price (₹)</th>
                      <th className="py-2.5 px-2 w-16">Disc (%)</th>
                      <th className="py-2.5 px-2 w-16">Tax (%)</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p, idx) => {
                      const base = (Number(p.quantity) || 1) * (Number(p.unitPrice) || 0);
                      const disc = base * ((Number(p.discount) || 0) / 100);
                      const lineNet = base - disc;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          {/* Product select */}
                          <td className="py-2.5 px-3">
                            <select
                              value={p.product}
                              onChange={(e) => handleUpdateProductLine(idx, 'product', e.target.value)}
                              className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none"
                            >
                              {availableProducts.map((prod) => (
                                <option key={prod._id} value={prod._id}>
                                  {prod.name} (₹{prod.salesPrice})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Variant / Option */}
                          <td className="py-2.5 px-2">
                            <input
                              type="text"
                              placeholder="e.g. Edition: Pro"
                              value={p.variant}
                              onChange={(e) => handleUpdateProductLine(idx, 'variant', e.target.value)}
                              className="w-28 text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none"
                            />
                          </td>

                          {/* Qty */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="1"
                              value={p.quantity}
                              onChange={(e) => handleUpdateProductLine(idx, 'quantity', e.target.value)}
                              className="w-16 text-xs border border-slate-300 rounded px-2 py-1.5 text-center focus:outline-none"
                            />
                          </td>

                          {/* Unit price */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0"
                              value={p.unitPrice}
                              onChange={(e) => handleUpdateProductLine(idx, 'unitPrice', e.target.value)}
                              className="w-24 text-xs border border-slate-300 rounded px-2 py-1.5 text-right focus:outline-none"
                            />
                          </td>

                          {/* Disc */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={p.discount}
                              onChange={(e) => handleUpdateProductLine(idx, 'discount', e.target.value)}
                              className="w-16 text-xs border border-slate-300 rounded px-2 py-1.5 text-center focus:outline-none"
                            />
                          </td>

                          {/* Tax */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0"
                              value={p.taxRate}
                              onChange={(e) => handleUpdateProductLine(idx, 'taxRate', e.target.value)}
                              className="w-16 text-xs border border-slate-300 rounded px-2 py-1.5 text-center focus:outline-none"
                            />
                          </td>

                          {/* Line total */}
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                            ₹{lineNet.toFixed(2)}
                          </td>

                          {/* Delete */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveProductLine(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Notes & Terms */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Terms & Customer Notes
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Customer Notes / Memo</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes visible to customer on quotation PDF..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Terms & Conditions</label>
                <textarea
                  rows="3"
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="w-full text-xs font-mono text-slate-700 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Calculation Summary Card */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 sticky top-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calculator className="w-4 h-4 text-emerald-600" />
              Quotation Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal (Net)</span>
                <span className="font-semibold text-slate-900">₹{totals.subtotal.toFixed(2)}</span>
              </div>

              {totals.discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Total Discount</span>
                  <span className="font-semibold">-₹{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  Estimated Taxes (GST)
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Calculated line by line" />
                </span>
                <span className="font-semibold text-slate-900">₹{totals.taxAmount.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">Total Amount</span>
                <span className="text-xl font-bold text-blue-600">₹{totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Expiry calculation preview */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 mt-4 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  Issue Date:
                </span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Expiry Date:
                </span>
                <span className="font-semibold text-slate-900">{calculatedExpiryDate.toLocaleDateString()}</span>
              </div>

              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                Offer remains valid for <span className="font-semibold text-slate-800">{validityDuration} days</span>. Cannot be confirmed once expired.
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit('Quotation')}
                className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit as Official Quotation
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit('Draft')}
                className="w-full py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-slate-500" />
                Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationForm;

