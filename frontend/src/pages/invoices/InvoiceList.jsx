import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  CreditCard,
  Eye,
  RefreshCw,
  Play,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import InvoiceFormModal from '../../components/invoices/InvoiceFormModal';

const InvoiceList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isCustomer = user?.role === 'customer';
  const canManage = isAdmin || isStaff;

  const [invoices, setInvoices] = useState([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Financial Stats
  const [stats, setStats] = useState({
    totalInvoiced: 0,
    totalPaid: 0,
    totalBalanceDue: 0,
    overdueCount: 0,
    paidCount: 0,
    draftCount: 0
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals & Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchInvoices = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/invoices?${params.toString()}`);
      if (res.data.success) {
        setInvoices(res.data.invoices || []);
        setTotalInvoices(res.data.totalInvoices || 0);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
  }, [search, statusFilter]);

  // Run Recurring Billing Engine
  const handleRunRecurringBilling = async () => {
    if (!window.confirm('Run the Automated Recurring Billing Engine now? This will scan all active subscriptions due for renewal across daily, weekly, monthly, and yearly cycles.')) {
      return;
    }

    try {
      setRecurringLoading(true);
      const res = await api.post('/invoices/recurring-billing/run');
      if (res.data.success) {
        setToastMessage(
          `Billing Engine Completed: Scanned ${res.data.scannedCount} subscription(s). Generated ${res.data.generatedCount} new invoice(s).`
        );
        fetchInvoices(1);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Recurring billing engine encountered an error.');
    } finally {
      setRecurringLoading(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const norm = (status || '').toLowerCase();
    switch (norm) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
          </span>
        );
      case 'partially paid':
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Partially Paid
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" /> Confirmed
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Overdue
          </span>
        );
      case 'cancelled':
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-blue-600" />
            Invoices & Billing
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track customer invoicing, recurring automated billing cycles, balance collections, and payment history
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunRecurringBilling}
              disabled={recurringLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm disabled:opacity-60"
              title="Execute recurring cycle billing for due subscriptions"
            >
              <RefreshCw className={`w-4 h-4 text-blue-400 ${recurringLoading ? 'animate-spin' : ''}`} />
              {recurringLoading ? 'Scanning...' : 'Run Recurring Billing'}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          </div>
        )}
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">₹{stats.totalInvoiced?.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{totalInvoices} invoice(s) total</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount Collected</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹{stats.totalPaid?.toLocaleString()}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{stats.paidCount} paid in full</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Balance Due</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">₹{stats.totalBalanceDue?.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Outstanding receivable</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Invoices</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{stats.overdueCount}</h3>
            <p className="text-[11px] text-rose-500 font-medium mt-0.5">Needs collection follow-up</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['all', 'Confirmed', 'Paid', 'Partially Paid', 'Overdue', 'Draft', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Balance Due</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No invoices found. Generate an invoice directly or from an active subscription.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">
                      <Link to={`/invoices/${inv._id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{inv.customerId?.name || 'Customer'}</div>
                      <div className="text-xs text-slate-400">{inv.customerId?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {inv.subscriptionId ? (
                        <Link
                          to={`/subscriptions/${inv.subscriptionId._id || inv.subscriptionId}`}
                          className="inline-flex items-center gap-1 font-mono text-indigo-600 hover:underline"
                        >
                          <Layers className="w-3 h-3" />
                          {inv.subscriptionId.subscriptionNumber || 'Subscription'}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Direct / One-off</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      ₹{(inv.totalAmount || inv.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">
                      {inv.balanceDue > 0 ? (
                        <span className="text-amber-600">₹{inv.balanceDue.toLocaleString()}</span>
                      ) : (
                        <span className="text-emerald-600">₹0 (Settled)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/invoices/${inv._id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Invoice Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/invoices/${inv._id}/print`}
                          target="_blank"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Print / PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                        {inv.balanceDue > 0 && canManage && (
                          <Link
                            to={`/payments?invoiceId=${inv._id}`}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {currentPage} of {totalPages} ({totalInvoices} total invoices)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchInvoices(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchInvoices(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Form Modal */}
      <InvoiceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(msg) => {
          setToastMessage(msg);
          fetchInvoices(1);
        }}
      />
    </div>
  );
};

export default InvoiceList;

