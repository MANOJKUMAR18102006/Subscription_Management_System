/**
 * Date filter helper for dashboard metrics and aggregations
 * Supported periods: 'today', 'this_month', 'last_month', 'this_year', 'all'
 */
const getDateRange = (period = 'this_month') => {
  const now = new Date();
  let startDate;
  let endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  switch (period.toLowerCase()) {
    case 'today': {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'this_month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    }
    case 'last_month': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case 'this_year': {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    }
    case 'all':
    default: {
      startDate = new Date(2020, 0, 1, 0, 0, 0, 0);
      break;
    }
  }

  return {
    period: period.toLowerCase(),
    startDate,
    endDate
  };
};

module.exports = {
  getDateRange
};

