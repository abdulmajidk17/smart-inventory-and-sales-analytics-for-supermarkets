import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Chip,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  People,
  Inventory,
  AttachMoney,
  GetApp,
  DateRange,
  Assessment
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import apiClient from './api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFE', '#FF6699'];

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Reports() {
  const [tabIndex, setTabIndex] = useState(0);
  const [salesSummary, setSalesSummary] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [customerInsights, setCustomerInsights] = useState([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState([]);
  const [kpiData, setKpiData] = useState({});
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date('2024-10-01'));
  const [endDate, setEndDate] = useState(new Date('2024-11-30'));
  const [period, setPeriod] = useState('daily');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const calculateKPIs = (salesData, productData, customerData, revenueData) => {
    if (!salesData.length || !productData.length || !customerData.length || !revenueData.length) {
      return {};
    }

    const totalRevenue = salesData.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
    const totalOrders = salesData.reduce((sum, item) => sum + (item.total_transactions || 0), 0);
    const totalUnits = salesData.reduce((sum, item) => sum + (item.total_units_sold || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const topProducts = productData
      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
      .slice(0, 5);
    
    const topCustomers = customerData
      .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
      .slice(0, 5);
    
    const lowStockProducts = productData.filter(p => p.current_stock <= 20);
    const profitMargin = productData.reduce((sum, p) => {
      const profit = (p.total_revenue || 0) * 0.3; // Assuming 30% margin
      return sum + profit;
    }, 0);
    
    return {
      totalRevenue,
      totalOrders,
      totalUnits,
      avgOrderValue,
      topProducts,
      topCustomers,
      lowStockProducts: lowStockProducts.length,
      profitMargin,
      revenueGrowth: calculateGrowth(revenueData),
      customerCount: customerData.length,
      inventoryValue: productData.reduce((sum, p) => sum + (p.current_stock * (p.price || 0)), 0)
    };
  };

  const calculateGrowth = (data) => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1]?.revenue || 0;
    const previous = data[data.length - 2]?.revenue || 0;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const exportReport = (type, data) => {
    const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  const fetchSalesSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);
      
      console.log('Fetching sales summary:', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        url: `/api/reports/sales-summary?${params}`
      });
      
      const response = await apiClient.get(`/api/reports/sales-summary?${params}`);
      console.log('Sales summary response:', response.data.length, 'records');
      setSalesSummary(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch sales summary:', err);
      setError('Failed to fetch sales summary');
      return [];
    }
  };

  const fetchProductPerformance = async () => {
    try {
      const response = await apiClient.get('/api/reports/product-performance');
      setProductPerformance(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch product performance:', err);
      setError('Failed to fetch product performance data');
      return [];
    }
  };

  const fetchCustomerInsights = async () => {
    try {
      const response = await apiClient.get('/api/reports/customer-insights');
      setCustomerInsights(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch customer insights:', err);
      setError('Failed to fetch customer insights');
      return [];
    }
  };

  const fetchRevenueAnalytics = async () => {
    try {
      const response = await apiClient.get(`/api/reports/revenue-analytics?period=${period}`);
      setRevenueAnalytics(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch revenue analytics:', err);
      setError('Failed to fetch revenue analytics');
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [salesData, productData, customerData, revenueData] = await Promise.all([
          fetchSalesSummary(),
          fetchProductPerformance(),
          fetchCustomerInsights(),
          fetchRevenueAnalytics()
        ]);
        
        // Calculate KPIs after all data is fetched
        const kpis = calculateKPIs(
          salesData || [], 
          productData || [], 
          customerData || [], 
          revenueData || []
        );
        setKpiData(kpis);
        
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate, period]);

  const KPICard = ({ title, value, icon, growth, color = 'primary' }) => (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : '#d32f2f'} 0%, ${color === 'primary' ? '#1565c0' : color === 'success' ? '#1b5e20' : color === 'warning' ? '#e65100' : '#c62828'} 100%)`, color: 'white' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" gutterBottom sx={{ opacity: 0.9 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {value}
            </Typography>
            {growth !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {growth >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  {Math.abs(growth).toFixed(1)}% {growth >= 0 ? 'increase' : 'decrease'}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>Reports & Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            startIcon={<GetApp />} 
            onClick={() => exportReport('complete', [...salesSummary, ...productPerformance])}
            variant="outlined"
          >
            Export Reports
          </Button>
          <Button 
            startIcon={<DateRange />} 
            variant="outlined"
            onClick={() => {
              setStartDate(new Date('2024-10-01'));
              setEndDate(new Date('2024-11-30'));
            }}
          >
            Oct-Nov 2024
          </Button>
        </Box>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* KPI Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="Total Revenue"
            value={formatCurrency(kpiData.totalRevenue || 0)}
            icon={<AttachMoney fontSize="large" />}
            growth={kpiData.revenueGrowth}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="Total Orders"
            value={(kpiData.totalOrders || 0).toLocaleString()}
            icon={<ShoppingCart fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="Active Customers"
            value={kpiData.customerCount || 0}
            icon={<People fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="Low Stock Alerts"
            value={kpiData.lowStockProducts || 0}
            icon={<Inventory fontSize="large" />}
            color="warning"
          />
        </Grid>
      </Grid>
      
      {/* Additional KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard 
            title="Avg Order Value"
            value={formatCurrency(kpiData.avgOrderValue || 0)}
            icon={<Assessment fontSize="large" />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard 
            title="Total Units Sold"
            value={(kpiData.totalUnits || 0).toLocaleString()}
            icon={<ShoppingCart fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard 
            title="Inventory Value"
            value={formatCurrency(kpiData.inventoryValue || 0)}
            icon={<Inventory fontSize="large" />}
            color="info"
          />
        </Grid>
      </Grid>

      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Sales Summary" />
        <Tab label="Product Performance" />
        <Tab label="Customer Insights" />
        <Tab label="Revenue Analytics" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={3}>
          {/* Filters */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Filters & Date Range</Typography>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <DatePicker
                          label="Start Date"
                          value={startDate}
                          onChange={setStartDate}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <DatePicker
                          label="End Date"
                          value={endDate}
                          onChange={setEndDate}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button 
                          fullWidth
                          variant="contained"
                          onClick={() => {
                            fetchSalesSummary();
                          }}
                        >
                          Apply Filters
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button 
                          fullWidth
                          variant="outlined"
                          onClick={() => exportReport('sales_summary', salesSummary)}
                          startIcon={<GetApp />}
                        >
                          Export
                        </Button>
                      </Grid>
                    </Grid>
                  </LocalizationProvider>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Revenue & Units Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Revenue & Units Sold Trend</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={salesSummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => [
                      name === 'total_revenue' ? formatCurrency(value) : value,
                      name === 'total_revenue' ? 'Revenue' : 'Units Sold'
                    ]} />
                    <Area yAxisId="left" type="monotone" dataKey="total_revenue" fill="#8884d8" fillOpacity={0.3} />
                    <Bar yAxisId="right" dataKey="total_units_sold" fill="#82ca9d" />
                    <Line yAxisId="left" type="monotone" dataKey="total_revenue" stroke="#8884d8" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Sales Summary Stats */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Period Summary</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Total Revenue:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(salesSummary.reduce((sum, item) => sum + (item.total_revenue || 0), 0))}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Total Orders:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {salesSummary.reduce((sum, item) => sum + (item.total_transactions || 0), 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Units Sold:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {salesSummary.reduce((sum, item) => sum + (item.total_units_sold || 0), 0)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Avg Daily Revenue:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(salesSummary.length > 0 ? 
                            salesSummary.reduce((sum, item) => sum + (item.total_revenue || 0), 0) / salesSummary.length : 0
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Top Sales Days</Typography>
                    {salesSummary
                      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
                      .slice(0, 5)
                      .map((day, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{day.date}</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(day.total_revenue || 0)}
                          </Typography>
                        </Box>
                      ))
                    }
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Grid container spacing={3}>
          {/* Filters */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Category Filter</InputLabel>
                    <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                      <MenuItem value="all">All Categories</MenuItem>
                      {[...new Set(productPerformance.map(p => p.category))].map(category => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button 
                    variant="contained"
                    onClick={() => exportReport('product_performance', productPerformance)}
                    startIcon={<GetApp />}
                  >
                    Export Data
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Revenue vs Profit Margin */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Revenue vs Profit Analysis</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={productPerformance.filter(p => selectedCategory === 'all' || p.category === selectedCategory)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => [
                      name === 'total_revenue' ? formatCurrency(value) : 
                      name === 'profit_margin' ? `${value}%` : value,
                      name === 'total_revenue' ? 'Revenue' : 
                      name === 'profit_margin' ? 'Profit Margin' : name
                    ]} />
                    <Bar yAxisId="left" dataKey="total_revenue" fill="#8884d8" name="Revenue" />
                    <Line yAxisId="right" type="monotone" dataKey="stock_turnover" stroke="#ff7300" strokeWidth={2} name="Stock Turnover" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Product Performance Summary */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Performance Insights</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Top Revenue Product:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {productPerformance.length > 0 ? 
                            productPerformance.reduce((max, p) => p.total_revenue > max.total_revenue ? p : max, productPerformance[0]).name
                            : 'N/A'
                          }
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Highest Turnover:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {productPerformance.length > 0 ? 
                            productPerformance.reduce((max, p) => p.stock_turnover > max.stock_turnover ? p : max, productPerformance[0]).name
                            : 'N/A'
                          }
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Low Stock Items:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="warning.main">
                          {productPerformance.filter(p => p.current_stock <= 20).length} products
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Total Categories:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {[...new Set(productPerformance.map(p => p.category))].length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Category Distribution</Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[...new Set(productPerformance.map(p => p.category))].map(category => ({
                            name: category,
                            value: productPerformance
                              .filter(p => p.category === category)
                              .reduce((sum, p) => sum + (p.total_revenue || 0), 0)
                          }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                        >
                          {[...new Set(productPerformance.map(p => p.category))].map((entry, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
          
          {/* Inventory Health */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Inventory Health Analysis</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productPerformance.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'current_stock' ? `${value} units` : value,
                      name === 'current_stock' ? 'Current Stock' : name
                    ]} />
                    <Bar dataKey="current_stock" fill="#82ca9d" name="Current Stock">
                      {productPerformance.slice(0, 10).map((entry, index) => (
                        <Cell key={index} fill={entry.current_stock <= 20 ? '#ff4444' : entry.current_stock <= 50 ? '#ffaa00' : '#82ca9d'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Chip size="small" sx={{ backgroundColor: '#ff4444', color: 'white' }} label="Critical Stock (≤20)" />
                  <Chip size="small" sx={{ backgroundColor: '#ffaa00', color: 'white' }} label="Low Stock (≤50)" />
                  <Chip size="small" sx={{ backgroundColor: '#82ca9d', color: 'white' }} label="Normal Stock (>50)" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={2}>
        <Grid container spacing={3}>
          {customerInsights.map((customer) => (
            <Grid item xs={12} md={6} key={customer.customer_id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{customer.name}</Typography>
                  <Typography>Total Spent: {formatCurrency(customer.total_spent)}</Typography>
                  <Typography>Total Purchases: {customer.total_purchases}</Typography>
                  <Typography>Last Purchase: {customer.last_purchase_date || 'N/A'}</Typography>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Favorite Categories:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {customer.favorite_categories && customer.favorite_categories.length > 0 ? (
                      customer.favorite_categories.map((category, index) => (
                        <Chip key={index} label={category} color="primary" variant="outlined" />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">No purchases yet</Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={3}>
        <Card>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={period}
                  label="Time Period"
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={revenueAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#82ca9d" name="Transactions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
}

export default Reports; 