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
  List,
  ListItem,
  ListItemText,
  Avatar,
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

const StatCard = ({ title, value, color, comparison }) => (
  <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
    <Typography variant="h6" color="text.secondary">{title}</Typography>
    <Typography variant="h4" fontWeight="bold" sx={{ color: color || 'primary.main', mb: comparison ? 1 : 0 }}>
      {value}
    </Typography>
  </Paper>
);

const ComparisonStatCard = ({ title, value, prevValue, period = 'month' }) => {
  const diff = value - prevValue;
  const percentageChange = prevValue === 0 ? (value > 0 ? 100 : 0) : (diff / prevValue) * 100;
  const isPositive = diff >= 0;
  const color = isPositive ? 'success.main' : 'error.main';

  const formatValue = (val) => {
    if (typeof val !== 'number') return val;
    return title.toLowerCase().includes('amount') ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN');
  };

  return (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
      <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
      <Typography variant="h4" fontWeight="bold">{formatValue(value)}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {isPositive ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
        <Typography variant="body2" fontWeight="bold" sx={{ ml: 0.5 }}>
          {percentageChange.toFixed(1)}% vs last {period}
        </Typography>
      </Box>
    </Paper>
  );
};

const SkeletonCard = () => (
  <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
    <Typography variant="subtitle1"><Skeleton width="80%" sx={{ margin: '0 auto' }} /></Typography>
    <Typography variant="h4"><Skeleton width="60%" sx={{ margin: '1rem auto 0' }} /></Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Skeleton width="40%" />
    </Box>
  </Paper>
);

const COLORS = {
  active: '#2e7d32',
  inactive: '#d32f2f',
  eligible: '#1976d2',
  notEligible: '#ed6c02',
  online: '#ff9800', // Orange for Online
  cash: '#4caf50',   // Green for Cash
  total: '#5f6368',
};

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
  // State for paginated activity
  const [activity, setActivity] = useState({
    items: [],
    loading: true,
    pagination: { page: 1, totalPages: 1 },
  });
  const [showAvgPaymentKPIs, setShowAvgPaymentKPIs] = useState(false);
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

  useEffect(() => {
    const fetchActivity = async () => {
      setActivity(prev => ({ ...prev, loading: true }));
      try {
        const response = await getRecentActivity(token, activity.pagination.page, 5); // Fetch 5 items per page
        setActivity(prev => ({
          ...prev,
          items: response.data.activities,
          pagination: { ...prev.pagination, totalPages: response.data.totalPages },
        }));
      } catch (err) {
        setError('Failed to load recent activity.');
      } finally {
        setActivity(prev => ({ ...prev, loading: false }));
      }
    };
    if (token) fetchActivity();
  }, [token, activity.pagination.page]);

  if (error) {
    return <Container><Alert severity="error" sx={{ mt: 2 }}>{error}</Alert></Container>;
  }

  const bookChartData = stats ? [
    { name: 'Active', value: stats.bookCounts.active }, { name: 'Inactive', value: stats.bookCounts.inactive },
  ] : [];

  const winnerChartData = stats ? [
    { name: 'From Active Books', value: stats.winnerCounts.fromActiveBooks }, { name: 'From Inactive Books', value: stats.winnerCounts.fromInactiveBooks },
  ] : [];

  const eligibilityChartData = stats ? [
    { name: 'Eligible', value: stats.eligibilityCounts.eligible }, { name: 'Not Eligible', value: stats.eligibilityCounts.notEligible },
  ] : [];

  const customerChartData = stats ? [
    { name: 'Total Customers', value: stats.customerCounts.total }, { name: 'From Active Books', value: stats.customerCounts.fromActiveBooks }, { name: 'From Inactive Books', value: stats.customerCounts.fromInactiveBooks },
  ] : [];

  // --- Process data for trend charts ---
  const processTrendData = (rawData, dateKey, dateLabelFormat, length, dateIncrement) => {
    const dataMap = new Map();

    for (let i = 0; i < length; i++) {
      const d = new Date();
      dateIncrement(d, i);
      const key = d.toISOString().split('T')[0].slice(0, dateKey === 'PAYMENT_YEAR' ? 4 : (dateKey === 'PAYMENT_MONTH' ? 7 : 10));
      const label = d.toLocaleDateString('en-US', dateLabelFormat); // prettier-ignore
      dataMap.set(key, { date: label, total: 0, online: 0, cash: 0, total_count: 0, online_count: 0, cash_count: 0 });
    }

    rawData.forEach(p => {
      const key = p[dateKey].slice(0, dateKey === 'PAYMENT_YEAR' ? 4 : (dateKey === 'PAYMENT_MONTH' ? 7 : 10));
      if (dataMap.has(key)) {
        const entry = dataMap.get(key);
        const amount = p.TOTAL_AMOUNT || 0;
        const count = p.PAYMENT_COUNT || 0;
        const type = p.PAYMENT_TYPE?.toLowerCase() || 'online';
        entry[type] = amount;
        entry[`${type}_count`] = count;
        entry.total += amount;
        entry.total_count += count;
      }
    });

    return Array.from(dataMap.values()).reverse();
  };

  const monthlyPaymentData = processTrendData(
    stats?.monthlyPayments || [],
    'PAYMENT_MONTH',
    { month: 'short', year: '2-digit' },
    12,
    (d, i) => d.setMonth(d.getMonth() - i)
  );

  const last7DaysData = processTrendData(
    stats?.dailyPayments || [],
    'PAYMENT_DAY',
    { weekday: 'short', day: 'numeric' },
    7,
    (d, i) => d.setDate(d.getDate() - i)
  );

  const yearlyPaymentData = (() => {
    const dataMap = new Map(); // prettier-ignore
    if (!stats) return [];
    stats.yearlyPayments.forEach(p => {
      const year = p.PAYMENT_YEAR;
      if (!dataMap.has(year)) {
        dataMap.set(year, { year, total: 0, online: 0, cash: 0, total_count: 0, online_count: 0, cash_count: 0 });
      }
      const entry = dataMap.get(year);
      const amount = p.TOTAL_AMOUNT || 0;
      const count = p.PAYMENT_COUNT || 0;
      const type = p.PAYMENT_TYPE?.toLowerCase() || 'online';
      entry[type] = amount;
      entry[`${type}_count`] = count;
      entry.total += amount;
      entry.total_count += count;
    });
    return Array.from(dataMap.values());
  })();

  const paymentMethodMixData = stats ? [
    { name: 'Online', value: stats.paymentStats.online?.currentMonth?.amount || 0 },
    { name: 'Cash', value: stats.paymentStats.cash?.currentMonth?.amount || 0 },
  ] : [];

  const customerGrowthData = (() => {
    if (!stats) return [];
    const dataMap = new Map();
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      dataMap.set(key, { date: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), count: 0 });
    }
    stats.customerGrowth.forEach(item => {
      if (dataMap.has(item.CREATION_MONTH)) {
        dataMap.get(item.CREATION_MONTH).count = item.NEW_CUSTOMERS;
      }
    });
    return Array.from(dataMap.values());
  })();

  const winsPerBookData = (stats?.winsPerBook || [])
    .map(item => ({
      name: item.BOOK_NAME,
      value: item.WIN_COUNT,
    }))
    .slice(0, 10); // Show top 10 books by wins

  const renderActivityItem = (item, index) => {
    const isWinner = item.ACTIVITY_TYPE === 'winner';
    const title = isWinner
      ? `${item.CUSTOMER_NAME} won in ${item.BOOK_NAME}`
      : `Payment of ₹${item.AMOUNT.toLocaleString('en-IN')} from ${item.CUSTOMER_NAME}`;
    const subtitle = isWinner
      ? 'Lucky Draw Winner'
      : `Book: ${item.BOOK_NAME}`;

    return (
      <ListItem key={index} divider={index < activity.items.length - 1}>
        <Avatar sx={{ bgcolor: isWinner ? 'success.main' : 'primary.main', mr: 2 }}>
          {isWinner ? <EmojiEvents /> : <Receipt />}
        </Avatar>
        <ListItemText
          primary={title}
          secondary={subtitle}
          primaryTypographyProps={{ fontWeight: 'medium' }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2, flexShrink: 0 }}>
          {formatDistanceToNow(new Date(item.ACTIVITY_DATE), { addSuffix: true })}
        </Typography>
      </ListItem>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <Typography variant="subtitle2" gutterBottom>{label}</Typography> {/* prettier-ignore */}
          {payload.map((pld) => (
            <Typography key={pld.dataKey} variant="body2" sx={{ color: pld.color }}>
              {pld.name}: ₹{pld.value.toLocaleString('en-IN')}
              {pld.payload[`${pld.dataKey}_count`] > 0 && ` (count: ${pld.payload[`${pld.dataKey}_count`]})`}
            </Typography>
          ))}
        </Paper>
      );
    }

    return null;
  };

  const handleChartTypeChange = (chartName, newType) => {
    if (newType) {
      setChartTypes(prev => ({ ...prev, [chartName]: newType }));
    }
  };

  const renderChart = (chartType, data, colorMapping) => {
    const bars = Object.keys(colorMapping).map(key => (
      <Bar key={key} dataKey={key} name={key.charAt(0).toUpperCase() + key.slice(1)} fill={colorMapping[key]} />
    ));
    const lines = Object.keys(colorMapping).map(key => (
      <Line key={key} type="monotone" dataKey={key} name={key.charAt(0).toUpperCase() + key.slice(1)} stroke={colorMapping[key]} strokeWidth={2} />
    ));
    return chartType === 'line' ? lines : bars;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ py: 4, px: 2, background: "linear-gradient(to right, #f0f4f8, #d9e2ec)", minHeight: 'calc(100vh - 64px)' }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#222', width: '100%', textAlign: { xs: 'center', md: 'left' } }}>
              Dashboard
            </Typography>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, borderRadius: 2, alignItems: 'center' }}>
              <DatePicker
                label="Start Date"
                value={dateRange.start}
                onChange={(newValue) => setDateRange(prev => ({ ...prev, start: newValue }))}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="End Date"
                value={dateRange.end}
                onChange={(newValue) => setDateRange(prev => ({ ...prev, end: newValue }))}
                slotProps={{ textField: { size: 'small' } }}
              />
            </Paper>
          </Box>

          {/* --- Collapsible Average Payment KPIs --- */}
          <Box sx={{ mb: 2 }}>
            <Box
              onClick={() => setShowAvgPaymentKPIs(!showAvgPaymentKPIs)}
              sx={{ 
                p: 1.5, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer',
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'transparent',
              }}
            >
              <Typography variant="h6" fontWeight="500">Average Payment KPIs</Typography>
              <ExpandMoreIcon sx={{ transform: showAvgPaymentKPIs ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </Box>
            <Collapse in={showAvgPaymentKPIs}>
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
            </Collapse>
          </Box>

          {/* --- Top Level KPIs --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {loading ? (
              [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
            ) : (
                <>
                  <StatCard title="Total Books" value={`${stats.bookCounts.total} (${stats.bookCounts.active} Active)`} />
                  <StatCard title="Total Customers" value={`${stats.customerCounts.total} (${stats.customerCounts.active} Active)`} />
                  <StatCard title="Total Winners" value={stats.winnerCounts.total} />
                  <StatCard title="Eligible Customers" value={stats.eligibilityCounts.eligible} color={COLORS.eligible} />
                </>
            )}
          </div>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <ToggleButtonGroup value={overview} exclusive onChange={(e, newOverview) => newOverview && setOverview(newOverview)} aria-label="Overview Period">
              <ToggleButton value="daily" aria-label="daily overview">Daily</ToggleButton>
              <ToggleButton value="weekly" aria-label="weekly overview">Weekly</ToggleButton>
              <ToggleButton value="monthly" aria-label="monthly overview">Monthly</ToggleButton>
              <ToggleButton value="yearly" aria-label="yearly overview">Yearly</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* --- Daily Overview --- */}
          {overview === 'daily' && (
            <>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: '500', color: '#000' }}>Daily Overview</Typography>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {loading ? (
                  [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  <>
                    <ComparisonStatCard title="Total Amount" value={stats.dailyPaymentStats.all?.today?.amount || 0} prevValue={stats.dailyPaymentStats.all?.yesterday?.amount || 0} period="day" />
                    <ComparisonStatCard title="Online Amount" value={stats.dailyPaymentStats.online?.today?.amount || 0} prevValue={stats.dailyPaymentStats.online?.yesterday?.amount || 0} period="day" />
                    <ComparisonStatCard title="Cash Amount" value={stats.dailyPaymentStats.cash?.today?.amount || 0} prevValue={stats.dailyPaymentStats.cash?.yesterday?.amount || 0} period="day" />
                    <ComparisonStatCard title="Total Payments count" value={stats.dailyPaymentStats.all?.today?.count || 0} prevValue={stats.dailyPaymentStats.all?.yesterday?.count || 0} period="day" />
                    <ComparisonStatCard title="Total Online Payments count" value={stats.dailyPaymentStats.online?.today?.count || 0} prevValue={stats.dailyPaymentStats.online?.yesterday?.count || 0} period="day" />
                    <ComparisonStatCard title="Total Cash Payments count" value={stats.dailyPaymentStats.cash?.today?.count || 0} prevValue={stats.dailyPaymentStats.cash?.yesterday?.count || 0} period="day" />
                  </>
                )}
              </div>
            </>
          )}

          {/* --- Weekly Summary --- */}
          {overview === 'weekly' && (
            <>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: '500', color: '#000' }}>Weekly Summary (Mon-Sun)</Typography>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {loading ? (
                  [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  <>
                    <ComparisonStatCard title="Total Amount"  value={stats.weeklyPaymentStats.all?.current?.amount || 0} prevValue={stats.weeklyPaymentStats.all?.previous?.amount || 0} period="week" />
                    <ComparisonStatCard title="Online Amount"  value={stats.weeklyPaymentStats.online?.current?.amount || 0} prevValue={stats.weeklyPaymentStats.online?.previous?.amount || 0} period="week" />
                    <ComparisonStatCard title="Cash Amount"  value={stats.weeklyPaymentStats.cash?.current?.amount || 0} prevValue={stats.weeklyPaymentStats.cash?.previous?.amount || 0} period="week" />
                    <ComparisonStatCard title="Total Payments count" value={stats.weeklyPaymentStats.all?.current?.count || 0} prevValue={stats.weeklyPaymentStats.all?.previous?.count || 0} period="week" />
                    <ComparisonStatCard title="Total Online Payments count" value={stats.weeklyPaymentStats.online?.current?.count || 0} prevValue={stats.weeklyPaymentStats.online?.previous?.count || 0} period="week" />
                    <ComparisonStatCard title="Total Cash Payments count" value={stats.weeklyPaymentStats.cash?.current?.count || 0} prevValue={stats.weeklyPaymentStats.cash?.previous?.count || 0} period="week" />
                  </>
                )}
              </div>
            </>
          )}

          {/* --- Monthly Payment Comparisons --- */}
          {overview === 'monthly' && (
            <>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: '500', color: '#333' }}>Monthly Overview</Typography>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {loading ? (
                  [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  <>
                    <ComparisonStatCard title="Total Amount"  value={stats.paymentStats.all?.currentMonth?.amount || 0} prevValue={stats.paymentStats.all?.previousMonth?.amount || 0} />
                    <ComparisonStatCard title="Online Amount"  value={stats.paymentStats.online?.currentMonth?.amount || 0} prevValue={stats.paymentStats.online?.previousMonth?.amount || 0} />
                    <ComparisonStatCard title="Cash Amount"  value={stats.paymentStats.cash?.currentMonth?.amount || 0} prevValue={stats.paymentStats.cash?.previousMonth?.amount || 0} />
                    <ComparisonStatCard title="Total Payments count" value={stats.paymentStats.all?.currentMonth?.count || 0} prevValue={stats.paymentStats.all?.previousMonth?.count || 0} />
                    <ComparisonStatCard title="Total Online Payments count" value={stats.paymentStats.online?.currentMonth?.count || 0} prevValue={stats.paymentStats.online?.previousMonth?.count || 0} />
                    <ComparisonStatCard title="Total Cash Payments count" value={stats.paymentStats.cash?.currentMonth?.count || 0} prevValue={stats.paymentStats.cash?.previousMonth?.count || 0} />
                  </>
                )}
              </div>
            </>
          )}

          {/* --- Yearly Overview --- */}
          {overview === 'yearly' && (
            <>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: '500', color: '#333' }}>Yearly Overview</Typography>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {loading ? (
                  [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  <>
                    <ComparisonStatCard title="Total Amount"  value={stats.yearlyOverviewStats.all?.current?.amount || 0} prevValue={stats.yearlyOverviewStats.all?.previous?.amount || 0} period="year" />
                    <ComparisonStatCard title="Online Amount"  value={stats.yearlyOverviewStats.online?.current?.amount || 0} prevValue={stats.yearlyOverviewStats.online?.previous?.amount || 0} period="year" />
                    <ComparisonStatCard title="Cash Amount"  value={stats.yearlyOverviewStats.cash?.current?.amount || 0} prevValue={stats.yearlyOverviewStats.cash?.previous?.amount || 0} period="year" />
                    <ComparisonStatCard title="Total Payments count" value={stats.yearlyOverviewStats.all?.current?.count || 0} prevValue={stats.yearlyOverviewStats.all?.previous?.count || 0} period="year" />
                    <ComparisonStatCard title="Total Online Payments count" value={stats.yearlyOverviewStats.online?.current?.count || 0} prevValue={stats.yearlyOverviewStats.online?.previous?.count || 0} period="year" />
                    <ComparisonStatCard title="Total Cash Payments count" value={stats.yearlyOverviewStats.cash?.current?.count || 0} prevValue={stats.yearlyOverviewStats.cash?.previous?.count || 0} period="year" />
                  </>
                )}
              </div>
            </>
          )}

          {/* --- Trend Charts --- */}
          <Typography variant="h4" sx={{ mb: 2, mt: 4, fontWeight: '500', color: '#000' }}>
            Payment Trends
          </Typography>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <Paper elevation={3} sx={{ p: 1, pb:4, height: 400 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" gutterBottom>Last 12 Months Payment Trend (₹)</Typography>
                  <ToggleButtonGroup value={chartTypes.monthly} exclusive onChange={(e, v) => handleChartTypeChange('monthly', v)} size="small">
                    <ToggleButton value="bar">Bar</ToggleButton>
                    <ToggleButton value="line">Line</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {loading ? (
                  <Skeleton variant="rectangular" width="100%" height={320} />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={monthlyPaymentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {renderChart(chartTypes.monthly, monthlyPaymentData, { total: COLORS.total, online: COLORS.online, cash: COLORS.cash })}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="lg:col-span-1">
              <Paper elevation={3} sx={{ p: 1, pb:4, height: 400 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" gutterBottom>Yearly Payment Totals (₹)</Typography>
                  <ToggleButtonGroup value={chartTypes.yearly} exclusive onChange={(e, v) => handleChartTypeChange('yearly', v)} size="small">
                    <ToggleButton value="bar">Bar</ToggleButton>
                    <ToggleButton value="line">Line</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {loading ? (
                  <Skeleton variant="rectangular" width="100%" height={320} />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={yearlyPaymentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {renderChart(chartTypes.yearly, yearlyPaymentData, { total: COLORS.total, online: COLORS.online, cash: COLORS.cash })}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </div>
            <div className="lg:col-span-1">
              <Paper elevation={3} sx={{ p: 1, pb:4, height: 400 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" gutterBottom>Last 7 Days Payments (₹)</Typography>
                  <ToggleButtonGroup value={chartTypes.daily} exclusive onChange={(e, v) => handleChartTypeChange('daily', v)} size="small">
                    <ToggleButton value="bar">Bar</ToggleButton>
                    <ToggleButton value="line">Line</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {loading ? (
                  <Skeleton variant="rectangular" width="100%" height={320} />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={last7DaysData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {renderChart(chartTypes.daily, last7DaysData, { total: COLORS.total, online: COLORS.online, cash: COLORS.cash })}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </div>
          </div>

          {/* --- Distribution Charts --- */}
          <Typography variant="h4" sx={{ mb: 2, mt: 4, fontWeight: '500', color: '#000' }}>
            Distribution Overview
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="sm:col-span-1">
              <Paper elevation={3} sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>Book Status</Typography>
                {loading ? (
                  <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 4 }} />
                ) : (
                  <Box sx={{ height: 'calc(100% - 30px)' }}> {/* Wrapper with calculated height */}
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie data={bookChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        <Cell key="cell-0" fill={COLORS.active} />
                        <Cell key="cell-1" fill={COLORS.inactive} />
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  </Box>
                )}
              </Paper>
            </div>
            <div className="sm:col-span-1">
              <Paper elevation={3} sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>Winner Distribution</Typography>
                {loading ? (
                  <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 4 }} />
                ) : (
                  <Box sx={{ height: 'calc(100% - 30px)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie data={winnerChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                        <Cell key="cell-0" fill={COLORS.active} />
                        <Cell key="cell-1" fill={COLORS.inactive} />
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  </Box>
                )}
              </Paper>
            </div>
            <div className="sm:col-span-1">
              <Paper elevation={3} sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>Eligibility (Active Books)</Typography>
                {loading ? (
                  <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 4 }} />
                ) : (
                  <Box sx={{ height: 'calc(100% - 30px)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie data={eligibilityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        <Cell key="cell-0" fill={COLORS.eligible} />
                        <Cell key="cell-1" fill={COLORS.notEligible} />
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  </Box>
                )}
              </Paper>
            </div>
            <div className="sm:col-span-1">
              <Paper elevation={3} sx={{ p: 2, pb:6, height: 400 }}>
                <Typography variant="h6" gutterBottom>Payment Method Mix (This Month)</Typography>
                {loading ? (
                  <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 4 }} />
                ) : (
                  <Box sx={{ height: 'calc(100% - 54px)' }}> {/* Adjusted for extra padding */}
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie data={paymentMethodMixData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        <Cell key="cell-0" fill={COLORS.online} />
                        <Cell key="cell-1" fill={COLORS.cash} />
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  </Box>
                )}
              </Paper>
            </div>
          </div>

          {/* --- Customer Growth Chart --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 mt-4">
            <div>
              <Paper elevation={3} sx={{ p: 2, pb:4, height: 400 }}>
                <Typography variant="h6" gutterBottom>New Customer Growth (Last 12 Months)</Typography>
                {loading ? (
                  <Skeleton variant="rectangular" width="100%" height={320} />
                ) : (
                  <ResponsiveContainer>
                    <LineChart data={customerGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value) => [value, 'New Customers']} labelStyle={{ fontWeight: 'bold' }} />
                      <Legend verticalAlign="top" />
                      <Line type="monotone" dataKey="count" name="New Customers" stroke={COLORS.eligible} strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </div>
            <div>
              <Paper elevation={3} sx={{ p: 2, pb:4, height: 400 }}>
                <Typography variant="h6" gutterBottom>Wins in Active Books</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={winsPerBookData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {winsPerBookData.map((entry, index) => (<Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.keys(COLORS).length]} />))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} wins`, 'Total Wins']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </div>
          </div>

          {/* --- Recent Activity --- */}
          <Typography variant="h4" sx={{ mb: 2, mt: 4, fontWeight: '500', color: '#000' }}>
            Recent Activity
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            {activity.loading ? (
              <List>
                {[...Array(5)].map((_, i) => (
                  <ListItem key={i}>
                    <Skeleton variant="circular" sx={{ mr: 2 }}><Avatar /></Skeleton>
                    <ListItemText
                      primary={<Skeleton width="40%" />}
                      secondary={<Skeleton width="25%" />}
                    />
                  </ListItem>
                ))}
              </List>
            ) :
             activity.items.length > 0 ? (
              <>
                <List disablePadding>
                  {activity.items.map(renderActivityItem)}
                </List>
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                  <Pagination
                    count={activity.pagination.totalPages}
                    page={activity.pagination.page}
                    onChange={(e, value) => setActivity(prev => ({ ...prev, pagination: { ...prev.pagination, page: value } }))}
                  />
                </Box>
              </>
            ) : (
              <Typography color="text.secondary" textAlign="center">No recent activity.</Typography>
            )}
          </Paper>


        </Container>
      </Box>
    </LocalizationProvider>
  );
}