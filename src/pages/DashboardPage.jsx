import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../services/api';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  TextField
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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

  return (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
      <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
      <Typography variant="h4" fontWeight="bold">
        {typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {isPositive ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
        <Typography variant="body2" fontWeight="bold" sx={{ ml: 0.5 }}>
          {percentageChange.toFixed(1)}% vs last {period}
        </Typography>
      </Box>
    </Paper>
  );
};

const COLORS = {
  active: '#2e7d32',
  inactive: '#d32f2f',
  eligible: '#1976d2',
  notEligible: '#ed6c02',
  total: '#5f6368',
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const startDate = dateRange.start ? dateRange.start.toISOString().split('T')[0] : null;
        const endDate = dateRange.end ? dateRange.end.toISOString().split('T')[0] : null;
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

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container><Alert severity="error" sx={{ mt: 2 }}>{error}</Alert></Container>;
  }

  const bookChartData = [
    { name: 'Active', value: stats.bookCounts.active },
    { name: 'Inactive', value: stats.bookCounts.inactive },
  ];

  const winnerChartData = [
    { name: 'From Active Books', value: stats.winnerCounts.fromActiveBooks },
    { name: 'From Inactive Books', value: stats.winnerCounts.fromInactiveBooks },
  ];

  const eligibilityChartData = [
    { name: 'Eligible', value: stats.eligibilityCounts.eligible },
    { name: 'Not Eligible', value: stats.eligibilityCounts.notEligible },
  ];

  const customerChartData = [
    { name: 'Total Customers', value: stats.customerCounts.total },
    { name: 'From Active Books', value: stats.customerCounts.fromActiveBooks },
    { name: 'From Inactive Books', value: stats.customerCounts.fromInactiveBooks },
  ];

  const monthlyPaymentData = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = stats.monthlyPayments.find(p => p.PAYMENT_MONTH === monthStr);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      amount: entry ? entry.TOTAL_AMOUNT : 0,
    };
  }).reverse();

  const yearlyPaymentData = stats.yearlyPayments.map(p => ({
    year: p.PAYMENT_YEAR,
    amount: p.TOTAL_AMOUNT,
  }));

  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const entry = stats.dailyPayments.find(p => p.PAYMENT_DAY.startsWith(dayStr));
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      amount: entry ? entry.TOTAL_AMOUNT : 0,
    };
  }).reverse();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ py: 4, px: 2, background: "linear-gradient(to right, #f0f4f8, #d9e2ec)", minHeight: 'calc(100vh - 64px)' }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
            <Typography variant="h3" sx={{ mb: { xs: 2, sm: 0 }, fontWeight: 'bold', color: '#222' }}>
              Dashboard
            </Typography>
            <Paper sx={{ p: 1, display: 'flex', gap: 2, borderRadius: 2 }}>
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

          {/* --- Top Level KPIs --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Books" value={`${stats.bookCounts.total} (${stats.bookCounts.active} Active)`} />
            <StatCard title="Total Customers" value={`${stats.customerCounts.total} (${stats.customerCounts.fromActiveBooks} Active)`} />
            <StatCard title="Total Winners" value={stats.winnerCounts.total} />
            <StatCard title="Eligible Customers" value={stats.eligibilityCounts.eligible} color={COLORS.eligible} />
          </div>

          {/* --- Daily Overview --- */}
          <Typography variant="h4" sx={{ mb: 2, fontWeight: '500', color: '#333' }}>Daily Overview</Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <ComparisonStatCard title="Today's Amount" value={stats.dailyPaymentStats.today.amount} prevValue={stats.dailyPaymentStats.yesterday.amount} period="day" />
            <ComparisonStatCard title="Today's Payments" value={stats.dailyPaymentStats.today.count} prevValue={stats.dailyPaymentStats.yesterday.count} period="day" />
          </div>

          {/* --- Monthly Payment Comparisons --- */}
          <Typography variant="h4" sx={{ mb: 2, fontWeight: '500', color: '#333' }}>
            Monthly Overview
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <ComparisonStatCard title="Total Amount" value={stats.paymentStats.all.currentMonth.amount} prevValue={stats.paymentStats.all.previousMonth.amount} />
            <ComparisonStatCard title="Total Payments" value={stats.paymentStats.all.currentMonth.count.toLocaleString('en-IN')} prevValue={stats.paymentStats.all.previousMonth.count} />
            <ComparisonStatCard title="Active Books Amount" value={stats.paymentStats.active.currentMonth.amount} prevValue={stats.paymentStats.active.previousMonth.amount} />
            <ComparisonStatCard title="Inactive Books Amount" value={stats.paymentStats.inactive.currentMonth.amount} prevValue={stats.paymentStats.inactive.previousMonth.amount} />
          </div>

          {/* --- Trend Charts --- */}
          <Typography variant="h4" sx={{ mb: 2, mt: 4, fontWeight: '500', color: '#333' }}>
            Payment Trends
          </Typography>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <Paper elevation={3} sx={{ p: 1, pb:4, height: 400 }}>
                <Typography variant="h6" gutterBottom>Last 12 Months Payment Trend (₹)</Typography>
                <ResponsiveContainer>
                  <BarChart data={monthlyPaymentData}>
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                    <Bar dataKey="amount" name="Amount Received" fill={COLORS.eligible} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Paper elevation={3} sx={{ p: 1, pb:4, height: 400 }}>
                <Typography variant="h6" gutterBottom>Yearly Payment Totals (₹)</Typography>
                <ResponsiveContainer>
                  <BarChart data={yearlyPaymentData}>
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                    <Bar dataKey="amount" name="Total Amount" fill={COLORS.active} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </div>
            <div>
              <Paper elevation={3} sx={{ p: 1, pb:4, height: 400 }}>
                <Typography variant="h6" gutterBottom>Last 7 Days Payments (₹)</Typography>
                <ResponsiveContainer>
                  <BarChart data={last7DaysData}>
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                    <Bar dataKey="amount" name="Amount" fill={COLORS.eligible} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </div>
          </div>

          {/* --- Distribution Charts --- */}
          <Typography variant="h4" sx={{ mb: 2, mt: 4, fontWeight: '500', color: '#333' }}>
            Distribution Overview
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Paper elevation={3} sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>Book Status</Typography>
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
              </Paper>
            </div>
            <div>
              <Paper elevation={3} sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>Winner Distribution</Typography>
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
              </Paper>
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <Paper elevation={3} sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>Eligibility (Active Books)</Typography>
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
              </Paper>
            </div>
          </div>

        </Container>
      </Box>
    </LocalizationProvider>
  );
}
