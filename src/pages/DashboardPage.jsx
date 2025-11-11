import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getRecentActivity } from '../services/api';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Skeleton,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { EmojiEvents, Receipt } from '@mui/icons-material';
import StatCard from '../components/StatCard';
import ComparisonStatCard from '../components/ComparisonStatCard';
import SkeletonCard from '../components/SkeletonCard';
import ChartCard from '../components/ChartCard';
import OverviewSection from '../components/OverviewSection';
import ChartSeries from '../components/ChartSeries';
import CustomTooltip from '../components/CustomTooltip';
import { processTrendData, processYearlyPaymentData, processCustomerGrowthData } from '../utils/chartUtils';
import RecentActivity from '../components/RecentActivity';
import PieChartCard from '../components/PieChartCard';
import { useDashboardData } from '../hooks/useDashboardData';
import DateRangePicker from '../components/DateRangePicker';
import CollapsibleSection from '../components/CollapsibleSection';
import { CHART_COLORS } from '../theme/theme';
import OverviewToggle from '../components/OverviewToggle';

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true); // Keep loading true initially
  const [error, setError] = useState('');
  const [overview, setOverview] = useState('daily');
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null,
  });
  const [chartTypes, setChartTypes] = useState({
    monthly: 'bar',
    yearly: 'bar',
    daily: 'bar',
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true); // Set loading true on each fetch
      try {
        // Adjust for timezone offset to ensure correct date is sent to backend
        const toYYYYMMDD = (date) => {
          return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        };
        const startDate = dateRange.start ? toYYYYMMDD(dateRange.start) : null; // prettier-ignore
        const endDate = dateRange.end ? toYYYYMMDD(dateRange.end) : null;
        const response = await getDashboardStats(token, startDate, endDate);
        setStats(response.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token, dateRange]);

  if (error) {
    return <Container><Alert severity="error" sx={{ mt: 2 }}>{error}</Alert></Container>;
  }

  const {
    bookChartData,
    winnerChartData,
    eligibilityChartData,
    monthlyPaymentData,
    last7DaysData,
    yearlyPaymentData,
    paymentMethodMixData,
    customerGrowthData,
    winsPerBookData,
  } = useDashboardData(stats);

  const handleChartTypeChange = (chartName, newType) => {
    if (newType) {
      setChartTypes(prev => ({ ...prev, [chartName]: newType }));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ py: 4, px: 2, bgcolor: 'background.default', minHeight: 'calc(100vh - 64px)' }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary', width: '100%', textAlign: { xs: 'center', md: 'left' } }}>
              Welcome to your <Box component="span" sx={{ color: 'primary.main' }}>Dashboard</Box>
            </Typography>
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          </Box>

          {/* --- Collapsible Average Payment KPIs --- */}
          <CollapsibleSection title="Average Payment KPIs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
              {loading ? (
                [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
              ) : (
                <>
                  <StatCard title="Avg. Payment (Today)" value={stats.dailyPaymentStats.all?.today?.count > 0 ? `₹${(stats.dailyPaymentStats.all.today.amount / stats.dailyPaymentStats.all.today.count).toFixed(2)}` : '₹0'} />
                  <StatCard title="Avg. Payment (This Week)" value={stats.weeklyPaymentStats.all?.current?.count > 0 ? `₹${(stats.weeklyPaymentStats.all.current.amount / stats.weeklyPaymentStats.all.current.count).toFixed(2)}` : '₹0'} />
                  <StatCard title="Avg. Payment (This Month)" value={stats.paymentStats.all?.currentMonth?.count > 0 ? `₹${(stats.paymentStats.all.currentMonth.amount / stats.paymentStats.all.currentMonth.count).toFixed(2)}` : '₹0'} />
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* --- Top Level KPIs --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {loading ? (
              [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
            ) : (
                <>
                  <StatCard title="Total Books" value={`${stats.bookCounts.total} (${stats.bookCounts.active} Active)`} />
                  <StatCard title="Total Customers" value={`${stats.customerCounts.total} (${stats.customerCounts.active} Active)`} />
                  <StatCard title="Total Winners" value={stats.winnerCounts.total} />
                  <StatCard title="Eligible Customers" value={stats.eligibilityCounts.eligible} color={CHART_COLORS.eligible} />
                </>
            )}
          </div>

          <OverviewToggle value={overview} onChange={setOverview} />

          {/* --- Daily Overview --- */}
          {overview === 'daily' && (
            <OverviewSection
              title="Daily Overview"
              loading={loading}
              stats={{
                all: { current: stats?.dailyPaymentStats.all?.today, previous: stats?.dailyPaymentStats.all?.yesterday },
                online: { current: stats?.dailyPaymentStats.online?.today, previous: stats?.dailyPaymentStats.online?.yesterday },
                cash: { current: stats?.dailyPaymentStats.cash?.today, previous: stats?.dailyPaymentStats.cash?.yesterday },
                instore: { current: stats?.dailyPaymentStats.instore?.today, previous: stats?.dailyPaymentStats.instore?.yesterday },
              }}
              period="day"
            />
          )}

          {/* --- Weekly Summary --- */}
          {overview === 'weekly' && (
            <OverviewSection title="Weekly Summary (Mon-Sun)" loading={loading} stats={stats?.weeklyPaymentStats} period="week" />
          )}

          {/* --- Monthly Payment Comparisons --- */}
          {overview === 'monthly' && (
            <OverviewSection
              title="Monthly Overview"
              loading={loading}
              stats={{
                all: { current: stats?.paymentStats.all?.currentMonth, previous: stats?.paymentStats.all?.previousMonth },
                online: { current: stats?.paymentStats.online?.currentMonth, previous: stats?.paymentStats.online?.previousMonth },
                cash: { current: stats?.paymentStats.cash?.currentMonth, previous: stats?.paymentStats.cash?.previousMonth },
                instore: { current: stats?.paymentStats.instore?.currentMonth, previous: stats?.paymentStats.instore?.previousMonth },
              }}
              period="month"
            />
          )}

          {/* --- Yearly Overview --- */}
          {overview === 'yearly' && (
            <OverviewSection title="Yearly Overview" loading={loading} stats={stats?.yearlyOverviewStats} period="year" />
          )}

          {/* --- Trend Charts --- */}
          <Typography variant="h4" sx={{ mb: 2, mt: 4, fontWeight: '500', color: '#000' }}>
            Payment Trends
          </Typography>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <ChartCard
                title="Last 12 Months Payment Trend (₹)"
                loading={loading}
                chartType={chartTypes.monthly}
                onChartTypeChange={(v) => handleChartTypeChange('monthly', v)}
              >
                <BarChart data={monthlyPaymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <ChartSeries
                    chartType={chartTypes.monthly}
                    data={monthlyPaymentData}
                    colorMapping={{ total: CHART_COLORS.total, online: CHART_COLORS.online, cash: CHART_COLORS.cash, instore: CHART_COLORS.instore }}
                  />
                </BarChart>
              </ChartCard>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="lg:col-span-1">
              <ChartCard
                title="Yearly Payment Totals (₹)"
                loading={loading}
                chartType={chartTypes.yearly}
                onChartTypeChange={(v) => handleChartTypeChange('yearly', v)}
              >
                <BarChart data={yearlyPaymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <ChartSeries
                    chartType={chartTypes.yearly}
                    data={yearlyPaymentData}
                    colorMapping={{ total: CHART_COLORS.total, online: CHART_COLORS.online, cash: CHART_COLORS.cash, instore: CHART_COLORS.instore }}
                  />
                </BarChart>
              </ChartCard>
            </div>
            <div className="lg:col-span-1">
              <ChartCard
                title="Last 7 Days Payments (₹)"
                loading={loading}
                chartType={chartTypes.daily}
                onChartTypeChange={(v) => handleChartTypeChange('daily', v)}
              >
                <BarChart data={last7DaysData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <ChartSeries
                    chartType={chartTypes.daily}
                    data={last7DaysData}
                    colorMapping={{ total: CHART_COLORS.total, online: CHART_COLORS.online, cash: CHART_COLORS.cash, instore: CHART_COLORS.instore }}
                  />
                </BarChart>
              </ChartCard>
            </div>
          </div>

          {/* --- Distribution Charts --- */}
          <Typography variant="h4" sx={{ mb: 2, mt: 4, fontWeight: '500', color: '#000' }}>
            Distribution Overview
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <PieChartCard
              title="Book Status"
              loading={loading}
              data={bookChartData}
              colors={[CHART_COLORS.active, CHART_COLORS.inactive]}
              tooltipFormatter={(value, name) => [value, name]}
            />
            <PieChartCard
              title="Winner Distribution"
              loading={loading}
              data={winnerChartData}
              colors={[CHART_COLORS.active, CHART_COLORS.inactive]}
              tooltipFormatter={(value, name) => [value, name]}
            />
            <PieChartCard
              title="Eligibility (Active Books)"
              loading={loading}
              data={eligibilityChartData}
              colors={[CHART_COLORS.eligible, CHART_COLORS.notEligible]}
              tooltipFormatter={(value, name) => [value, name]}
            />
            <PieChartCard
              title="Payment Method Mix (This Month)"
              loading={loading}
              data={paymentMethodMixData}
              colors={[CHART_COLORS.online, CHART_COLORS.cash, CHART_COLORS.instore]}
              tooltipFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
            />
          </div>

          {/* --- Customer Growth Chart --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 mt-4">
            <div>
              <ChartCard title="New Customer Growth (Last 12 Months)" loading={loading}>
                <LineChart data={customerGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [value, 'New Customers']} labelStyle={{ fontWeight: 'bold' }} />
                  <Legend verticalAlign="top" />
                  <Line type="monotone" dataKey="count" name="New Customers" stroke={CHART_COLORS.eligible} strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ChartCard>
            </div>
            <div>
              <PieChartCard
                title="Wins in Active Books"
                loading={loading}
                data={winsPerBookData}
                colors={Object.values(CHART_COLORS)}
                tooltipFormatter={(value) => [`${value} wins`, 'Total Wins']}
              />
            </div>
          </div>

          {/* --- Recent Activity --- */}
          <RecentActivity />

        </Container>
      </Box>
    </LocalizationProvider>
  );
}