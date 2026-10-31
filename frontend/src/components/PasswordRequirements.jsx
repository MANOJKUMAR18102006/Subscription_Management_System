import React from 'react';
import { Check, X } from 'lucide-react';

export const checkPasswordCriteria = (password = '', confirmPassword = '') => {
  const hasMinLength = password.length > 8; // More than 8 characters
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  const passwordsMatch = confirmPassword !== '' ? password === confirmPassword : true;

  const score = [hasMinLength, hasUpperCase, hasLowerCase, hasSpecialChar].filter(Boolean).length;
  const allMet = hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar;

  return {
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasSpecialChar,
    passwordsMatch,
    score,
    allMet
  };
};

const PasswordRequirements = ({ password = '', confirmPassword = '', showMatch = false }) => {
  const criteria = checkPasswordCriteria(password, confirmPassword);

  const requirements = [
    { label: 'More than 8 characters (at least 9)', met: criteria.hasMinLength },
    { label: 'At least one uppercase letter (A-Z)', met: criteria.hasUpperCase },
    { label: 'At least one lowercase letter (a-z)', met: criteria.hasLowerCase },
    { label: 'At least one special character (!@#$%^&*)', met: criteria.hasSpecialChar }
  ];

  if (showMatch && confirmPassword) {
    requirements.push({
      label: 'Passwords match',
      met: criteria.passwordsMatch
    });
  }

  // Calculate strength percentage
  const strengthPercentage = (criteria.score / 4) * 100;
  let strengthColor = 'bg-red-500';
  let strengthLabel = 'Weak';

  if (criteria.score === 4) {
    strengthColor = 'bg-emerald-500';
    strengthLabel = 'Strong';
  } else if (criteria.score >= 2) {
    strengthColor = 'bg-amber-500';
    strengthLabel = 'Medium';
  }

  return (
    <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2.5">
      {password && (
        <div className="space-y-1">
          <div className="flex justify-between items-center text-slate-600 font-medium">
            <span>Password Strength:</span>
            <span className={`font-semibold ${
              criteria.score === 4 ? 'text-emerald-600' : criteria.score >= 2 ? 'text-amber-600' : 'text-red-500'
            }`}>
              {strengthLabel}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${strengthColor}`}
              style={{ width: `${strengthPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5 pt-1">
        <p className="font-semibold text-slate-700">Security Criteria:</p>
        {requirements.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 transition-colors ${
              item.met ? 'text-emerald-700 font-medium' : 'text-slate-500'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                item.met ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'
              }`}
            >
              {item.met ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordRequirements;

