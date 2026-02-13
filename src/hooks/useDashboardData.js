import { useMemo } from 'react';
import { processTrendData, processYearlyPaymentData, processCustomerGrowthData } from '../utils/chartUtils';

const transformTrendData = (data, dateKey) => {
  if (!data) return [];
  const result = [];
  data.forEach(row => {
    result.push({ [dateKey]: row[dateKey], PAYMENT_TYPE: 'cash', TOTAL_AMOUNT: row.AMOUNT_CASH || 0 });
    result.push({ [dateKey]: row[dateKey], PAYMENT_TYPE: 'online', TOTAL_AMOUNT: row.AMOUNT_ONLINE || 0 });
    result.push({ [dateKey]: row[dateKey], PAYMENT_TYPE: 'instore', TOTAL_AMOUNT: row.AMOUNT_INSTORE || 0 });
  });
  return result;
};

export const useDashboardData = (stats) => {
  return useMemo(() => {
    if (!stats) {
      // Return a default structure to prevent errors on initial render
      return {
        bookChartData: [],
        winnerChartData: [],
        eligibilityChartData: [],
        monthlyPaymentData: [],
        last7DaysData: [],
        yearlyPaymentData: [],
        paymentMethodMixData: [],
        customerGrowthData: [],
        winsPerBookData: [],
      };
    }

    const bookChartData = [
      { name: 'Active', value: stats.bookCounts.active }, { name: 'Inactive', value: stats.bookCounts.inactive },
    ];

    const winnerChartData = [
      { name: 'From Active Books', value: stats.winnerCounts.fromActiveBooks }, { name: 'From Inactive Books', value: stats.winnerCounts.fromInactiveBooks },
    ];

    const eligibilityChartData = [
      { name: 'Eligible', value: stats.eligibilityCounts.eligible }, { name: 'Not Eligible', value: stats.eligibilityCounts.notEligible },
    ];

    const monthlyPaymentData = processTrendData(transformTrendData(stats.monthlyPayments, 'PAYMENT_MONTH'), 'PAYMENT_MONTH', { month: 'short', year: '2-digit' }, 12, (d, i) => d.setMonth(d.getMonth() - i));

    const last7DaysData = processTrendData(transformTrendData(stats.dailyPayments, 'PAYMENT_DAY'), 'PAYMENT_DAY', { weekday: 'short', day: 'numeric' }, 7, (d, i) => d.setDate(d.getDate() - i));

    const yearlyPaymentData = processYearlyPaymentData(transformTrendData(stats.yearlyPayments, 'PAYMENT_YEAR'));

    const paymentMethodMixData = [
      { name: 'Online', value: stats.paymentStats.online?.currentMonth?.amount || 0 },
      { name: 'Cash', value: stats.paymentStats.cash?.currentMonth?.amount || 0 },
      { name: 'In-Store', value: stats.paymentStats.instore?.currentMonth?.amount || 0 },
    ];

    const customerGrowthData = processCustomerGrowthData(stats.customerGrowth);

    const winsPerBookData = (stats.winsPerBook || [])
      .map(item => ({ name: item.BOOK_NAME, value: item.WIN_COUNT }))
      .slice(0, 10);

    return {
      bookChartData,
      winnerChartData,
      eligibilityChartData,
      monthlyPaymentData,
      last7DaysData,
      yearlyPaymentData,
      paymentMethodMixData,
      customerGrowthData,
      winsPerBookData,
    };
  }, [stats]);
};
