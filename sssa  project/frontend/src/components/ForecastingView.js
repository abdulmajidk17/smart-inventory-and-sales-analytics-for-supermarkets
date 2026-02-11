import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  useTheme,
  Chip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { format } from 'date-fns';

const StatCard = ({ title, value, trend, info }) => {
  const theme = useTheme();
  const isPositive = trend >= 0;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="textSecondary">
            {title}
          </Typography>
          {info && (
            <Tooltip title={info}>
              <IconButton size="small" sx={{ ml: 0.5 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
          <Typography variant="h5" component="div">
            {value}
          </Typography>
          {trend !== undefined && (
            <Chip
              size="small"
              icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${isPositive ? '+' : ''}${trend}%`}
              color={isPositive ? 'success' : 'error'}
              sx={{ ml: 1, height: 24 }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

function ForecastingView({ forecast, loading, error, products, selectedProductId, onProductChange }) {
  const theme = useTheme();

  const {
    formattedForecast,
    forecastSummary,
    averageForecast,
    forecastTrend,
    maxForecast,
    minForecast,
  } = useMemo(() => {
    // Check if forecast is the new enhanced format with summary
    if (!forecast) {
      return {
        formattedForecast: [],
        forecastSummary: null,
        averageForecast: 0,
        forecastTrend: 0,
        maxForecast: 0,
        minForecast: 0,
      };
    }

    // Handle new enhanced forecast format
    if (forecast.forecast && forecast.summary) {
      const formatted = forecast.forecast.map(f => ({
        ...f,
        ds: f.date_formatted || format(new Date(f.ds), 'MMM dd'),
        yhat: Math.round(f.yhat),
        yhat_lower: Math.round(f.yhat_lower),
        yhat_upper: Math.round(f.yhat_upper),
      }));

      return {
        formattedForecast: formatted,
        forecastSummary: forecast.summary,
        averageForecast: Math.round(forecast.summary.average_daily_sales),
        forecastTrend: Math.round(forecast.summary.forecast_trend),
        maxForecast: Math.max(...formatted.map(f => f.yhat)),
        minForecast: Math.min(...formatted.map(f => f.yhat)),
      };
    }

    // Handle legacy forecast format (array only)
    if (Array.isArray(forecast) && forecast.length > 0) {
      const formatted = forecast.map(f => ({
        ...f,
        ds: f.date_formatted || format(new Date(f.ds), 'MMM dd'),
        yhat: Math.round(f.yhat),
        yhat_lower: Math.round(f.yhat_lower),
        yhat_upper: Math.round(f.yhat_upper),
      }));

      const avg = Math.round(formatted.reduce((sum, f) => sum + f.yhat, 0) / formatted.length);
      const trend = formatted.length >= 2 && formatted[0].yhat > 0 
        ? Math.round(((formatted[formatted.length - 1].yhat - formatted[0].yhat) / formatted[0].yhat) * 100)
        : 0;
      const max = Math.max(...formatted.map(f => f.yhat));
      const min = Math.min(...formatted.map(f => f.yhat));

      return {
        formattedForecast: formatted,
        forecastSummary: null,
        averageForecast: avg,
        forecastTrend: trend,
        maxForecast: max,
        minForecast: min,
      };
    }

    return {
      formattedForecast: [],
      forecastSummary: null,
      averageForecast: 0,
      forecastTrend: 0,
      maxForecast: 0,
      minForecast: 0,
    };
  }, [forecast]);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Sales Forecast
          {selectedProduct && (
            <Typography component="span" variant="subtitle1" color="textSecondary" sx={{ ml: 1 }}>
              for {selectedProduct.name}
            </Typography>
          )}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Product</InputLabel>
          <Select
            value={selectedProductId || ''}
            label="Product"
            onChange={(e) => onProductChange(e.target.value)}
          >
            <MenuItem value="">
              <em>All Products</em>
            </MenuItem>
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>
      ) : formattedForecast.length > 0 ? (
        <>
          {/* Enhanced Summary Cards with forecast summary data */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title={forecastSummary ? "Daily Average" : "Average Forecast"}
                value={averageForecast}
                info={forecastSummary ? `Average daily sales over ${forecastSummary.forecast_period}` : "Average predicted sales across the forecast period"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Forecast Trend"
                value={`${forecastTrend}%`}
                trend={forecastTrend}
                info={forecastSummary ? `Sales trend over ${forecastSummary.forecast_period}` : "Predicted sales trend over the forecast period"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title={forecastSummary ? "Total Predicted" : "Peak Forecast"}
                value={forecastSummary ? Math.round(forecastSummary.total_predicted_sales) : maxForecast}
                info={forecastSummary ? `Total sales expected over ${forecastSummary.forecast_period}` : "Highest predicted sales in the forecast period"}
              />
            </Grid>
          </Grid>
          
          {/* Additional Context for Enhanced Forecast */}
          {forecastSummary && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                🔮 Forecast Insights
              </Typography>
              <Typography variant="body2">
                Using {forecastSummary.model_type} model, we predict <strong>{Math.round(forecastSummary.total_predicted_sales)} total units</strong> will be sold over the next {forecastSummary.forecast_period}, 
                with an average of <strong>{Math.round(forecastSummary.average_daily_sales)} units per day</strong>. 
                The forecast shows a <strong>{forecastSummary.forecast_trend > 0 ? 'positive' : forecastSummary.forecast_trend < 0 ? 'negative' : 'stable'} trend</strong> 
                of {Math.abs(forecastSummary.forecast_trend)}% over the period.
              </Typography>
            </Alert>
          )}

          <Paper sx={{ p: 3 }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={formattedForecast}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="ds"
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
                    borderRadius: 8,
                    boxShadow: theme.shadows[3],
                  }}
                  formatter={(value, name, props) => {
                    if (name === 'Forecast') {
                      const dataPoint = props.payload;
                      return [
                        `${Math.round(value)} units`,
                        `Forecast (${dataPoint.confidence_range || dataPoint.yhat_lower + '-' + dataPoint.yhat_upper} range)`
                      ];
                    }
                    return [`${Math.round(value)} units`, name];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <ReferenceLine
                  y={averageForecast}
                  stroke={theme.palette.warning.main}
                  strokeDasharray="3 3"
                  label={{
                    value: 'Average',
                    fill: theme.palette.text.secondary,
                    position: 'right',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="yhat"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={false}
                  name="Forecast"
                />
                <Line
                  type="monotone"
                  dataKey="yhat_upper"
                  stroke={theme.palette.grey[300]}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Upper Bound"
                />
                <Line
                  type="monotone"
                  dataKey="yhat_lower"
                  stroke={theme.palette.grey[300]}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Lower Bound"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          No forecast data available. This could be due to insufficient historical data or the selected product being too new.
        </Alert>
      )}
    </Box>
  );
}

export default ForecastingView; 