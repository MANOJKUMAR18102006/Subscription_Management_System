import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Receipt,
  ArrowLeft,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Calendar,
  User,
  Package,
  DollarSign,
  Tag,
  ShieldCheck,
  Percent,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const canManage = isAdmin || isStaff;

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  // Payment Recording Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('card');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/invoices/${id}`);
      if (res.data.success) {
        setInvoice(res.data.invoice);
        setPayments(res.data.payments || []);
        setPayAmount(res.data.invoice.balanceDue || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetail();
  }, [id]);

  const handleUpdateStatus = async (targetStatus, reason = '') => {
    if (!window.confirm(`Are you sure you want to change invoice status to '${targetStatus}'?`)) return;
    try {
      const res = await api.patch(`/invoices/${id}/status`, { status: targetStatus, reason });
      if (res.data.success) {
        setActionNotice(`Invoice status updated to ${targetStatus}`);
        fetchInvoiceDetail();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update invoice status');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPayError('');

    if (Number(payAmount) <= 0) {
      setPayError('Payment amount must be greater than zero');
      return;
    }

    try {
      setPayLoading(true);
      const res = await api.post('/payments', {
        invoiceId: invoice._id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        transactionReference: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined
      });

      if (res.data.success) {
        setIsPayModalOpen(false);
        setActionNotice(`Payment recorded successfully! Reference: ${res.data.payment?.paymentReference}`);
        fetchInvoiceDetail();
      }
    } catch (err) {
      setPayError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Error Loading Invoice</h3>
        <p className="text-sm text-slate-500 mt-1">{error || 'Invoice record not found'}</p>
        <button
          onClick={() => navigate('/invoices')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  const normStatus = (invoice.status || '').toLowerCase();
  const isPaid = normStatus === 'paid';
  const isDraft = normStatus === 'draft';
  const isConfirmed = normStatus === 'confirmed';
  const isCancelled = normStatus === 'cancelled' || normStatus === 'canceled';

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice('')}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            title="Back to Invoices"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-800 font-mono tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : normStatus === 'partially_paid' || normStatus === 'partially paid'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : isConfirmed
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : isCancelled
                    ? 'bg-slate-100 text-slate-500 border border-slate-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued on {new Date(invoice.createdAt).toLocaleDateString()} • Due by{' '}
              {new Date(invoice.dueDate).toLocaleDateString()} ({invoice.paymentTerms || 'Net 30'})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/invoices/${invoice._id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </Link>

          {isDraft && canManage && (
            <button
              onClick={() => handleUpdateStatus('Confirmed')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
            >
              <Check className="w-4 h-4" />
              Confirm Invoice
            </button>
          )}

          {!isPaid && !isCancelled && canManage && (
            <button
              onClick={() => {
                setPayAmount(invoice.balanceDue);
                setIsPayModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          )}

          {!isPaid && !isCancelled && canManage && (
            <button
              onClick={() => handleUpdateStatus('Cancelled')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold transition"
            >
              <X className="w-4 h-4" />
              Cancel Invoice
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <User className="w-4 h-4 text-blue-600" />
            Billed To
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{invoice.customerId?.name || 'Customer'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{invoice.customerId?.email}</p>
            {invoice.customerId?.company && (
              <p className="text-xs text-slate-600 mt-1">Company: {invoice.customerId?.company}</p>
            )}
            {invoice.customerId?.phone && (
              <p className="text-xs text-slate-600">Phone: {invoice.customerId?.phone}</p>
            )}
          </div>
        </div>

        {/* Subscription Agreement Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-indigo-600" />
            Subscription Contract
          </div>
          <div>
            {invoice.subscriptionId ? (
              <>
                <Link
                  to={`/subscriptions/${invoice.subscriptionId._id || invoice.subscriptionId}`}
                  className="text-base font-mono font-bold text-indigo-600 hover:underline"
                >
                  #{invoice.subscriptionId.subscriptionNumber || 'Subscription'}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5">
                  Plan: {invoice.subscriptionId.planName || 'Enterprise'} ({invoice.billingFrequency || 'Monthly'})
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Billing Cycle: {invoice.billingPeriodStart ? new Date(invoice.billingPeriodStart).toLocaleDateString() : '-'} →{' '}
                  {invoice.billingPeriodEnd ? new Date(invoice.billingPeriodEnd).toLocaleDateString() : '-'}
                </p>
              </>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-slate-700">One-off / Direct Invoicing</h3>
                <p className="text-xs text-slate-400 mt-0.5">Not linked to a recurring subscription contract</p>
              </div>
            )}
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Outstanding Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-emerald-400 font-mono">
              ₹{(invoice.balanceDue || 0).toLocaleString()}
            </h2>
            <div className="flex items-center justify-between text-xs text-slate-300 mt-2 pt-2 border-t border-slate-700">
              <span>Total Invoiced: ₹{(invoice.totalAmount || invoice.amount || 0).toLocaleString()}</span>
              <span>Paid: ₹{(invoice.amountPaid || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Invoice Line Items ({invoice.invoiceLines?.length || 0})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-center">Quantity</th>
                <th className="px-6 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 text-right">Discount</th>
                <th className="px-6 py-3 text-right">Tax Rate</th>
                <th className="px-6 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.invoiceLines && invoice.invoiceLines.length > 0 ? (
                invoice.invoiceLines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-800">{line.name}</div>
                      {line.variant && <div className="text-[11px] text-slate-400">Variant: {line.variant}</div>}
                    </td>
                    <td className="px-6 py-3.5 text-center font-mono font-medium">{line.quantity}</td>
                    <td className="px-6 py-3.5 text-right font-mono">₹{line.unitPrice?.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right font-mono text-amber-600">
                      {line.discount > 0 ? `${line.discount}% (₹${line.discountAmount})` : '-'}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-blue-600">
                      {line.taxRate > 0 ? `${line.taxRate}% (₹${line.taxAmount})` : '-'}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-800">
                      ₹{line.lineTotal?.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-slate-400">
                    No line items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Totals & Coupon Breakdown */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="space-y-3 max-w-md">
            {invoice.discountDetails && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Coupon Applied: {invoice.discountDetails.code}
                </div>
                <div className="text-indigo-700">
                  {invoice.discountDetails.name} • Saved ₹{invoice.discountDetails.amount?.toLocaleString()}
                </div>
              </div>
            )}

            {invoice.notes && (
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700 block mb-0.5">Invoice Notes:</span>
                <p className="bg-white p-2.5 rounded-lg border border-slate-200">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">₹{(invoice.subtotal || 0).toLocaleString()}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-amber-600 font-medium">
                <span>Total Discounts:</span>
                <span className="font-mono">- ₹{invoice.discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-blue-600 font-medium">
              <span>Tax Amount:</span>
              <span className="font-mono">+ ₹{(invoice.taxAmount || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-base font-bold text-slate-800 pt-2 border-t border-slate-300">
              <span>Grand Total:</span>
              <span className="font-mono text-slate-900">
                ₹{(invoice.totalAmount || invoice.amount || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between text-xs text-emerald-600 font-semibold">
              <span>Amount Paid:</span>
              <span className="font-mono">₹{(invoice.amountPaid || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-sm font-black text-rose-600 pt-1 border-t border-slate-200">
              <span>Balance Due:</span>
              <span className="font-mono">₹{(invoice.balanceDue || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Payments Recorded ({payments.length})
          </h3>

          {!isPaid && !isCancelled && canManage && (
            <button
              onClick={() => {
                setPayAmount(invoice.balanceDue);
                setIsPayModalOpen(true);
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              + Record Payment
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Receipt Reference</th>
                <th className="px-6 py-3">Payment Date</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-mono font-semibold text-slate-800">
                      {p.paymentReference}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 uppercase font-semibold text-slate-700">
                      {p.paymentMethod}
                    </td>
                    <td className="px-6 py-3.5 font-bold font-mono text-emerald-600">
                      ₹{p.amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/payments`}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        View Receipt
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-slate-400">
                    No payments have been recorded against this invoice yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit History Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Invoice Lifecycle & Audit History
        </h3>

        <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {invoice.history && invoice.history.length > 0 ? (
            invoice.history.map((h, i) => (
              <div key={i} className="relative text-xs">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="font-semibold text-slate-800">
                  {h.action} •{' '}
                  <span className="font-normal text-slate-400">
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                </div>
                {h.details && <p className="text-slate-500 mt-0.5">{h.details}</p>}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400">No audit events recorded.</p>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-base font-bold text-slate-800">Record Invoice Payment</h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {payError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {payError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={invoice.balanceDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Outstanding balance: ₹{invoice.balanceDue}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Payment Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="card">Credit / Debit Card</option>
                  <option value="bank_transfer">Bank Wire Transfer / NEFT</option>
                  <option value="upi">UPI Gateway</option>
                  <option value="cash">Cash / Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Transaction / Reference # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN-998822"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Payment receipt remarks..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  disabled={payLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-60"
                >
                  {payLoading ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;

