import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
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
} from "recharts";
import apiClient from "./api";

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Vendors() {
  const [tabIndex, setTabIndex] = useState(0);
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    rating: 0,
  });
  const [orderForm, setOrderForm] = useState({
    vendor_id: "",
    product_id: "",
    quantity: "",
    unit_price: "",
    expected_delivery: null,
    notes: "",
  });
  const [performanceData, setPerformanceData] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const fetchVendors = async () => {
    try {
      const response = await apiClient.get("/api/vendors");
      setVendors(response.data);
    } catch (err) {
      setError("Failed to fetch vendors");
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const response = await apiClient.get(
        "/api/purchase-orders",
      );
      setPurchaseOrders(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to fetch purchase orders";
      setError(errorMsg);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get("/products");
      setProducts(response.data);
    } catch (err) {
      setError("Failed to fetch products");
    }
  };

  const fetchVendorPerformance = async (vendorId) => {
    try {
      const response = await apiClient.get(
        `/api/vendors/${vendorId}/performance`,
      );
      setPerformanceData(response.data);
      setPerformanceDialogOpen(true);
    } catch (err) {
      setError("Failed to fetch vendor performance");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchVendors(),
        fetchPurchaseOrders(),
        fetchProducts(),
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleVendorSubmit = async () => {
    try {
      if (selectedVendor) {
        await apiClient.put(
          `/api/vendors/${selectedVendor.id}`,
          vendorForm,
        );
      } else {
        await apiClient.post("/api/vendors", vendorForm);
      }
      fetchVendors();
      setVendorDialogOpen(false);
      setSelectedVendor(null);
      setVendorForm({
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        status: "active",
        rating: 0,
      });
    } catch (err) {
      setError("Failed to save vendor");
    }
  };
  const handleOrderSubmit = async () => {
    try {
      if (selectedOrder) {
        await apiClient.put(
          `/api/purchase-orders/${selectedOrder.id}`,
          orderForm,
        );
      } else {
        await apiClient.post(
          "/api/purchase-orders",
          orderForm,
        );
      }
      fetchPurchaseOrders();
      setOrderDialogOpen(false);
      setSelectedOrder(null);
      setOrderForm({
        vendor_id: "",
        product_id: "",
        quantity: "",
        unit_price: "",
        expected_delivery: null,
        notes: "",
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to save purchase order";
      setError(errorMsg);
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    try {
      await apiClient.delete(`/api/vendors/${vendorId}`);
      fetchVendors();
    } catch (err) {
      setError("Failed to delete vendor");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiClient.put(`/api/purchase-orders/${orderId}`, {
        status: newStatus,
      });
      fetchPurchaseOrders();
    } catch (err) {
      setError("Failed to update order status");
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Vendor Management
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Vendors" />
        <Tab label="Purchase Orders" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5">Vendors</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedVendor(null);
              setVendorDialogOpen(true);
            }}
          >
            Add Vendor
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell>{vendor.contact_person}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.phone}</TableCell>
                  <TableCell>
                    <Chip
                      label={vendor.status}
                      color={vendor.status === "active" ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Rating value={vendor.rating} readOnly size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setVendorForm(vendor);
                        setVendorDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteVendor(vendor.id)}>
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => fetchVendorPerformance(vendor.id)}
                    >
                      <AssessmentIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5">Purchase Orders</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedOrder(null);
              setOrderDialogOpen(true);
            }}
          >
            Create Order
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expected Delivery</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.vendor?.name || "N/A"}</TableCell>
                  <TableCell>{order.product?.name || "N/A"}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>₹{order.unit_price}</TableCell>
                  <TableCell>
                    <FormControl size="small">
                      <Select
                        value={order.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(order.id, e.target.value)
                        }
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="received">Received</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {order.expected_delivery
                      ? new Date(order.expected_delivery).toLocaleDateString()
                      : "Not set"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => {
                        setSelectedOrder(order);
                        setOrderForm({
                          ...order,
                          vendor_id: order.vendor?.id || "",
                          product_id: order.product?.id || "",
                        });
                        setOrderDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Vendor Dialog */}
      <Dialog
        open={vendorDialogOpen}
        onClose={() => setVendorDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedVendor ? "Edit Vendor" : "Add Vendor"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Name"
                fullWidth
                value={vendorForm.name}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contact Person"
                fullWidth
                value={vendorForm.contact_person}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    contact_person: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                value={vendorForm.email}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={vendorForm.phone}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, phone: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={vendorForm.address}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, address: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={vendorForm.status}
                  label="Status"
                  onChange={(e) =>
                    setVendorForm({ ...vendorForm, status: e.target.value })
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography component="legend">Rating</Typography>
              <Rating
                value={vendorForm.rating}
                onChange={(event, newValue) => {
                  setVendorForm({ ...vendorForm, rating: newValue });
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVendorDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleVendorSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Purchase Order Dialog */}
      <Dialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedOrder ? "Edit Purchase Order" : "Create Purchase Order"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Vendor</InputLabel>
                <Select
                  value={orderForm.vendor_id}
                  label="Vendor"
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, vendor_id: e.target.value })
                  }
                >
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  value={orderForm.product_id}
                  label="Product"
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, product_id: e.target.value })
                  }
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                value={orderForm.quantity}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, quantity: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Unit Price"
                type="number"
                fullWidth
                value={orderForm.unit_price}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, unit_price: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Expected Delivery"
                  value={orderForm.expected_delivery}
                  onChange={(newValue) =>
                    setOrderForm({ ...orderForm, expected_delivery: newValue })
                  }
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={orderForm.notes}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, notes: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleOrderSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Performance Dialog */}
      <Dialog
        open={performanceDialogOpen}
        onClose={() => setPerformanceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Supplier Performance</DialogTitle>
        <DialogContent>
          {performanceData && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Delivery Performance
                    </Typography>
                    <Typography>
                      On-time Delivery Rate:{" "}
                      {(performanceData.on_time_delivery_rate * 100).toFixed(1)}
                      %
                    </Typography>
                    <Typography>
                      Average Delivery Days:{" "}
                      {performanceData.average_delivery_days.toFixed(1)}
                    </Typography>
                    <Typography>
                      Order Fulfillment Rate:{" "}
                      {(performanceData.order_fulfillment_rate * 100).toFixed(
                        1,
                      )}
                      %
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Order Statistics
                    </Typography>
                    <Typography>
                      Total Orders: {performanceData.total_orders}
                    </Typography>
                    <Typography>
                      Total Spend: ₹{performanceData.total_spend.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPerformanceDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Vendors;
