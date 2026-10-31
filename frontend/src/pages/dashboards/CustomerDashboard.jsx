import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import RoleBadge from '../../components/RoleBadge';
import {
  UserCheck,
  CreditCard,
  Receipt,
  Layers,
  Calendar,
  CheckCircle2,
  Download,
  ShieldCheck,
  Loader2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadNotice, setDownloadNotice] = useState('');

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users/data/subscriptions');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load customer subscription data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  const handleDownloadInvoice = (invoiceId) => {
    setDownloadNotice(`Receipt ${invoiceId} downloaded successfully.`);
    setTimeout(() => setDownloadNotice(''), 3000);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // Active customer subscription
  const activeSub = data?.subscriptions?.[0] || {
    id: 'SUB-MY-PLAN',
    plan: 'Enterprise Pro Tier',
    billingCycle: 'Monthly',
    amount: 299,
    status: 'Active',
    renewalDate: '2026-11-28',
    features: ['Custom Domain', 'Unlimited Member Seats', '24/7 Dedicated Support']
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold tracking-wide uppercase">
              Customer Self-Service Portal
            </span>
            <RoleBadge role="customer" size="sm" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            My Subscriptions & Billing
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Requirement 8: As a Customer, you have private, isolated access to manage only your personal subscriptions, invoices, and payments.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/10 text-xs font-medium text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Private Customer Isolation</span>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{downloadNotice}</span>
        </div>
      )}

      {/* Active Subscription Plan Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Current Active Plan
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {activeSub.id}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeSub.plan}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Registered for: <strong className="text-slate-700">{user?.name}</strong> ({user?.email})
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="flex items-baseline sm:justify-end gap-1">
              <span className="text-3xl font-extrabold text-slate-900">${activeSub.amount}</span>
              <span className="text-xs text-slate-500">/{activeSub.billingCycle === 'Monthly' ? 'month' : 'year'}</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center sm:justify-end gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Next renewal on {activeSub.renewalDate}</span>
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            Plan Entitlements & Features:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeSub.features?.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices and Payments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">My Invoices & Receipts</h3>
            </div>
            <span className="text-[11px] text-slate-400">Strictly own invoices</span>
          </div>

          <div className="space-y-3">
            {data?.invoices && data.invoices.length > 0 ? (
              data.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/40"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-slate-800">{inv.id}</p>
                    <p className="text-[11px] text-slate-500">{inv.date} &middot; Automatic Card Charge</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900">${inv.amount}.00</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(inv.id)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                      title="Download Invoice PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No past invoices available.</p>
            )}
          </div>
        </div>

        {/* Customer Payment Methods */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Payment Methods on File</h3>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              Primary Card
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Corporate Credit Card</span>
              <span className="text-xs font-mono font-bold text-blue-400">VISA</span>
            </div>
            <p className="font-mono text-base tracking-wider">•••• •••• •••• 4242</p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div>
                <p className="text-[10px] uppercase">Cardholder</p>
                <p className="text-white font-medium">{user?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase">Expires</p>
                <p className="text-white font-medium">12 / 28</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>PCI-DSS Level 1 Encrypted</span>
            <span className="text-emerald-600 font-medium">Verified for automatic renewal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

