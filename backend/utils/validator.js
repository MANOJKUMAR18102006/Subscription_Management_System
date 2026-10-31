/**
 * Email and Password Validation Helpers
 * 
 * Password requirements:
 * - Contain more than 8 characters (length > 8)
 * - Include at least one uppercase letter ([A-Z])
 * - Include at least one lowercase letter ([a-z])
 * - Include at least one special character
 */

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const validatePassword = (password) => {
  const errors = [];
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required']
    };
  }

  if (password.length <= 8) {
    errors.push('Password must contain more than 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter');
  }

  // Any non-alphanumeric character is considered special
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push('Password must include at least one special character (e.g. !@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateEmail,
  validatePassword
};

