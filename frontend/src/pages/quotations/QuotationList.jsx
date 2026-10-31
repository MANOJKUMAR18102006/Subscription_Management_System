import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Printer,
  Eye,
  Edit,
  Trash2,
  Layers,
  ArrowRight,
  Send,
  Calendar,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Sliders
} from 'lucide-react';

const QuotationList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const canManage = isAdmin || isStaff;

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    all: 0,
    Draft: 0,
    Quotation: 0,
    Confirmed: 0,
    Active: 0,
    Closed: 0,
    Expired: 0
  });

  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // for confirmation / subscription conversion

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      if (search) {
        params.append('search', search);
      }

      const res = await api.get(`/quotations?${params.toString()}`);
      if (res.data.success) {
        setQuotations(res.data.data || []);
        if (res.data.meta?.summary) {
          setSummary(res.data.meta.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError(err.response?.data?.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuotations();
  };

  const getStatusBadge = (status, isExpired) => {
    if (isExpired && (status === 'Draft' || status === 'Quotation')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <Clock className="w-3 h-3 text-rose-500" />
          Expired ({status})
        </span>
      );
    }

    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            Draft
          </span>
        );
      case 'Quotation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3 text-blue-500" />
            Quotation
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <CheckCircle className="w-3 h-3 text-amber-500" />
            Confirmed
          </span>
        );
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            Active Sub
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleConvertToSubscription = async (quotation) => {
    try {
      setActionLoading(quotation._id);
      const res = await api.post(`/quotations/${quotation._id}/convert-to-subscription`);
      if (res.data.success) {
        fetchQuotations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to convert quotation to subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteQuotation = async (id, quotationNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete quotation ${quotationNumber}?`)) {
      return;
    }
    try {
      await api.delete(`/quotations/${id}`);
      fetchQuotations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete quotation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" />
            Quotation Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Prepare, customize, and convert sales quotations into active subscriptions.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/quotation-templates')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              Templates
            </button>
            <button
              onClick={() => navigate('/quotations/new')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Quotation
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'all'
              ? 'bg-blue-50/70 border-blue-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">All Quotes</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary.all || 0}</div>
        </div>

        <div
          onClick={() => setActiveTab('Draft')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'Draft'
              ? 'bg-slate-100 border-slate-400 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Drafts</div>
          <div className="text-2xl font-bold text-slate-700 mt-1">{summary.Draft || 0}</div>
        </div>

        <div
          onClick={() => setActiveTab('Quotation')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'Quotation'
              ? 'bg-blue-50/70 border-blue-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Open / Sent</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{summary.Quotation || 0}</div>
        </div>

        <div
          onClick={() => setActiveTab('Confirmed')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'Confirmed'
              ? 'bg-amber-50/70 border-amber-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Confirmed</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{summary.Confirmed || 0}</div>
        </div>

        <div
          onClick={() => setActiveTab('Active')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'Active'
              ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Active Subs</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{summary.Active || 0}</div>
        </div>

        <div
          className="p-4 rounded-xl border bg-white border-slate-200"
        >
          <div className="text-xs font-medium text-rose-600 uppercase tracking-wider">Expired</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{summary.Expired || 0}</div>
        </div>
      </div>

      {/* Search & Tabs Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quotation #, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQuotations}
            title="Refresh"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm">Loading quotations...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Quotations Found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {search
                ? `No matching records found for "${search}"`
                : 'Get started by creating your first customer quotation.'}
            </p>
            {canManage && (
              <button
                onClick={() => navigate('/quotations/new')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create New Quotation
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Quotation #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Items Breakdown</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => {
                  const isExpired = new Date(q.expiryDate) < new Date();
                  const totalItems = (q.products?.length || 0) + (q.plans?.length || 0);

                  return (
                    <tr
                      key={q._id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/quotations/${q._id}`)}
                    >
                      {/* Quotation Number */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5">
                          {q.quotationNumber}
                        </div>
                        {q.quotationTemplate && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            {q.quotationTemplate.name}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {q.customer?.name || 'Unknown Customer'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {q.customer?.company || q.customer?.email}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        {new Date(q.createdDate).toLocaleDateString()}
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className={`font-medium ${
                            isExpired && q.status !== 'Active' && q.status !== 'Closed'
                              ? 'text-rose-600 font-semibold flex items-center gap-1'
                              : 'text-slate-700'
                          }`}
                        >
                          {isExpired && q.status !== 'Active' && q.status !== 'Closed' && (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          {new Date(q.expiryDate).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {q.validityDuration} days validity
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                          {totalItems} {totalItems === 1 ? 'item' : 'items'}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                          {q.plans?.length > 0
                            ? q.plans[0].name
                            : q.products?.length > 0
                            ? q.products[0].name
                            : 'No lines'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {q.currencySymbol || '₹'}
                        {Number(q.totalAmount || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(q.status, isExpired)}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail */}
                          <button
                            onClick={() => navigate(`/quotations/${q._id}`)}
                            title="View Detail"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print / PDF */}
                          <button
                            onClick={() => navigate(`/quotations/${q._id}/print`)}
                            title="Print / PDF View"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Convert to Subscription if Confirmed */}
                          {canManage && q.status === 'Confirmed' && !isExpired && (
                            <button
                              onClick={() => handleConvertToSubscription(q)}
                              disabled={actionLoading === q._id}
                              title="Convert to Active Subscription"
                              className="px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1 shadow-sm transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Convert
                            </button>
                          )}

                          {/* Edit if Draft or Quotation */}
                          {canManage && (q.status === 'Draft' || q.status === 'Quotation') && (
                            <button
                              onClick={() => navigate(`/quotations/${q._id}/edit`)}
                              title="Edit Quotation"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete if Admin and not Active */}
                          {isAdmin && q.status !== 'Active' && (
                            <button
                              onClick={() => handleDeleteQuotation(q._id, q.quotationNumber)}
                              title="Delete Quotation"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationList;

