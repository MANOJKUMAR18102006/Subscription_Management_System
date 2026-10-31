import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  ArrowLeft,
  Printer,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  Send,
  XCircle,
  Building,
  Mail,
  Phone,
  User,
  History,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const canManage = isAdmin || isStaff;

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/quotations/${id}`);
      if (res.data.success) {
        setQuotation(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching quotation:', err);
      setError(err.response?.data?.message || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const handleUpdateStatus = async (newStatus, note = '') => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');
      const res = await api.patch(`/quotations/${id}/status`, { status: newStatus, note });
      if (res.data.success) {
        setSuccessMsg(`Quotation status updated to '${newStatus}'`);
        fetchQuotation();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quotation status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSubscription = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');
      const res = await api.post(`/quotations/${id}/convert-to-subscription`);
      if (res.data.success) {
        setSuccessMsg('Successfully converted quotation into an active subscription!');
        fetchQuotation();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert quotation to subscription');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Sparkles className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Loading quotation details...</p>
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Error Loading Quotation</h2>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={() => navigate('/quotations')}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Back to Quotations
        </button>
      </div>
    );
  }

  const isExpired = new Date(quotation.expiryDate) < new Date();
  const stages = ['Draft', 'Quotation', 'Confirmed', 'Active'];
  const currentStageIndex = stages.indexOf(quotation.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {quotation.quotationNumber}
              </h1>
              {quotation.status === 'Active' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  Active Subscription
                </span>
              ) : quotation.status === 'Confirmed' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Confirmed
                </span>
              ) : quotation.status === 'Quotation' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Send className="w-3.5 h-3.5" />
                  Official Quotation
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Draft
                </span>
              )}

              {isExpired && quotation.status !== 'Active' && quotation.status !== 'Closed' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  Expired
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Created on {new Date(quotation.createdDate).toLocaleDateString()} • Expires on{' '}
              {new Date(quotation.expiryDate).toLocaleDateString()} ({quotation.validityDuration} days)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Print / PDF view */}
          <button
            onClick={() => navigate(`/quotations/${quotation._id}/print`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print / PDF
          </button>

          {/* Edit (if Draft or Quotation) */}
          {canManage && (quotation.status === 'Draft' || quotation.status === 'Quotation') && (
            <button
              onClick={() => navigate(`/quotations/${quotation._id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Edit3 className="w-4 h-4 text-slate-500" />
              Edit Lines
            </button>
          )}

          {/* Workflow Buttons */}
          {canManage && quotation.status === 'Draft' && (
            <button
              disabled={actionLoading}
              onClick={() => handleUpdateStatus('Quotation', 'Official quotation sent to client')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              Send as Quotation
            </button>
          )}

          {canManage && quotation.status === 'Quotation' && (
            <button
              disabled={actionLoading || isExpired}
              onClick={() => handleUpdateStatus('Confirmed', 'Customer confirmed terms')}
              title={isExpired ? 'Cannot confirm expired quotation. Please extend validity.' : 'Confirm offer'}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors ${
                isExpired
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'text-white bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {isExpired ? 'Quotation Expired' : 'Confirm Offer'}
            </button>
          )}

          {/* Convert to Subscription if Confirmed */}
          {canManage && quotation.status === 'Confirmed' && !isExpired && (
            <button
              disabled={actionLoading}
              onClick={handleConvertToSubscription}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-500/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Convert to Subscription
            </button>
          )}

          {/* Close Quotation */}
          {canManage && ['Draft', 'Quotation', 'Confirmed'].includes(quotation.status) && (
            <button
              disabled={actionLoading}
              onClick={() => handleUpdateStatus('Closed', 'Quotation marked as closed')}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close Quotation"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Expiry Warning Banner (Requirement 6) */}
      {isExpired && quotation.status !== 'Active' && quotation.status !== 'Closed' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-900">Quotation Validity Expired</h4>
            <p className="mt-0.5 text-xs text-rose-700">
              This quotation expired on {new Date(quotation.expiryDate).toLocaleDateString()}. By security policy,
              expired quotations cannot be confirmed or converted into subscriptions. Click "Edit Lines" to extend the validity duration if the client has accepted late terms.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => navigate(`/quotations/${quotation._id}/edit`)}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
            >
              Extend Validity
            </button>
          )}
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stepper / Lifecycle Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {stages.map((stage, idx) => {
            const isCompleted = currentStageIndex >= idx;
            const isCurrent = quotation.status === stage;

            return (
              <div
                key={stage}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-400 font-bold text-blue-700'
                    : isCompleted
                    ? 'bg-slate-50 border-slate-300 text-slate-700 font-medium'
                    : 'bg-white border-dashed border-slate-200 text-slate-400'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider mb-1">Step {idx + 1}</div>
                <div className="text-sm font-semibold">{stage}</div>
                {isCompleted && (
                  <div className="mt-1 flex items-center justify-center text-[10px] text-emerald-600 font-semibold gap-1">
                    <CheckCircle className="w-3 h-3" /> Done
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Converted Subscription Banner if Active */}
      {quotation.status === 'Active' && quotation.subscriptionId && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-950 text-sm">
                Quotation Converted into Active Subscription
              </h3>
              <p className="text-xs text-emerald-700">
                Subscription ID: {quotation.subscriptionId?._id || quotation.subscriptionId}
              </p>
            </div>
          </div>
          <Link
            to={`/admin/subscriptions`}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 underline"
          >
            View Subscriptions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Customer & Quotation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-blue-600" />
            Customer Details
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="font-bold text-slate-900 text-base">
              {quotation.customer?.name}
            </div>
            {quotation.customer?.company && (
              <div className="text-xs text-slate-500 font-medium">
                {quotation.customer.company}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {quotation.customer?.email}
            </div>
            {quotation.customer?.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {quotation.customer.phone}
              </div>
            )}
          </div>
        </div>

        {/* Commercial Terms */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            Commercial Terms
          </h2>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Terms:</span>
              <span className="font-semibold text-slate-900">{quotation.paymentTerms || 'Net 30'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Validity Window:</span>
              <span className="font-semibold text-slate-900">{quotation.validityDuration} Calendar Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Issue Date:</span>
              <span className="font-semibold text-slate-900">
                {new Date(quotation.createdDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expiration Date:</span>
              <span className={`font-semibold ${isExpired ? 'text-rose-600' : 'text-slate-900'}`}>
                {new Date(quotation.expiryDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Source Template / Reference */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Template Reference
          </h2>
          <div className="space-y-1 text-xs">
            {quotation.quotationTemplate ? (
              <>
                <div className="font-semibold text-slate-800 text-sm">
                  {quotation.quotationTemplate.name}
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  {quotation.quotationTemplate.description || 'Standard structured template applied.'}
                </p>
              </>
            ) : (
              <div className="text-slate-400 italic">Custom Quote (No template linked)</div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Itemized Offer Lines
          </h3>
          <span className="text-xs text-slate-500">
            {(quotation.plans?.length || 0) + (quotation.products?.length || 0)} Line Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Item Name / Specification</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">GST Tax</th>
                <th className="py-3 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Subscription Plans Lines */}
              {quotation.plans?.map((pl, idx) => (
                <tr key={`pl-${idx}`} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      Subscription ({pl.billingFrequency || 'Monthly'})
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{pl.name}</td>
                  <td className="py-3 px-4 text-center font-medium">{pl.quantity}</td>
                  <td className="py-3 px-4 text-right">₹{Number(pl.unitPrice || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                    {pl.discount ? `${pl.discount}%` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500 font-medium">
                    {pl.taxRate || 18}%
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ₹{Number(pl.lineTotal || 0).toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Products Lines */}
              {quotation.products?.map((p, idx) => (
                <tr key={`p-${idx}`} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Product
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {p.name}
                    {p.variant && (
                      <span className="ml-2 text-xs font-normal text-slate-500">({p.variant})</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-medium">{p.quantity}</td>
                  <td className="py-3 px-4 text-right">₹{Number(p.unitPrice || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                    {p.discount ? `${p.discount}%` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500 font-medium">
                    {p.taxRate || 18}%
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ₹{Number(p.lineTotal || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Totals Summary Footer */}
        <div className="p-5 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-6">
          <div className="max-w-md text-xs text-slate-500 space-y-1">
            <h4 className="font-bold text-slate-700 uppercase">Customer Notes:</h4>
            <p className="italic">{quotation.notes || 'No special notes recorded on this quotation.'}</p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (Net):</span>
              <span className="font-semibold text-slate-900">
                ₹{Number(quotation.subtotal || 0).toFixed(2)}
              </span>
            </div>

            {quotation.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Total Savings:</span>
                <span className="font-semibold">
                  -₹{Number(quotation.discountAmount || 0).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Taxes (Statutory GST 18%):</span>
              <span className="font-semibold text-slate-900">
                ₹{Number(quotation.taxAmount || 0).toFixed(2)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-300 flex justify-between text-sm">
              <span className="font-bold text-slate-900">Total Quoted:</span>
              <span className="text-lg font-bold text-blue-600">
                ₹{Number(quotation.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Box */}
      {quotation.termsAndConditions && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Terms & Conditions
          </h3>
          <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            {quotation.termsAndConditions}
          </pre>
        </div>
      )}

      {/* Audit History Log */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          Audit & Status History Trail ({quotation.history?.length || 0} Events)
        </h3>

        <div className="relative border-l-2 border-slate-200 ml-3 pl-4 space-y-4 text-xs">
          {quotation.history?.map((h, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <span>{h.action}</span>
                <span className="text-[11px] font-normal text-slate-400">
                  by {h.performedByName || h.performedBy?.name || 'Staff User'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono ml-auto">
                  {new Date(h.timestamp).toLocaleString()}
                </span>
              </div>
              {h.details && (
                <div className="text-slate-500 text-[11px] mt-0.5">{h.details}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotationDetail;

