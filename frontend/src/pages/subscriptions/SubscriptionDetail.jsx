import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import {
  Layers,
  ArrowLeft,
  Calendar,
  CreditCard,
  User,
  Clock,
  Sparkles,
  Package,
  FileText,
  Pause,
  Play,
  XCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Receipt,
  Download,
  DollarSign,
  Info,
  Check,
  Building,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Edit3
} from 'lucide-react';
import SubscriptionFormModal from '../../components/subscriptions/SubscriptionFormModal';

const SubscriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const canManage = isAdmin || isStaff;

  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/subscriptions/${id}`);
      if (res.data.success) {
        setSubscription(res.data.subscription);
        setInvoices(res.data.invoices || []);
        setDiscounts(res.data.discounts || []);
      }
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setError(err.response?.data?.message || 'Failed to load subscription details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Actions
  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/subscriptions/${id}/confirm`);
      if (res.data.success) {
        showToast(res.data.message || 'Subscription confirmed successfully!');
        fetchSubscription();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/subscriptions/${id}/activate`);
      if (res.data.success) {
        showToast(res.data.message || 'Subscription activated successfully!');
        fetchSubscription();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to activate subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/subscriptions/${id}/pause`);
      if (res.data.success) {
        showToast(res.data.message || 'Subscription paused.');
        fetchSubscription();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pause subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/subscriptions/${id}/resume`);
      if (res.data.success) {
        showToast(res.data.message || 'Subscription resumed to Active status.');
        fetchSubscription();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resume subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEarlyClose = async () => {
    const reason = window.prompt(
      'Please state the reason for early closure of this subscription contract:',
      'Customer requested early contract termination'
    );
    if (reason === null) return;

    try {
      setActionLoading(true);
      const res = await api.patch(`/subscriptions/${id}/early-close`, { reason });
      if (res.data.success) {
        showToast(res.data.message || 'Subscription closed early.');
        fetchSubscription();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close subscription early');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/subscriptions/${id}/renew`);
      if (res.data.success) {
        showToast(res.data.message || 'Subscription renewed successfully!');
        fetchSubscription();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to renew subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!window.confirm('Generate the recurring invoice for this subscription billing cycle?')) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post(`/subscriptions/${id}/generate-invoice`);
      if (res.data.success) {
        showToast(res.data.message || 'Invoice generated successfully!');
        fetchSubscription();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold">Loading subscription agreement...</p>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Subscription Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested subscription contract does not exist.'}</p>
        <button
          type="button"
          onClick={() => navigate('/subscriptions')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Subscriptions
        </button>
      </div>
    );
  }

  // Permissions from snapshot
  const allowPause = subscription.planSnapshot?.allowPause !== undefined
    ? subscription.planSnapshot.allowPause
    : subscription.planId?.allowPause !== undefined ? subscription.planId.allowPause : true;

  const allowEarlyClosure = subscription.planSnapshot?.allowEarlyClosure !== undefined
    ? subscription.planSnapshot.allowEarlyClosure
    : subscription.planId?.allowEarlyClosure !== undefined ? subscription.planId.allowEarlyClosure : true;

  const allowRenewal = subscription.planSnapshot?.allowRenewal !== undefined
    ? subscription.planSnapshot.allowRenewal
    : subscription.planId?.allowRenewal !== undefined ? subscription.planId.allowRenewal : true;

  const normStatus = (subscription.status || 'draft').toLowerCase();

  const getStatusBadge = (st) => {
    switch (st) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'confirmed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'paused':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'closed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'quotation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'draft':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/subscriptions')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Subscriptions List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{subscription.subscriptionNumber}</span>
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(
                normStatus
              )}`}
            >
              {subscription.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Contract initialized on {new Date(subscription.startDate).toLocaleDateString()} • {subscription.planName}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit (Draft/Staff) */}
          {canManage && ['draft', 'quotation'].includes(normStatus) && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 font-semibold text-xs shadow-2xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Contract
            </button>
          )}

          {/* Confirm Button */}
          {canManage && ['draft', 'quotation'].includes(normStatus) && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Confirm Subscription
            </button>
          )}

          {/* Activate Button */}
          {canManage && normStatus === 'confirmed' && (
            <button
              type="button"
              onClick={handleActivate}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Activate Contract
            </button>
          )}

          {/* Pause / Resume */}
          {normStatus === 'paused' ? (
            <button
              type="button"
              onClick={handleResume}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Resume Subscription
            </button>
          ) : normStatus === 'active' ? (
            <button
              type="button"
              onClick={handlePause}
              disabled={!allowPause || actionLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-colors ${
                allowPause
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
              title={allowPause ? 'Pause subscription' : 'Pausing is disabled for this plan'}
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          ) : null}

          {/* Renew Button */}
          {['active', 'paused'].includes(normStatus) && (
            <button
              type="button"
              onClick={handleRenew}
              disabled={!allowRenewal || actionLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-colors ${
                allowRenewal
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
              title={allowRenewal ? 'Renew subscription period' : 'Renewal is disabled for this plan'}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Renew Contract
            </button>
          )}

          {/* Early Close Button */}
          {['active', 'paused'].includes(normStatus) && (
            <button
              type="button"
              onClick={handleEarlyClose}
              disabled={!allowEarlyClosure || actionLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-colors ${
                allowEarlyClosure
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
              title={allowEarlyClosure ? 'Terminate subscription contract early' : 'Early closure is prohibited for this plan'}
            >
              <XCircle className="w-3.5 h-3.5" /> Early Close
            </button>
          )}

          {/* Bill / Generate Invoice Button */}
          {canManage && ['active'].includes(normStatus) && (
            <button
              type="button"
              onClick={handleGenerateInvoice}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-blue-400" /> Bill Current Cycle
            </button>
          )}
        </div>
      </div>

      {/* Grid: Customer Info & Contract Terms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Customer Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Subscriber Profile</h2>
              <p className="text-[10px] text-slate-400">Account and contact information</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Customer Name</span>
              <p className="font-bold text-slate-900 text-sm">{subscription.customerId?.name || 'Customer'}</p>
            </div>

            {subscription.customerId?.company && (
              <div>
                <span className="text-slate-400 font-medium">Organization</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {subscription.customerId.company}
                </p>
              </div>
            )}

            <div>
              <span className="text-slate-400 font-medium">Email Address</span>
              <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {subscription.customerId?.email}
              </p>
            </div>

            {subscription.customerId?.phone && (
              <div>
                <span className="text-slate-400 font-medium">Phone Number</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {subscription.customerId.phone}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Agreement & Billing Terms */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Agreement Terms</h2>
              <p className="text-[10px] text-slate-400">Dates, schedule, and payment rules</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Start Date</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {new Date(subscription.startDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Expiry Date</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'Perpetual'}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Billing Frequency</span>
              <p className="font-bold text-slate-800 mt-0.5 uppercase tracking-wide">
                {subscription.billingFrequency || 'Monthly'}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Payment Terms</span>
              <p className="font-bold text-slate-800 mt-0.5">{subscription.paymentTerms || 'Net 30'}</p>
            </div>

            <div className="col-span-2 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
              <span className="text-blue-600 text-[10px] uppercase font-bold tracking-wider">Upcoming Renewal / Bill Date</span>
              <p className="font-black text-sm text-blue-900 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                {subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            {/* Quotation Link if converted */}
            {subscription.quotationNumber && (
              <div className="col-span-2 pt-1">
                <span className="text-slate-400 text-[10px] font-medium">Originating Quotation:</span>
                <Link
                  to={`/quotations/${subscription.quotationId?._id || subscription.quotationId}`}
                  className="inline-flex items-center gap-1 ml-2 font-bold text-blue-600 hover:text-blue-800"
                >
                  <FileText className="w-3 h-3" />
                  {subscription.quotationNumber}
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Plan Contractual Policies */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contract Policies</h2>
              <p className="text-[10px] text-slate-400">Locked agreement rules and allowances</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-semibold text-slate-700">Contract Pause</span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  allowPause ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {allowPause ? 'Permitted' : 'Prohibited'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-semibold text-slate-700">Early Termination</span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  allowEarlyClosure ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {allowEarlyClosure ? 'Permitted' : 'Prohibited'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-semibold text-slate-700">Renewal Option</span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  allowRenewal ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {allowRenewal ? 'Permitted' : 'Prohibited'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Agreed pricing locked at signup (Requirement 7)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Lines Table (Requirement 4) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" /> Subscription Lines
            </h3>
            <p className="text-xs text-slate-400">
              Individual products, variants, quantities, agreed unit rates, and statutory taxes
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
            {subscription.subscriptionLines?.length || 1} line item(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product & Specification</th>
                <th className="py-3 px-4">Variant</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-right">Agreed Rate</th>
                <th className="py-3 px-4 text-center">Taxes (GST)</th>
                <th className="py-3 px-4 text-center">Discount</th>
                <th className="py-3 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {subscription.subscriptionLines && subscription.subscriptionLines.length > 0 ? (
                subscription.subscriptionLines.map((line, idx) => (
                  <tr key={line._id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{line.name}</div>
                      {line.product?.productType && (
                        <span className="text-[10px] font-normal text-slate-400">
                          {line.product.productType}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {line.variant ? (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                          {line.variant}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Standard</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {line.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{Number(line.unitPrice || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-slate-700">{line.taxRate || 0}%</span>
                      {line.taxAmount > 0 && (
                        <span className="block text-[10px] text-slate-400">
                          +₹{Number(line.taxAmount).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {line.discount > 0 ? (
                        <span className="text-emerald-700 font-semibold">{line.discount}%</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                      ₹{Number(line.lineTotal || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{subscription.planName}</td>
                  <td className="py-3.5 px-4 text-slate-400 italic">Default Bundle</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {subscription.quantity || 1}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{Number(subscription.unitPrice || subscription.totalAmount).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-400">Included</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">-</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                    ₹{Number(subscription.totalAmount || subscription.amount).toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown Summary (Requirement 3) */}
        <div className="bg-slate-50/80 p-5 border-t border-slate-200 flex flex-col sm:flex-row justify-end items-end">
          <div className="w-full sm:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal Net:</span>
              <span className="font-semibold text-slate-800">
                ₹{Number(subscription.subtotal || subscription.totalAmount || 0).toLocaleString()}
              </span>
            </div>

            {subscription.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Contract Discount:</span>
                <span>- ₹{Number(subscription.discountAmount).toLocaleString()}</span>
              </div>
            )}

            {subscription.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Total Statutory Taxes:</span>
                <span>+ ₹{Number(subscription.taxAmount).toLocaleString()}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-300 flex justify-between items-center">
              <span className="font-black text-slate-900 text-sm">Grand Total Amount:</span>
              <span className="font-black text-lg text-blue-600">
                ₹{Number(subscription.totalAmount || subscription.amount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices & Billing History (Requirement 12) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-600" /> Billing History & Invoices
            </h3>
            <p className="text-xs text-slate-400">
              Tax invoices issued for recurring periods against this subscription
            </p>
          </div>

          {canManage && ['active'].includes(normStatus) && (
            <button
              type="button"
              onClick={handleGenerateInvoice}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" /> Generate Next Cycle Invoice
            </button>
          )}
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium">No invoices generated yet for this subscription agreement.</p>
            {canManage && ['active'].includes(normStatus) && (
              <p className="text-[11px] text-slate-500">
                Click <strong>"Bill Current Cycle"</strong> above to generate the first invoice.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {inv.billingPeriodStart ? new Date(inv.billingPeriodStart).toLocaleDateString() : 'N/A'} -{' '}
                      {inv.billingPeriodEnd ? new Date(inv.billingPeriodEnd).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{Number(inv.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      ₹{Number(inv.balanceDue || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : inv.status === 'overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
                      >
                        View Invoice →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscription History & Audit Trail (Requirement 11) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Contract Lifecycle & Audit Trail</h3>
            <p className="text-[10px] text-slate-400">Complete chronological record of all state transitions and billing events</p>
          </div>
        </div>

        {subscription.history && subscription.history.length > 0 ? (
          <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-3">
            {subscription.history.map((event, idx) => (
              <div key={event._id || idx} className="relative">
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs"></div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>{event.action}</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{event.details}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Performed by: <span className="font-medium text-slate-700">{event.performedByName || 'System'}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No historical events recorded for this subscription.</p>
        )}
      </div>

      {/* Edit Subscription Modal */}
      {isEditModalOpen && (
        <SubscriptionFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={() => {
            showToast('Subscription updated successfully!');
            fetchSubscription();
          }}
          initialData={subscription}
        />
      )}
    </div>
  );
};

export default SubscriptionDetail;

