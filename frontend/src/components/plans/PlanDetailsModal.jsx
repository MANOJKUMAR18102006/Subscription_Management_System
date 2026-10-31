import React from 'react';
import {
  X,
  Package,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Users,
  Info,
  DollarSign,
  Tag,
  Ban,
  Check
} from 'lucide-react';

const PlanDetailsModal = ({ isOpen, onClose, plan, onEdit, onSubscribe }) => {
  if (!isOpen || !plan) return null;

  const now = new Date();
  const isAvailable =
    plan.status === 'Active' &&
    (!plan.availableFrom || now >= new Date(plan.availableFrom)) &&
    (!plan.availableUntil || now <= new Date(plan.availableUntil));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    plan.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : plan.status === 'Closed'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {plan.status}
                </span>
                {isAvailable ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Available Now
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Not Open For New Signups
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Plan ID: <span className="font-mono">{plan._id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Pricing Card Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg border border-slate-800">
            <div>
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">
                Subscription Plan Pricing
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">
                  {plan.currencySymbol || '₹'}{Number(plan.price || 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  / {plan.billingFrequency}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {plan.description || 'Standard operational subscription plan with contract terms.'}
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Minimum Order</span>
                <span className="text-sm font-bold text-white">{plan.minQuantity || 1} Unit(s)</span>
              </div>
              <div className="text-right border-l sm:border-l-0 sm:border-t border-slate-700 pl-3 sm:pl-0 sm:pt-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Contracts</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 justify-end">
                  <Users className="w-3.5 h-3.5" />
                  {plan.activeSubscriptionsCount || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Requirement 7: Price Lock Guarantee Note */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <span className="font-bold">Requirement 7 Agreed Pricing Guarantee:</span>
              <p className="mt-0.5 text-blue-800 leading-relaxed">
                Existing subscriptions retain their original agreed pricing (frozen in the subscription record) even if an administrator subsequently changes this plan's rates or terms.
              </p>
            </div>
          </div>

          {/* Section 1: Linked Products */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              Linked Products (Requirement 1: {plan.linkedProducts?.length || 0} Products)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plan.linkedProducts?.map((lp, idx) => {
                const prod = lp.product || {};
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{prod.name || 'Product'}</p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {prod.productType || 'Software'} • Base: ₹{prod.salesPrice || 0}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {lp.isPrimary && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                      <p className="text-[10px] text-slate-500 mt-1">Min: {lp.minQuantity || 1} unit(s)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Availability Schedule & Lifecycle Permissions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Availability Schedule (Req 3 & 4) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Availability Window
              </h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Available From:</span>
                  <span className="font-semibold text-slate-800">
                    {plan.availableFrom ? new Date(plan.availableFrom).toLocaleDateString() : 'Immediate'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Available Until:</span>
                  <span className="font-semibold text-slate-800">
                    {plan.availableUntil ? new Date(plan.availableUntil).toLocaleDateString() : 'Perpetual (No end date)'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Auto Close on Expiration:</span>
                  <span
                    className={`font-semibold ${
                      plan.autoClose ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {plan.autoClose ? 'Enabled (Auto transitions to Closed)' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lifecycle Contract Permissions (Req 5) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                Contract Permissions (Requirement 5)
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Allow Early Closure:</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      plan.allowEarlyClosure ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {plan.allowEarlyClosure ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Allowed
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" /> Prohibited
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Allow Pausing:</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      plan.allowPause ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {plan.allowPause ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Allowed
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" /> Prohibited
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Allow Renewal:</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      plan.allowRenewal ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {plan.allowRenewal ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Allowed
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" /> Prohibited
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Feature Entitlements */}
          {plan.features && plan.features.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Entitlements & Included Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {plan.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(plan);
                }}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Edit Plan
              </button>
            )}
            {onSubscribe && isAvailable && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSubscribe(plan);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Subscribe / Test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanDetailsModal;
