/**
 * Processes raw trend data from the API into a format suitable for recharts.
 * It initializes a date range and then populates it with data.
 * @param {Array<object>} rawData - The raw data array from the API.
 * @param {string} dateKey - The key in the raw data that contains the date string (e.g., 'PAYMENT_MONTH').
 * @param {object} dateLabelFormat - The format object for `toLocaleDateString` (e.g., { month: 'short' }).
 * @param {number} length - The number of periods to include in the chart (e.g., 12 for 12 months).
 * @param {function(Date, number): void} dateIncrement - A function to modify the date for each period in the loop.
 * @returns {Array<object>} The processed data array ready for charting.
 */
export const processTrendData = (rawData, dateKey, dateLabelFormat, length, dateIncrement) => {
  const dataMap = new Map();

  for (let i = 0; i < length; i++) {
    const d = new Date();
    dateIncrement(d, i);
    const key = d.toISOString().split('T')[0].slice(0, dateKey === 'PAYMENT_YEAR' ? 4 : (dateKey === 'PAYMENT_MONTH' ? 7 : 10));
    const label = d.toLocaleDateString('en-US', dateLabelFormat);
    dataMap.set(key, { date: label, total: 0, online: 0, cash: 0, instore: 0, total_count: 0, online_count: 0, cash_count: 0, instore_count: 0 });
  }

  if (rawData) {
    rawData.forEach(p => {
      const key = p[dateKey].slice(0, dateKey === 'PAYMENT_YEAR' ? 4 : (dateKey === 'PAYMENT_MONTH' ? 7 : 10));
      if (dataMap.has(key)) {
        const entry = dataMap.get(key);
        const amount = p.TOTAL_AMOUNT || 0;
        const count = p.PAYMENT_COUNT || 0;
        const type = p.PAYMENT_TYPE?.toLowerCase() || 'online';
        if (entry.hasOwnProperty(type)) {
          entry[type] = amount;
          entry[`${type}_count`] = count;
        }
        entry.total += amount;
        entry.total_count += count;
      }
    });
  }

  return Array.from(dataMap.values()).reverse();
};

/**
 * Processes raw yearly payment data into a format suitable for recharts.
 * @param {Array<object>} yearlyPayments - The raw yearly payments array from the API.
 * @returns {Array<object>} The processed data array ready for charting.
 */
export const processYearlyPaymentData = (yearlyPayments) => {
  if (!yearlyPayments) return [];
  const dataMap = new Map();
  yearlyPayments.forEach(p => {
    const year = p.PAYMENT_YEAR;
    if (!dataMap.has(year)) {
      dataMap.set(year, { year, total: 0, online: 0, cash: 0, instore: 0, total_count: 0, online_count: 0, cash_count: 0, instore_count: 0 });
    }
    const entry = dataMap.get(year);
    const amount = p.TOTAL_AMOUNT || 0;
    const count = p.PAYMENT_COUNT || 0;
    const type = p.PAYMENT_TYPE?.toLowerCase() || 'online';
    if (entry.hasOwnProperty(type)) {
      entry[type] = amount;
      entry[`${type}_count`] = count;
    }
    entry.total += amount;
    entry.total_count += count;
  });
  return Array.from(dataMap.values());
};

/**
 * Processes raw customer growth data into a format suitable for recharts.
 * @param {Array<object>} customerGrowth - The raw customer growth array from the API.
 * @returns {Array<object>} The processed data array ready for charting.
 */
export const processCustomerGrowthData = (customerGrowth) => {
  if (!customerGrowth) return [];
  const dataMap = new Map();
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    dataMap.set(key, { date: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), count: 0 });
  }
  customerGrowth.forEach(item => {
    if (dataMap.has(item.CREATION_MONTH)) {
      dataMap.get(item.CREATION_MONTH).count = item.NEW_CUSTOMERS;
    }
  });
  return Array.from(dataMap.values());
};
