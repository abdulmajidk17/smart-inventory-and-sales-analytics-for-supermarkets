import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  useTheme,
  IconButton,
  Tooltip,
  Chip,
  Skeleton,
  Paper,
  Button,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import apiClient from "./api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format } from "date-fns";
import ForecastingView from "./components/ForecastingView";
import RecommendationsView from "./components/RecommendationsView";
import ReorderView from "./components/ReorderView";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const StatCard = ({ title, value, icon, loading, trend, color }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        overflow: "visible",
        background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${color}05)`,
        border: `1px solid ${color}20`,
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 25px ${color}20`,
          border: `1px solid ${color}40`,
        },
      }}
    >
      <CardContent sx={{ position: "relative", zIndex: 1, p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${color}, ${color}CC)`,
              borderRadius: 2,
              p: 1.5,
              mr: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 12px ${color}30`,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="subtitle2"
            color="textSecondary"
            sx={{ fontWeight: 500 }}
          >
            {title}
          </Typography>
        </Box>
        {loading ? (
          <Skeleton variant="text" width="60%" height={40} />
        ) : (
          <>
            <Typography
              variant="h4"
              component="div"
              sx={{ mb: 1, fontWeight: 700, color: theme.palette.text.primary }}
            >
              {value}
            </Typography>
            {trend !== undefined && (
              <Chip
                size="small"
                icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={`${trend > 0 ? "+" : ""}${trend}%`}
                color={trend > 0 ? "success" : "error"}
                sx={{
                  height: 28,
                  fontWeight: 600,
                  "& .MuiChip-icon": {
                    fontSize: 16,
                  },
                }}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ml-tabpanel-${index}`}
      aria-labelledby={`ml-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function Dashboard() {
  const theme = useTheme();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New state for enhanced inventory data
  const [inventoryByCategory, setInventoryByCategory] = useState(null);
  const [inventoryStatus, setInventoryStatus] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState(null);

  const [forecast, setForecast] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [reorder, setReorder] = useState([]);

  const [mlLoading, setMlLoading] = useState(true);
  const [forecastError, setForecastError] = useState("");
  const [recommendationsError, setRecommendationsError] = useState("");
  const [reorderError, setReorderError] = useState("");

  const [tabIndex, setTabIndex] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  const fetchMLData = async () => {
    setMlLoading(true);
    setForecastError("");
    setRecommendationsError("");
    setReorderError("");

    try {
      // Use the correct forecast URL based on selection
      const forecastUrl = selectedProductId
        ? `/forecast?product_id=${selectedProductId}`
        : "/forecast";

      console.log("Fetching forecast from:", forecastUrl);

      const [forecastRes, recRes, reorderRes] = await Promise.all([
        apiClient.get(forecastUrl).catch((err) => {
          console.error("Forecast error:", err);
          return (
            err.response || { status: 500, data: { error: "Network error" } }
          );
        }),
        apiClient
          .get("/recommend")
          .catch((err) => err.response || { status: 500 }),
        apiClient
          .get("/reorder")
          .catch((err) => err.response || { status: 500 }),
      ]);

      // Handle forecast response
      if (forecastRes && forecastRes.status === 200) {
        console.log("Forecast response:", forecastRes.data);
        // Handle both new format (with summary) and old format (array only)
        if (
          forecastRes.data.forecast &&
          Array.isArray(forecastRes.data.forecast)
        ) {
          setForecast(forecastRes.data); // Pass entire response including summary
        } else if (Array.isArray(forecastRes.data)) {
          setForecast(forecastRes.data); // Legacy format
        } else {
          console.warn("Unexpected forecast format:", forecastRes.data);
          setForecast([]);
          setForecastError("Unexpected forecast data format");
        }
      } else {
        const errorMsg =
          forecastRes?.data?.error || "Forecast data unavailable";
        console.error("Forecast failed:", errorMsg);
        setForecast([]);
        setForecastError(errorMsg);
      }

      if (recRes.status === 200) {
        setRecommendations(recRes.data.recommendations || []);
      } else {
        setRecommendationsError(
          recRes.data?.error || "Recommendations unavailable",
        );
      }

      if (reorderRes.status === 200) {
        setReorder(reorderRes.data.reorder_predictions || []);
      } else {
        setReorderError(
          reorderRes.data?.error || "Reorder predictions unavailable",
        );
      }
    } catch (err) {
      setForecastError("Failed to load forecast data.");
      setRecommendationsError("Failed to load recommendations.");
      setReorderError("Failed to load reorder predictions.");
    }
    setMlLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, productsRes, categoryRes, statusRes, alertsRes] =
        await Promise.all([
          apiClient.get("/sales-data"),
          apiClient.get("/products"),
          apiClient.get("/api/inventory/by-category"),
          apiClient.get("/api/inventory/status"),
          apiClient.get("/api/inventory/low-stock"),
        ]);
      setSales(salesRes.data);
      setProducts(productsRes.data);
      setInventoryByCategory(categoryRes.data);
      setInventoryStatus(statusRes.data);
      setLowStockAlerts(alertsRes.data);
      setError("");
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to fetch dashboard data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (sales.length > 0) {
      fetchMLData();
    }
  }, [sales, selectedProductId]);

  // Prepare sales data for line chart (group by date)
  const salesByDate = sales.reduce((acc, sale) => {
    const date = sale.date;
    acc[date] = (acc[date] || 0) + sale.quantity;
    return acc;
  }, {});
  const salesChartData = Object.entries(salesByDate)
    .map(([date, quantity]) => ({
      date: format(new Date(date), "MMM dd"),
      quantity,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate sales trends
  const salesTrend =
    salesChartData.length > 1
      ? (
          ((salesChartData[salesChartData.length - 1].quantity -
            salesChartData[0].quantity) /
            salesChartData[0].quantity) *
          100
        ).toFixed(1)
      : 0;

  // Prepare category-wise stock data
  const stockByCategory = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.stock;
    return acc;
  }, {});
  const categoryChartData = Object.entries(stockByCategory).map(
    ([category, stock], i) => ({
      category,
      stock,
      color: COLORS[i % COLORS.length],
    }),
  );

  // Enhanced low stock and inventory calculations
  const lowStock = lowStockAlerts?.critical_stock || [];
  const totalInventory = inventoryStatus?.total_products || products.length;
  const totalInventoryValue = inventoryStatus?.total_stock_value || 0;
  const criticalCount = lowStockAlerts?.summary?.critical_count || 0;
  const lowCount = lowStockAlerts?.summary?.low_stock_count || 0;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}20`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: 2,
              boxShadow: `0 4px 20px ${theme.palette.primary.main}30`,
              animation: refreshing
                ? "pulse 1.5s ease-in-out infinite"
                : "none",
              "@keyframes pulse": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.05)" },
              },
            }}
          >
            <DashboardIcon sx={{ color: "white", fontSize: 32 }} />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 0.5,
              }}
            >
              Dashboard Overview
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Monitor your inventory, sales performance, and AI insights in
              real-time
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh all data" arrow>
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{
              backgroundColor: theme.palette.background.paper,
              boxShadow: `0 2px 8px ${theme.palette.divider}30`,
              animation: refreshing ? "spin 1s linear infinite" : "none",
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
              "&:hover": {
                backgroundColor: theme.palette.primary.light + "10",
                transform: refreshing ? "none" : "translateY(-1px)",
                boxShadow: `0 4px 12px ${theme.palette.divider}40`,
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sales"
            value={
              salesChartData.length > 0
                ? salesChartData[salesChartData.length - 1].quantity
                : 0
            }
            icon={<TrendingUpIcon sx={{ color: "white", fontSize: 28 }} />}
            loading={loading}
            trend={salesTrend}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={totalInventory}
            icon={<InventoryIcon sx={{ color: "white", fontSize: 28 }} />}
            loading={loading}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`₹${(totalInventoryValue / 1000).toFixed(1)}K`}
            icon={<AttachMoneyIcon sx={{ color: "white", fontSize: 28 }} />}
            loading={loading}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Alerts"
            value={`${criticalCount}${lowCount > 0 ? `+${lowCount}` : ""}`}
            icon={<WarningAmberIcon sx={{ color: "white", fontSize: 28 }} />}
            loading={loading}
            color={
              criticalCount > 0
                ? theme.palette.error.main
                : theme.palette.warning.main
            }
          />
        </Grid>

        <Grid item xs={12} md={7}>
          <Card
            sx={{
              height: "100%",
              background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.primary.main}05)`,
              border: `1px solid ${theme.palette.primary.main}20`,
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: `0 8px 25px ${theme.palette.primary.main}15`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      borderRadius: 2,
                      p: 1.5,
                      mr: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 4px 12px ${theme.palette.primary.main}30`,
                    }}
                  >
                    <TrendingUpIcon sx={{ color: "white", fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                      }}
                    >
                      Daily Sales Trend
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Last 30 days performance
                    </Typography>
                  </Box>
                </Box>
                {salesChartData.length > 0 && (
                  <Chip
                    label={`${salesChartData.length} days`}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>
              {loading ? (
                <Skeleton variant="rectangular" width="100%" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={salesChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.palette.divider}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: theme.palette.text.secondary }}
                      stroke={theme.palette.divider}
                    />
                    <YAxis
                      tick={{ fill: theme.palette.text.secondary }}
                      stroke={theme.palette.divider}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="quantity"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      dot={false}
                      name="Total Quantity Sold"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card
            sx={{
              height: "100%",
              background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.success.main}05)`,
              border: `1px solid ${theme.palette.success.main}20`,
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: `0 8px 25px ${theme.palette.success.main}15`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                      borderRadius: 2,
                      p: 1.5,
                      mr: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 4px 12px ${theme.palette.success.main}30`,
                    }}
                  >
                    <InventoryIcon sx={{ color: "white", fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.success.main,
                      }}
                    >
                      Inventory by Category
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Stock distribution & health
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {loading || !inventoryByCategory ? (
                <Skeleton variant="rectangular" width="100%" height={300} />
              ) : (
                <Box sx={{ height: 300 }}>
                  {inventoryByCategory.categories.map((category, index) => {
                    const healthColor =
                      category.category_health === "healthy"
                        ? theme.palette.success.main
                        : category.category_health === "critical"
                          ? theme.palette.error.main
                          : category.category_health === "needs_attention"
                            ? theme.palette.warning.main
                            : theme.palette.info.main;

                    return (
                      <Box key={category.category} sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {category.category}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                            }}
                          >
                            <Chip
                              size="small"
                              label={category.category_health
                                .replace("_", " ")
                                .toUpperCase()}
                              sx={{
                                backgroundColor: `${healthColor}20`,
                                color: healthColor,
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                            <Typography variant="body2" color="textSecondary">
                              {category.total_products} items
                            </Typography>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2" color="textSecondary">
                            Stock: {Math.max(0, category.total_stock)} |
                            Available: {Math.max(0, category.available_stock)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Value: ₹{(category.total_value / 1000).toFixed(1)}K
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 8,
                            backgroundColor: theme.palette.grey[200],
                            borderRadius: 4,
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <Box
                            sx={{
                              height: "100%",
                              width: `${Math.min(100, Math.max(5, (Math.max(0, category.available_stock) / Math.max(1, category.total_stock)) * 100))}%`,
                              background: `linear-gradient(90deg, ${healthColor}, ${healthColor}CC)`,
                              borderRadius: 4,
                              transition: "width 0.3s ease-in-out",
                            }}
                          />
                          {category.reorder_needed > 0 && (
                            <Box
                              sx={{
                                position: "absolute",
                                right: 4,
                                top: -2,
                                bottom: -2,
                                width: 2,
                                backgroundColor: theme.palette.warning.main,
                                borderRadius: 1,
                              }}
                            />
                          )}
                        </Box>
                        {category.reorder_needed > 0 && (
                          <Typography
                            variant="caption"
                            color="warning.main"
                            sx={{ mt: 0.5, display: "block" }}
                          >
                            ⚠️ {category.reorder_needed} items need reorder
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.secondary.main}05)`,
              border: `1px solid ${theme.palette.secondary.main}20`,
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: `0 8px 25px ${theme.palette.secondary.main}15`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                      borderRadius: 2,
                      p: 1,
                      mr: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 4px 12px ${theme.palette.secondary.main}30`,
                    }}
                  >
                    <AssessmentIcon sx={{ color: "white" }} />
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.secondary.main,
                    }}
                  >
                    AI-Powered Insights
                  </Typography>
                </Box>
                {mlLoading && <CircularProgress size={24} />}
              </Box>
              <Paper sx={{ borderRadius: 1 }}>
                <Tabs
                  value={tabIndex}
                  onChange={handleTabChange}
                  aria-label="ml models tabs"
                  sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    "& .MuiTab-root": {
                      minHeight: 48,
                      textTransform: "none",
                      fontSize: "1rem",
                    },
                  }}
                >
                  <Tab label="Sales Forecasting" id="ml-tab-0" />
                  <Tab label="Product Recommendations" id="ml-tab-1" />
                  <Tab label="Reorder Predictions" id="ml-tab-2" />
                </Tabs>
                <Box sx={{ p: 2 }}>
                  <TabPanel value={tabIndex} index={0}>
                    <ForecastingView
                      forecast={forecast}
                      loading={mlLoading}
                      error={forecastError}
                      products={products}
                      selectedProductId={selectedProductId}
                      onProductChange={setSelectedProductId}
                    />
                  </TabPanel>
                  <TabPanel value={tabIndex} index={1}>
                    <RecommendationsView
                      recommendations={recommendations}
                      loading={mlLoading}
                      error={recommendationsError}
                    />
                  </TabPanel>
                  <TabPanel value={tabIndex} index={2}>
                    <ReorderView
                      reorder={reorder}
                      loading={mlLoading}
                      error={reorderError}
                      onDataRefresh={fetchMLData}
                    />
                  </TabPanel>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.warning.main}05)`,
              border: `1px solid ${theme.palette.warning.main}20`,
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: `0 8px 25px ${theme.palette.warning.main}15`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                      borderRadius: 2,
                      p: 1,
                      mr: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 4px 12px ${theme.palette.warning.main}30`,
                    }}
                  >
                    <WarningAmberIcon sx={{ color: "white" }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: theme.palette.warning.main }}
                  >
                    Low Stock Alerts
                  </Typography>
                </Box>
                {lowStock.length > 0 && (
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<WarningAmberIcon />}
                    onClick={() => setTabIndex(2)} // Switch to reorder tab
                  >
                    View Reorder Suggestions
                  </Button>
                )}
              </Box>
              {loading || !lowStockAlerts ? (
                <Grid container spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                      <Skeleton variant="rectangular" height={56} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box>
                  {/* Critical Stock Items */}
                  {lowStockAlerts.critical_stock &&
                    lowStockAlerts.critical_stock.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle1"
                          color="error.main"
                          sx={{ mb: 2, fontWeight: 600 }}
                        >
                          🔴 Critical Stock (
                          {lowStockAlerts.critical_stock.length} items)
                        </Typography>
                        <Grid container spacing={2}>
                          {lowStockAlerts.critical_stock.map((p) => (
                            <Grid item xs={12} sm={6} md={4} key={p.id}>
                              <Alert
                                severity="error"
                                sx={{
                                  "& .MuiAlert-message": {
                                    width: "100%",
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <Box>
                                    <Typography variant="subtitle2">
                                      {p.name}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="textSecondary"
                                    >
                                      {p.category} | Safety: {p.safety_stock}
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "end",
                                    }}
                                  >
                                    <Chip
                                      label={`${Math.max(0, p.stock)} left`}
                                      color="error"
                                      size="small"
                                      sx={{ mb: 0.5 }}
                                    />
                                    {p.needs_reorder && (
                                      <Chip
                                        label="REORDER NOW"
                                        color="warning"
                                        size="small"
                                        sx={{ fontSize: "0.7rem" }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </Alert>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                  {/* Low Stock Items */}
                  {lowStockAlerts.low_stock &&
                    lowStockAlerts.low_stock.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle1"
                          color="warning.main"
                          sx={{ mb: 2, fontWeight: 600 }}
                        >
                          🟡 Low Stock ({lowStockAlerts.low_stock.length} items)
                        </Typography>
                        <Grid container spacing={2}>
                          {lowStockAlerts.low_stock.map((p) => (
                            <Grid item xs={12} sm={6} md={4} key={p.id}>
                              <Alert
                                severity="warning"
                                sx={{
                                  "& .MuiAlert-message": {
                                    width: "100%",
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <Box>
                                    <Typography variant="subtitle2">
                                      {p.name}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="textSecondary"
                                    >
                                      {p.category} | Reorder at:{" "}
                                      {p.reorder_point}
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "end",
                                    }}
                                  >
                                    <Chip
                                      label={`${p.stock} left`}
                                      color="warning"
                                      size="small"
                                      sx={{ mb: 0.5 }}
                                    />
                                    <Chip
                                      label={`${p.available_stock} available`}
                                      variant="outlined"
                                      color="info"
                                      size="small"
                                      sx={{ fontSize: "0.7rem" }}
                                    />
                                  </Box>
                                </Box>
                              </Alert>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                  {/* All Good Message */}
                  {(!lowStockAlerts.critical_stock ||
                    lowStockAlerts.critical_stock.length === 0) &&
                    (!lowStockAlerts.low_stock ||
                      lowStockAlerts.low_stock.length === 0) && (
                      <Alert severity="success" sx={{ textAlign: "center" }}>
                        <Typography variant="h6">
                          ✅ All products are well-stocked!
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          No critical or low stock items detected. Your
                          inventory levels are healthy.
                        </Typography>
                      </Alert>
                    )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
