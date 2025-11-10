import { useMemo } from 'react';
import { processTrendData, processYearlyPaymentData, processCustomerGrowthData } from '../utils/chartUtils';

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

    const monthlyPaymentData = processTrendData(stats.monthlyPayments, 'PAYMENT_MONTH', { month: 'short', year: '2-digit' }, 12, (d, i) => d.setMonth(d.getMonth() - i));

    const last7DaysData = processTrendData(stats.dailyPayments, 'PAYMENT_DAY', { weekday: 'short', day: 'numeric' }, 7, (d, i) => d.setDate(d.getDate() - i));

    const yearlyPaymentData = processYearlyPaymentData(stats.yearlyPayments);

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
