import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  TablePagination,
  Button,
  useTheme,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  ButtonGroup,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AddBoxIcon from "@mui/icons-material/AddBox";
import EmailIcon from "@mui/icons-material/Email";
import apiClient from "../api";
import EmailPreviewDialog from "./EmailPreviewDialog";

const StatusChip = ({ currentStock, reorderPoint }) => {
  const theme = useTheme();
  const urgency =
    currentStock <= reorderPoint
      ? "urgent"
      : currentStock <= reorderPoint * 1.2
        ? "warning"
        : "good";

  const config = {
    urgent: {
      label: "Reorder Now",
      color: "error",
      icon: <WarningIcon fontSize="small" />,
    },
    warning: {
      label: "Order Soon",
      color: "warning",
      icon: <InventoryIcon fontSize="small" />,
    },
    good: {
      label: "Stock Healthy",
      color: "success",
      icon: <CheckCircleIcon fontSize="small" />,
    },
  }[urgency];

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
    />
  );
};

const StatCard = ({ title, value, icon, info }) => {
  const theme = useTheme();
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box
            sx={{
              backgroundColor: theme.palette.primary.light + "20",
              borderRadius: "50%",
              p: 1,
              mr: 2,
              display: "flex",
            }}
          >
            {icon}
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
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
            <Typography variant="h5">{value}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

function ReorderView({ reorder, loading, error, onDataRefresh }) {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [localReorder, setLocalReorder] = useState(reorder || []);

  // Dialog states
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [orderQuantity, setOrderQuantity] = useState("");
  const [restockQuantity, setRestockQuantity] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [createdPurchaseOrder, setCreatedPurchaseOrder] = useState(null);

  // Update local reorder data when props change
  React.useEffect(() => {
    setLocalReorder(reorder || []);
  }, [reorder]);

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await apiClient.get("/api/vendors");
        setVendors(response.data);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };
    fetchSuppliers();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreatePurchaseOrder = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(product.eoq || product.reorder_point || 20);
    setOrderDialogOpen(true);
  };

  const handleRestockProduct = (product) => {
    setSelectedProduct(product);
    setRestockQuantity(product.eoq || product.reorder_point || 20);
    setRestockCost(product.price * 0.7); // Default to 70% of selling price
    setRestockDialogOpen(true);
  };

  const submitPurchaseOrder = async () => {
    if (!selectedVendor || !orderQuantity) {
      setSnackbar({
        open: true,
        message: "Please select vendor and quantity",
        severity: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiClient.post(
        "/api/purchase-orders/from-reorder",
        {
          product_id: selectedProduct.id,
          vendor_id: selectedVendor,
          quantity: parseInt(orderQuantity),
          notes: `Reorder from dashboard - EOQ: ${selectedProduct.eoq}`,
        },
      );

      setCreatedPurchaseOrder(response.data.purchase_order);
      setSnackbar({
        open: true,
        message: `Purchase order created! Click to view email notification.`,
        severity: "success",
      });
      setOrderDialogOpen(false);
      setEmailPreviewOpen(true);
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error || "Failed to create purchase order",
        severity: "error",
      });
    }
    setActionLoading(false);
  };

  const submitRestock = async () => {
    if (!restockQuantity) {
      setSnackbar({
        open: true,
        message: "Please enter quantity to restock",
        severity: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiClient.post(
        "/api/inventory/restock",
        {
          product_id: selectedProduct.id,
          quantity: parseInt(restockQuantity),
          cost_per_unit: restockCost ? parseFloat(restockCost) : null,
          vendor_id: selectedVendor || null,
          notes: "Manual restock from dashboard",
        },
      );

      setSnackbar({
        open: true,
        message: `Successfully restocked ${restockQuantity} units of ${selectedProduct.name}`,
        severity: "success",
      });
      setRestockDialogOpen(false);

      // Remove the restocked product from local reorder list if it no longer needs reordering
      const updatedStock = selectedProduct.stock + parseInt(restockQuantity);
      if (updatedStock > selectedProduct.reorder_point) {
        setLocalReorder((prevReorder) =>
          prevReorder.filter((item) => item.id !== selectedProduct.id),
        );
      }

      // Refresh parent data
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to restock inventory",
        severity: "error",
      });
    }
    setActionLoading(false);
  };

  const filteredReorder = (localReorder || []).filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const urgentItems = filteredReorder.filter(
    (item) => item.stock <= item.reorder_point,
  );
  const warningItems = filteredReorder.filter(
    (item) =>
      item.stock > item.reorder_point && item.stock <= item.reorder_point * 1.2,
  );
  const totalValue = filteredReorder.reduce(
    (sum, item) => sum + (item.eoq * item.price || 0),
    0,
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="h6">Reorder Recommendations</Typography>
          <Tooltip title="These recommendations are calculated using the Economic Order Quantity (EOQ) formula, considering demand rate, ordering costs, and holding costs">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={400}
        >
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
      ) : filteredReorder.length > 0 ? (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Urgent Reorders"
                value={urgentItems.length}
                icon={<WarningIcon sx={{ color: theme.palette.error.main }} />}
                info="Items below reorder point"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Warning Level"
                value={warningItems.length}
                icon={
                  <InventoryIcon sx={{ color: theme.palette.warning.main }} />
                }
                info="Items approaching reorder point"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Items"
                value={filteredReorder.length}
                icon={
                  <LocalShippingIcon
                    sx={{ color: theme.palette.primary.main }}
                  />
                }
                info="Total number of items tracked"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Est. Order Value"
                value={`₹${totalValue.toLocaleString()}`}
                icon={
                  <TrendingUpIcon sx={{ color: theme.palette.success.main }} />
                }
                info="Estimated total value of recommended orders"
              />
            </Grid>
          </Grid>

          <Paper sx={{ width: "100%", mb: 2 }}>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <TableContainer>
              <Table stickyHeader aria-label="reorder table">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Current Stock</TableCell>
                    <TableCell align="right">Reorder Point</TableCell>
                    <TableCell align="right">Daily Demand</TableCell>
                    <TableCell align="right">Recommended Order (EOQ)</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReorder
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((r) => (
                      <TableRow
                        key={r.id}
                        sx={{
                          backgroundColor:
                            r.stock <= r.reorder_point
                              ? theme.palette.error.light + "10"
                              : r.stock <= r.reorder_point * 1.2
                                ? theme.palette.warning.light + "10"
                                : "inherit",
                        }}
                      >
                        <TableCell>
                          <StatusChip
                            currentStock={r.stock}
                            reorderPoint={r.reorder_point}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">{r.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {r.category}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            color={
                              r.stock <= r.reorder_point ? "error" : "inherit"
                            }
                            fontWeight={r.stock <= r.reorder_point ? 600 : 400}
                          >
                            {r.stock}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{r.reorder_point}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="textSecondary">
                            {r.daily_demand}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" color="primary">
                            {r.eoq}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <ButtonGroup size="small" orientation="vertical">
                            <Button
                              variant="contained"
                              startIcon={<ShoppingCartIcon />}
                              onClick={() => handleCreatePurchaseOrder(r)}
                              color={
                                r.stock <= r.reorder_point ? "error" : "primary"
                              }
                              sx={{ mb: 0.5 }}
                            >
                              Order
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<AddBoxIcon />}
                              onClick={() => handleRestockProduct(r)}
                              color="info"
                            >
                              Restock
                            </Button>
                          </ButtonGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredReorder.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </>
      ) : (
        <Alert severity="success" sx={{ mb: 3 }}>
          All inventory levels are healthy. No reorder actions needed at this
          time.
        </Alert>
      )}

      {/* Purchase Order Dialog */}
      <Dialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Create Purchase Order
          {selectedProduct && (
            <Typography variant="subtitle2" color="textSecondary">
              for {selectedProduct.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    value={selectedVendor}
                    label="Vendor"
                    onChange={(e) => setSelectedVendor(e.target.value)}
                  >
                    {vendors.map((vendor) => (
                      <MenuItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  helperText={
                    selectedProduct ? `EOQ: ${selectedProduct.eoq}` : ""
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Est. Unit Cost"
                  type="number"
                  value={
                    selectedProduct
                      ? (selectedProduct.price * 0.7).toFixed(2)
                      : ""
                  }
                  disabled
                  helperText="Estimated (70% of retail)"
                />
              </Grid>
              {selectedProduct && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      Current Stock: {selectedProduct.stock} | Reorder Point:{" "}
                      {selectedProduct.reorder_point}
                      <br />
                      Estimated Total Cost: ₹
                      {(
                        selectedProduct.price *
                        0.7 *
                        (orderQuantity || 0)
                      ).toFixed(2)}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={submitPurchaseOrder}
            variant="contained"
            disabled={actionLoading}
            startIcon={
              actionLoading ? (
                <CircularProgress size={16} />
              ) : (
                <ShoppingCartIcon />
              )
            }
          >
            Create Purchase Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog
        open={restockDialogOpen}
        onClose={() => setRestockDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Restock Inventory
          {selectedProduct && (
            <Typography variant="subtitle2" color="textSecondary">
              for {selectedProduct.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Vendor (Optional)</InputLabel>
                  <Select
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    label="Vendor (Optional)"
                  >
                    <MenuItem value="">
                      <em>No vendor (manual restock)</em>
                    </MenuItem>
                    {vendors.map((vendor) => (
                      <MenuItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Quantity to Add"
                  type="number"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Cost per Unit"
                  type="number"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  helperText="Optional - for record keeping"
                />
              </Grid>
              {selectedProduct && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      This will immediately add {restockQuantity || 0} units to
                      inventory.
                      <br />
                      Current Stock: {selectedProduct.stock} → New Stock:{" "}
                      {selectedProduct.stock + parseInt(restockQuantity || 0)}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestockDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={submitRestock}
            variant="contained"
            color="success"
            disabled={actionLoading}
            startIcon={
              actionLoading ? <CircularProgress size={16} /> : <AddBoxIcon />
            }
          >
            Add to Inventory
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Email Preview Dialog */}
      <EmailPreviewDialog
        open={emailPreviewOpen}
        onClose={() => setEmailPreviewOpen(false)}
        purchaseOrder={createdPurchaseOrder}
      />
    </Box>
  );
}

export default ReorderView;
