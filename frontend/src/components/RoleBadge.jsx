import React from 'react';
import { Shield, Briefcase, UserCheck } from 'lucide-react';

const RoleBadge = ({ role, size = 'md' }) => {
  const normalizedRole = (role || 'customer').toLowerCase();

  const configs = {
    admin: {
      label: 'Admin',
      bgColor: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20',
      icon: Shield,
      dotColor: 'bg-purple-600'
    },
    staff: {
      label: 'Staff',
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
      icon: Briefcase,
      dotColor: 'bg-amber-600'
    },
    customer: {
      label: 'Customer',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
      icon: UserCheck,
      dotColor: 'bg-emerald-600'
    }
  };

  const current = configs[normalizedRole] || configs.customer;
  const Icon = current.icon;

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1.5'
    : 'text-xs font-semibold px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs ring-1 ring-inset ${current.bgColor} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor} animate-pulse`} />
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{current.label}</span>
    </span>
  );
};

export default RoleBadge;

