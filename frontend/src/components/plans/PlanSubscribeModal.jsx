import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

const PlanSubscribeModal = ({ isOpen, onClose, plan, onSubscribed }) => {
  if (!isOpen || !plan) return null;

  const [quantity, setQuantity] = useState(plan.minQuantity || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const unitPrice = plan.price || 0;
  const totalAmount = unitPrice * Number(quantity || 0);
  const isBelowMin = Number(quantity) < (plan.minQuantity || 1);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setError('');

    if (isBelowMin) {
      setError(`Minimum quantity requirement not met: this plan requires at least ${plan.minQuantity} unit(s).`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/subscriptions', {
        planId: plan._id,
        quantity: Number(quantity)
      });

      if (res.data.success) {
        setSuccessData(res.data.subscription);
        if (onSubscribed) {
          onSubscribed(res.data.subscription);
        }
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.response?.data?.message || 'Failed to create subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Subscribe to Plan</h2>
              <p className="text-[11px] text-slate-500">{plan.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {successData ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Subscription Activated!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Agreed terms locked: {plan.currencySymbol || '₹'}{Number(successData.amount).toLocaleString()} billed{' '}
                  {successData.billingFrequency || plan.billingFrequency}.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Subscription ID:</span>
                  <span className="font-mono text-slate-800">{successData._id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity Ordered:</span>
                  <span className="font-semibold text-slate-800">{successData.quantity} Unit(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Price per Unit:</span>
                  <span className="font-semibold text-slate-800">₹{successData.unitPrice}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                  <span>Total Recurring Rate:</span>
                  <span className="text-blue-600">₹{successData.amount} / {successData.billingFrequency}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Plan Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Plan Selected</p>
                  <p className="text-sm font-bold text-white">{plan.name}</p>
                  <p className="text-[11px] text-slate-400">
                    ₹{unitPrice} / {plan.billingFrequency}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Min Quantity</span>
                  <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {plan.minQuantity || 1} units
                  </span>
                </div>
              </div>

              {/* Quantity Input (Requirement 2) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subscription Quantity <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={plan.minQuantity || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-semibold ${
                      isBelowMin
                        ? 'border-rose-300 bg-rose-50/50 text-rose-800 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                </div>
                {isBelowMin ? (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Minimum quantity for this plan is {plan.minQuantity} unit(s).
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter the number of seats / licenses to subscribe to.
                  </p>
                )}
              </div>

              {/* Total Calculation & Agreed Price Lock Banner (Requirement 7) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Unit Price:</span>
                  <span className="font-semibold text-slate-800">₹{unitPrice}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Quantity:</span>
                  <span className="font-semibold text-slate-800">× {quantity || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Agreed Recurring Total:</span>
                  <span className="text-blue-600 text-base">
                    ₹{totalAmount.toLocaleString()} / {plan.billingFrequency}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Rate will be locked into your contract under agreed terms.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isBelowMin}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      Confirm Subscription
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanSubscribeModal;
