import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  useTheme,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InfoIcon from '@mui/icons-material/Info';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

const ITEMS_PER_PAGE = 5;

const MetricChip = ({ label, value, tooltip }) => {
  const theme = useTheme();
  return (
    <Tooltip title={tooltip}>
      <Chip
        label={`${label}: ${value}`}
        size="small"
        sx={{
          mr: 1,
          backgroundColor: theme.palette.primary.light + '20',
          color: theme.palette.primary.main,
          '& .MuiChip-label': {
            px: 1,
          },
        }}
      />
    </Tooltip>
  );
};

const BundleCard = ({ recommendation }) => {
  const theme = useTheme();
  const { type, names, categories, support, confidence, lift, count, description, products, ranges } = recommendation;

  const getBundleIcon = () => {
    switch (type) {
      case 'bundle':
        return <ShoppingCartIcon color="primary" />;
      case 'category_bundle':
        return <TrendingUpIcon color="secondary" />;
      case 'price_bundle':
        return <InfoIcon color="success" />;
      default:
        return <ShoppingCartIcon color="primary" />;
    }
  };

  const getBundleTitle = () => {
    switch (type) {
      case 'bundle':
        return `${names[0]} + ${names[1]}`;
      case 'category_bundle':
        return description;
      case 'price_bundle':
        return description;
      default:
        return 'Product Bundle';
    }
  };

  const getBundleDescription = () => {
    switch (type) {
      case 'bundle':
        return `Frequently bought together: ${names[0]} and ${names[1]}`;
      case 'category_bundle':
        return `Popular combination: ${categories[0]} + ${categories[1]} products`;
      case 'price_bundle':
        return `Great value: ${ranges[0]} + ${ranges[1]} price range items`;
      default:
        return 'Recommended product bundle';
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 2, border: `2px solid ${theme.palette.primary.light}20` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Box
              sx={{
                backgroundColor: theme.palette.primary.light + '20',
                borderRadius: '50%',
                p: 1.5,
                mr: 2,
                display: 'flex',
              }}
            >
              {getBundleIcon()}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {getBundleTitle()}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {getBundleDescription()}
              </Typography>
              
              {type === 'bundle' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {names.map((name, index) => (
                    <Chip
                      key={index}
                      label={name}
                      size="small"
                      sx={{ 
                        backgroundColor: theme.palette.primary.light + '20', 
                        color: theme.palette.primary.main,
                        fontWeight: 500
                      }}
                    />
                  ))}
                </Box>
              )}
              
              {type === 'category_bundle' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {categories.map((category, index) => (
                    <Chip
                      key={index}
                      label={category}
                      size="small"
                      color="secondary"
                    />
                  ))}
                </Box>
              )}
              
              {type === 'price_bundle' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {ranges.map((range, index) => (
                    <Chip
                      key={index}
                      label={range}
                      size="small"
                      color="success"
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {support && (
            <MetricChip
              label="Support"
              value={support}
              tooltip="Percentage of transactions containing this bundle"
            />
          )}
          {confidence && (
            <MetricChip
              label="Confidence"
              value={confidence}
              tooltip="Probability of buying both items together"
            />
          )}
          {lift && (
            <MetricChip
              label="Lift"
              value={lift}
              tooltip="How much more likely items are bought together vs random"
            />
          )}
          {count && (
            <MetricChip
              label="Frequency"
              value={count}
              tooltip="Number of times this bundle was purchased"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

function RecommendationsView({ recommendations, loading, error }) {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('confidence');

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(1);
  };

  const sortedRecommendations = [...(recommendations || [])].sort((a, b) => {
    if (sortBy === 'confidence') {
      return (b.confidence || 0) - (a.confidence || 0);
    } else if (sortBy === 'support') {
      return (b.support || 0) - (a.support || 0);
    } else if (sortBy === 'lift') {
      return (b.lift || 0) - (a.lift || 0);
    } else if (sortBy === 'count') {
      return (b.count || 0) - (a.count || 0);
    }
    return 0;
  });
  const totalPages = Math.ceil(sortedRecommendations.length / ITEMS_PER_PAGE);
  const currentRecommendations = sortedRecommendations.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6">
            Product Bundle Recommendations
          </Typography>
          <Tooltip title="These bundle recommendations are generated using advanced market basket analysis to find products frequently bought together">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        {!loading && recommendations?.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort by</InputLabel>
            <Select value={sortBy} onChange={handleSortChange} label="Sort by">
              <MenuItem value="confidence">Confidence</MenuItem>
              <MenuItem value="support">Support</MenuItem>
              <MenuItem value="lift">Lift</MenuItem>
              <MenuItem value="count">Frequency</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Tooltip title="Try refreshing the page or contact support if the problem persists">
              <IconButton size="small" color="inherit">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        >
          {error}
        </Alert>
      ) : recommendations?.length > 0 ? (
        <>
          <Box sx={{ mb: 3 }}>
            {currentRecommendations.map((rec, i) => (
              <BundleCard key={i} recommendation={rec} />
            ))}
          </Box>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          No bundle recommendations available. This could be due to insufficient sales data or weak product associations. Try adding more diverse sales data to generate meaningful bundles.
        </Alert>
      )}
    </Box>
  );
}

export default RecommendationsView; 