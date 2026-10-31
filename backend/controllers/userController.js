const User = require('../models/User');
const { validateEmail, validatePassword } = require('../utils/validator');

/**
 * @desc    Create a new Staff account (Admin only)
 * @route   POST /api/users/staff
 * @access  Private (Admin only)
 */
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, company, phone } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and confirm password are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.errors[0],
        errors: passwordValidation.errors
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Role is strictly set to staff
    const staff = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'staff',
      company: company ? company.trim() : 'Operations Staff',
      phone: phone ? phone.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: `Staff account created successfully for ${staff.name}`,
      user: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        company: staff.company,
        phone: staff.phone,
        isActive: staff.isActive,
        createdAt: staff.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (with optional role or search filter)
 * @route   GET /api/users
 * @access  Private (Admin & Staff)
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, status } = req.query;

    const query = {};

    // Staff can only view customers and other staff (admin view is protected)
    if (req.user.role === 'staff') {
      query.role = { $in: ['staff', 'customer'] };
    } else if (role) {
      query.role = role;
    }

    if (status) {
      query.isActive = status === 'active';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user details
 * @route   GET /api/users/:id
 * @access  Private (Owner, Staff, or Admin)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Customer can only view their own record
    if (req.user.role === 'customer' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own profile.'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/users/:id/toggle-status
 * @access  Private (Admin only)
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}`,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: `User '${user.name}' has been permanently deleted`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system overview statistics
 * @route   GET /api/users/stats/overview
 * @access  Private (Admin & Staff)
 */
exports.getSystemStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const staffCount = await User.countDocuments({ role: 'staff' });
    const customerCount = await User.countDocuments({ role: 'customer' });
    const activeUsers = await User.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        adminCount,
        staffCount,
        customerCount,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Role-Specific Subscription / Invoice / Payment Records
 *          Demonstrating Requirement 8:
 *          - Customer: Can access only their own subscriptions, invoices and payments.
 *          - Staff: Limited access to daily operations.
 *          - Admin: Complete system access.
 * @route   GET /api/users/data/subscriptions
 * @access  Private
 */
exports.getRoleData = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    // Demo data repository tied to current user context
    const mockSubscriptions = [
      {
        id: 'SUB-1001',
        customerName: req.user.name,
        customerEmail: req.user.email,
        customerId: req.user._id.toString(),
        plan: 'Enterprise Pro',
        billingCycle: 'Monthly',
        amount: 299,
        currency: 'USD',
        status: 'Active',
        renewalDate: '2026-11-28',
        features: ['Priority SLA', 'Unlimited Seats', 'Dedicated Account Manager']
      },
      {
        id: 'SUB-1002',
        customerName: 'Sarah Jenkins',
        customerEmail: 'sarah@acmecorp.com',
        customerId: 'customer_acme_1',
        plan: 'Starter Plan',
        billingCycle: 'Annual',
        amount: 890,
        currency: 'USD',
        status: 'Active',
        renewalDate: '2027-01-15',
        features: ['Standard Support', '5 Seats']
      },
      {
        id: 'SUB-1003',
        customerName: 'Marcus Vance',
        customerEmail: 'marcus@nexustech.io',
        customerId: 'customer_nexus_2',
        plan: 'Growth Tier',
        billingCycle: 'Monthly',
        amount: 149,
        currency: 'USD',
        status: 'Past Due',
        renewalDate: '2026-10-30',
        features: ['Standard Support', '15 Seats']
      }
    ];

    const mockInvoices = [
      {
        id: 'INV-2026-089',
        customerId: req.user._id.toString(),
        customerName: req.user.name,
        date: '2026-10-01',
        amount: 299,
        status: 'Paid',
        downloadUrl: '#'
      },
      {
        id: 'INV-2026-042',
        customerId: req.user._id.toString(),
        customerName: req.user.name,
        date: '2026-09-01',
        amount: 299,
        status: 'Paid',
        downloadUrl: '#'
      },
      {
        id: 'INV-2026-099',
        customerId: 'customer_acme_1',
        customerName: 'Sarah Jenkins',
        date: '2026-10-15',
        amount: 890,
        status: 'Paid',
        downloadUrl: '#'
      }
    ];

    const mockPayments = [
      {
        id: 'PAY-9041',
        customerId: req.user._id.toString(),
        method: 'Visa •••• 4242',
        date: '2026-10-01',
        amount: '$299.00',
        status: 'Succeeded'
      },
      {
        id: 'PAY-8820',
        customerId: req.user._id.toString(),
        method: 'Visa •••• 4242',
        date: '2026-09-01',
        amount: '$299.00',
        status: 'Succeeded'
      },
      {
        id: 'PAY-9055',
        customerId: 'customer_acme_1',
        method: 'Mastercard •••• 8812',
        date: '2026-10-15',
        amount: '$890.00',
        status: 'Succeeded'
      }
    ];

    if (userRole === 'customer') {
      // Customer: Can access ONLY their own subscriptions, invoices and payments
      return res.status(200).json({
        success: true,
        role: 'customer',
        subscriptions: mockSubscriptions.filter(s => s.customerId === req.user._id.toString()),
        invoices: mockInvoices.filter(i => i.customerId === req.user._id.toString()),
        payments: mockPayments.filter(p => p.customerId === req.user._id.toString())
      });
    }

    if (userRole === 'staff') {
      // Staff: Limited access to daily operations (active subscriptions & operations)
      return res.status(200).json({
        success: true,
        role: 'staff',
        operationalScope: 'Daily Operations & Subscriber Management',
        subscriptions: mockSubscriptions,
        invoices: mockInvoices,
        payments: mockPayments
      });
    }

    // Admin: Complete system access
    return res.status(200).json({
      success: true,
      role: 'admin',
      operationalScope: 'Full System & Financial Governance Access',
      subscriptions: mockSubscriptions,
      invoices: mockInvoices,
      payments: mockPayments,
      systemAudits: [
        { id: 'AUD-1', action: 'User login', user: req.user.email, timestamp: new Date() },
        { id: 'AUD-2', action: 'Subscription renewal checked', user: 'System Cron', timestamp: new Date() }
      ]
    });
  } catch (error) {
    next(error);
  }
};

