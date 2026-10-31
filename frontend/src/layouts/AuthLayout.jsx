import React from 'react';
import { Sparkles, Shield, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle, showBrandBadge = true }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left/Form Section */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Header & Logo */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                SubScribe <span className="text-blue-600">SaaS</span>
              </span>
            </Link>

            {showBrandBadge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
                <Shield className="w-3.5 h-3.5" />
                <span>Enterprise Identity & RBAC</span>
              </div>
            )}

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Card / Form */}
          <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/50">
            {children}
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center text-xs text-slate-400">
            &copy; 2026 SubScribe Management Systems. Secure 256-bit JWT Encryption.
          </div>
        </div>
      </div>

      {/* Right Hero / Showcase Banner (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-12 text-white flex-col justify-between overflow-hidden">
        {/* Abstract decorative ambient blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-blue-400">Module 1</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-300">Identity & Role-Based Access Control</span>
          </div>
          <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium border border-white/10 text-blue-200 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>OWASP Compliant</span>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h3 className="text-3xl font-bold leading-tight tracking-tight text-white">
            Secure, scalable subscription governance for modern businesses.
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Role-tailored interfaces for Administrators, Support Staff, and Subscribers with strict API middleware barriers.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-xs">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                ADM
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Complete System Access</p>
                <p className="text-slate-400">Staff creation, audit logs, and global billing governance</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                STF
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Daily Operations Desk</p>
                <p className="text-slate-400">Subscriber assistance, invoice verification, and support</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                CST
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Customer Self-Service</p>
                <p className="text-slate-400">Strictly isolated access to own subscriptions and payments</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>MERN Stack (MongoDB, Express, React, Node.js)</span>
          </div>
          <span>Bcrypt &middot; JWT &middot; Nodemailer</span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

