import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Home } from 'lucide-react';

const NotFound = () => {
  const { user, getDashboardPath } = useAuth();
  const targetPath = user?.role ? getDashboardPath(user.role) : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            HTTP 404 &middot; Page Not Found
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Lost in the Cloud?
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            The page you requested could not be found or has been moved to another location.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to={targetPath}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all inline-flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

