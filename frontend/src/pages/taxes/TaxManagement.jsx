import React, { useState, useEffect } from 'react';
import {
  Percent,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Calculator,
  Calendar,
  AlertCircle,
  DollarSign,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import TaxFormModal from './TaxFormModal';

const TaxManagement = () => {
  const { user } = useAuth();
  const canManage = ['admin', 'staff'].includes(user?.role);

  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Live Calculator State
  const [calcAmount, setCalcAmount] = useState(1000);
  const [calcQty, setCalcQty] = useState(1);
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/taxes');
      if (res.data.success) {
        setTaxes(res.data.taxes || []);
      }
    } catch (err) {
      console.error('Error fetching taxes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  // Run live tax calculation test
  const runTaxCalculation = async () => {
    try {
      setCalcLoading(true);
      const res = await api.post('/taxes/calculate', {
        amount: Number(calcAmount) || 0,
        quantity: Number(calcQty) || 1
      });
      if (res.data.success) {
        setCalcResult(res.data);
      }
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  useEffect(() => {
    if (taxes.length > 0) {
      runTaxCalculation();
    }
  }, [calcAmount, calcQty, taxes]);

  const handleToggleStatus = async (tax) => {
    try {
      const newStatus = tax.status === 'active' ? 'inactive' : 'active';
      await api.put(`/taxes/${tax._id}`, { status: newStatus });
      setToastMessage(`Tax '${tax.name}' marked as ${newStatus}`);
      fetchTaxes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteTax = async (tax) => {
    if (!window.confirm(`Are you sure you want to delete tax rule '${tax.name}'?`)) return;
    try {
      await api.delete(`/taxes/${tax._id}`);
      setToastMessage(`Tax '${tax.name}' deleted successfully`);
      fetchTaxes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete tax rule');
    }
  };

  // Filtered Taxes
  const filteredTaxes = taxes.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Metrics
  const activeCount = taxes.filter((t) => t.status === 'active').length;
  const pctCount = taxes.filter((t) => t.type === 'percentage').length;
  const fixedCount = taxes.filter((t) => t.type === 'fixed').length;

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
            <Percent className="w-7 h-7 text-blue-600" />
            Tax Rules & Rates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage system-wide tax rules, percentage and fixed rates, effective date ranges, and invoice calculation breakdowns
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setSelectedTax(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            New Tax Rule
          </button>
        )}
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tax Rules</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{taxes.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Rules</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Percentage (%) Taxes</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{pctCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fixed Surcharges</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{fixedCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Live Tax Breakdown Simulator */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              Live Invoice Tax Calculation & Breakdown Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate how all currently active tax rules calculate on any base invoice amount
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300 font-medium">Base Amount (₹):</label>
              <input
                type="number"
                min="0"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                className="w-28 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white rounded-lg border-0 focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300 font-medium">Qty:</label>
              <input
                type="number"
                min="1"
                value={calcQty}
                onChange={(e) => setCalcQty(e.target.value)}
                className="w-16 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white rounded-lg border-0 focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Calculation Result */}
        {calcResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase font-semibold">Base Taxable Total</p>
              <p className="text-xl font-bold text-white">₹{calcResult.baseAmount?.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-blue-300 uppercase font-semibold">Total Applicable Taxes</p>
              <p className="text-xl font-bold text-blue-400">+ ₹{calcResult.totalTax?.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-emerald-300 uppercase font-semibold">Grand Total With Taxes</p>
              <p className="text-2xl font-black text-emerald-400">₹{calcResult.grandTotal?.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Itemized Tax Breakdown Cards */}
        {calcResult?.breakdown && calcResult.breakdown.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700/60 flex flex-wrap gap-2.5">
            {calcResult.breakdown.map((item, idx) => (
              <div
                key={idx}
                className="px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs flex items-center gap-2"
              >
                <span className="font-semibold text-slate-200">{item.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono text-[10px]">
                  {item.rateLabel || `${item.rate}%`}
                </span>
                <span className="font-bold text-blue-400 font-mono">₹{item.taxAmount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Tax Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Surcharge (₹)</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Tax Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Rule Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Rate / Amount</th>
                <th className="px-6 py-4">Effective Range</th>
                <th className="px-6 py-4">Status</th>
                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading tax rules...
                  </td>
                </tr>
              ) : filteredTaxes.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-6 py-12 text-center text-slate-400">
                    No tax rules found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTaxes.map((tax) => {
                  const isActive = tax.status === 'active';
                  const effectiveFrom = tax.effectiveFrom ? new Date(tax.effectiveFrom).toLocaleDateString() : 'Immediate';
                  const effectiveUntil = tax.effectiveUntil ? new Date(tax.effectiveUntil).toLocaleDateString() : 'Indefinite';

                  return (
                    <tr key={tax._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{tax.name}</div>
                        {tax.description && (
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{tax.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-600 text-xs">
                        {tax.code}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            tax.type === 'percentage'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {tax.type === 'percentage' ? (
                            <>
                              <Percent className="w-3 h-3" /> Percentage
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3 h-3" /> Fixed
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {tax.type === 'percentage' ? `${tax.rate}%` : `₹${tax.rate}`}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{effectiveFrom} → {effectiveUntil}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => canManage && handleToggleStatus(tax)}
                          disabled={!canManage}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                            </>
                          )}
                        </button>
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTax(tax);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Tax Rule"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTax(tax)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Tax Rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Form Modal */}
      <TaxFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTax={selectedTax}
        onSuccess={(msg) => {
          setToastMessage(msg);
          fetchTaxes();
        }}
      />
    </div>
  );
};

export default TaxManagement;

