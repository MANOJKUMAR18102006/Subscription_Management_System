import React, { useState } from 'react';
import {
  X,
  Package,
  Layers,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Tag,
  DollarSign,
  TrendingUp,
  Archive,
  CheckCircle2
} from 'lucide-react';

const ProductDetailsModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  const currencySymbol = product.currencySymbol || '₹';
  const basePrice = Number(product.salesPrice) || 0;
  const costPrice = Number(product.costPrice) || 0;
  const profit = Math.max(0, basePrice - costPrice);
  const margin = basePrice > 0 ? Math.round((profit / basePrice) * 100) : 0;

  // Selected options state for the interactive price calculator
  const [selectedVariantOptions, setSelectedVariantOptions] = useState(() => {
    const initial = {};
    if (Array.isArray(product.variants)) {
      product.variants.forEach((v) => {
        if (v.name && v.options && v.options.length > 0) {
          initial[v.name] = v.options[0].value;
        }
      });
    }
    return initial;
  });

  const handleSelectOption = (variantName, optionValue) => {
    setSelectedVariantOptions((prev) => ({
      ...prev,
      [variantName]: optionValue
    }));
  };

  // Compute final price
  let additionalTotal = 0;
  const breakdownList = [];

  if (Array.isArray(product.variants)) {
    product.variants.forEach((v) => {
      const selectedValue = selectedVariantOptions[v.name];
      const opt = v.options?.find((o) => o.value === selectedValue);
      if (opt) {
        const add = Number(opt.additionalPrice) || 0;
        additionalTotal += add;
        breakdownList.push({
          variantName: v.name,
          optionValue: opt.value,
          additionalPrice: add,
          sku: opt.sku
        });
      }
    });
  }

  const finalCalculatedPrice = basePrice + additionalTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">{product.name}</h2>
              <span className="text-[11px] text-blue-300 font-medium">
                {product.productType} &middot; {product.status}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Active Subscriptions Warning Banner if linked */}
          {product.activeSubscriptionsCount > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Active Subscription Protection Active</p>
                <p className="text-amber-700 text-[11px] mt-0.5">
                  This product is linked to <strong>{product.activeSubscriptionsCount} active subscription(s)</strong>.
                  Direct deletion is prevented to maintain customer contracts. Use safe archiving when discontinuing.
                </p>
              </div>
            </div>
          )}

          {/* Pricing Overview Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Base Sales Price</span>
              <p className="text-xl font-extrabold text-slate-900">
                {currencySymbol}{basePrice.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cost to Business</span>
              <p className="text-xl font-extrabold text-slate-600">
                {currencySymbol}{costPrice.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-1">Profit Margin</span>
              <p className="text-xl font-extrabold text-emerald-700">
                {margin}%
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">
                +{currencySymbol}{profit.toLocaleString()} / unit
              </span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 leading-relaxed">
              <span className="font-semibold text-slate-800 block mb-1">Description:</span>
              {product.description}
            </div>
          )}

          {/* Interactive Automatic Price Calculator */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Automatic Final Price Calculator
                </h3>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Live Formula
              </span>
            </div>

            {product.variants && product.variants.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-300">
                  Select variant options below to observe real-time price derivation:
                </p>

                {product.variants.map((variant) => (
                  <div key={variant._id || variant.name} className="space-y-1.5">
                    <span className="text-xs font-semibold text-indigo-300">
                      Variant: {variant.name}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {variant.options?.map((opt) => {
                        const isSelected = selectedVariantOptions[variant.name] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelectOption(variant.name, opt.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs font-bold ring-2 ring-blue-400/50'
                                : 'bg-white/10 text-slate-200 hover:bg-white/20'
                            }`}
                          >
                            <span>{opt.value}</span>
                            <span className="text-[10px] opacity-80">
                              (+{currencySymbol}{opt.additionalPrice || 0})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Live Formula Display */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Base Sales Price:</span>
                      <span className="font-semibold text-white">{currencySymbol}{basePrice.toLocaleString()}</span>
                    </div>

                    {breakdownList.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-emerald-300 text-[11px]">
                        <span>+ {item.variantName}: {item.optionValue}</span>
                        <span>+{currencySymbol}{item.additionalPrice.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        Final Calculated Price
                      </span>
                      <span className="text-xs text-slate-300">
                        Base Price + Variant Additional Prices
                      </span>
                    </div>
                    <span className="text-2xl font-extrabold text-emerald-400">
                      {currencySymbol}{finalCalculatedPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Standard Product (No variants configured):</span>
                <span className="text-xl font-extrabold text-emerald-400">
                  {currencySymbol}{basePrice.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Pricing Matrix Breakdown Table */}
          {product.pricingMatrix && product.pricingMatrix.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Variant Option Catalog Matrix ({product.pricingMatrix.length} options)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="px-4 py-2">Variant</th>
                      <th className="px-4 py-2">Option Value</th>
                      <th className="px-4 py-2">Base Price</th>
                      <th className="px-4 py-2">Additional</th>
                      <th className="px-4 py-2 text-right">Final Calculated Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {product.pricingMatrix.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2 font-medium text-slate-700">{item.variantName}</td>
                        <td className="px-4 py-2 font-bold text-slate-900">{item.optionValue}</td>
                        <td className="px-4 py-2 text-slate-500">{currencySymbol}{item.basePrice}</td>
                        <td className="px-4 py-2 text-emerald-600 font-semibold">+{currencySymbol}{item.additionalPrice}</td>
                        <td className="px-4 py-2 text-right font-bold text-slate-900">
                          {currencySymbol}{item.finalPrice}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;

