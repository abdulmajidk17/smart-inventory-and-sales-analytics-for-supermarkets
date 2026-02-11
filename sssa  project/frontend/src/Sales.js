import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import apiClient from "./api";
import Bill from "./components/Bill";
import { printBill } from "./utils/printUtils";

function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentBill, setCurrentBill] = useState(null);

  // Form states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Dialog states
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Refs
  const billRef = useRef();

  const fetchSales = async () => {
    try {
      const response = await apiClient.get("/sales-data");
      setSales(response.data);
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to fetch sales data.",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p_res, c_res] = await Promise.all([
          apiClient.get("/products"),
          apiClient.get("/customers"),
        ]);
        setProducts(p_res.data);
        setCustomers(c_res.data);
      } catch (error) {
        setNotification({
          open: true,
          message: "Failed to fetch initial data.",
          severity: "error",
        });
      }
    };
    fetchData();
    fetchSales();
  }, []);

  // Cart Management Functions
  const addToCart = () => {
    if (!selectedProduct || quantity <= 0) {
      setNotification({
        open: true,
        message: "Please select a product and enter a valid quantity.",
        severity: "warning",
      });
      return;
    }

    const existingItemIndex = cart.findIndex(
      (item) => item.product_id === selectedProduct.id,
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += parseInt(quantity);
      updatedCart[existingItemIndex].line_total =
        updatedCart[existingItemIndex].quantity *
        (selectedProduct.final_price || selectedProduct.price);
      setCart(updatedCart);
    } else {
      // Add new item
      const newItem = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        category: selectedProduct.category,
        quantity: parseInt(quantity),
        unit_price: selectedProduct.final_price || selectedProduct.price,
        line_total:
          parseInt(quantity) *
          (selectedProduct.final_price || selectedProduct.price),
      };
      setCart([...cart, newItem]);
    }

    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setNotification({
      open: true,
      message: "Item added to cart!",
      severity: "success",
    });
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map((item) => {
      if (item.product_id === productId) {
        return {
          ...item,
          quantity: newQuantity,
          line_total: newQuantity * item.unit_price,
        };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId));
    setNotification({
      open: true,
      message: "Item removed from cart!",
      severity: "info",
    });
  };

  const clearCart = () => {
    setCart([]);
    setNotification({ open: true, message: "Cart cleared!", severity: "info" });
  };

  const calculateCartTotal = () => {
    const subtotal = cart.reduce((total, item) => total + item.line_total, 0);
    const discountAmount = subtotal * (discountPercent / 100);
    // Since we're using final_price (GST-inclusive), no additional tax calculation needed
    const taxAmount = 0; // Tax is already included in final_price
    const total = subtotal - discountAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  };

  const generateBill = async () => {
    if (cart.length === 0) {
      setNotification({
        open: true,
        message: "Cart is empty!",
        severity: "warning",
      });
      return;
    }

    try {
      const billData = {
        items: cart,
        customer_id: selectedCustomer?.id || null,
        payment_method: "Cash", // Default payment method
        discount_percent: discountPercent,
      };

      const response = await apiClient.post(
        "/api/bills/generate",
        billData,
      );

      if (response.data.bill_id) {
        // Fetch the generated bill details
        const billResponse = await apiClient.get(
          `/api/bills/${response.data.bill_id}`,
        );
        setCurrentBill(billResponse.data);
        setBillDialogOpen(true);

        // Clear cart and reset form
        setCart([]);
        setSelectedCustomer(null);
        setDiscountPercent(0);

        // Refresh sales data
        fetchSales();

        setNotification({
          open: true,
          message: "Bill generated successfully!",
          severity: "success",
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message:
          "Failed to generate bill: " + error.response?.data?.error ||
          error.message,
        severity: "error",
      });
    }
  };

  const handlePrintBill = () => {
    if (currentBill && billRef.current) {
      printBill(billRef, currentBill.bill_number);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  const billColumns = [
    { field: "bill_number", headerName: "Bill No.", width: 130 },
    { field: "customer_name", headerName: "Customer", width: 150 },
    {
      field: "total_amount",
      headerName: "Amount",
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    { field: "payment_method", headerName: "Payment", width: 100 },
    { field: "created_at", headerName: "Date & Time", width: 160 },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Point of Sale
      </Typography>

      {/* Add to Cart Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add Items
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => option.name}
                value={selectedProduct}
                onChange={(e, value) => setSelectedProduct(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Product" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Qty"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.name}
                value={selectedCustomer}
                onChange={(e, value) => setSelectedCustomer(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Customer (Optional)" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                onClick={addToCart}
                variant="contained"
                startIcon={<AddIcon />}
                fullWidth
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Cart Table */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Cart</Typography>
                <Button
                  onClick={clearCart}
                  color="warning"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                >
                  Clear Cart
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No items in cart
                        </TableCell>
                      </TableRow>
                    ) : (
                      cart.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {item.product_name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.category}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1,
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() =>
                                  updateCartQuantity(
                                    item.product_id,
                                    item.quantity - 1,
                                  )
                                }
                              >
                                <RemoveIcon />
                              </IconButton>
                              <Typography>{item.quantity}</Typography>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  updateCartQuantity(
                                    item.product_id,
                                    item.quantity + 1,
                                  )
                                }
                              >
                                <AddIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.line_total)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              onClick={() => removeFromCart(item.product_id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Totals and Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Checkout
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Discount %"
                    type="number"
                    value={discountPercent}
                    onChange={(e) =>
                      setDiscountPercent(parseFloat(e.target.value))
                    }
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {(() => {
                const totals = calculateCartTotal();
                return (
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography>Subtotal</Typography>
                      <Typography>{formatCurrency(totals.subtotal)}</Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography>Discount</Typography>
                      <Typography color="error">
                        -{formatCurrency(totals.discountAmount)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography>GST</Typography>
                      <Typography color="text.secondary">Included</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6">Total</Typography>
                      <Typography variant="h6">
                        {formatCurrency(totals.total)}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<ReceiptIcon />}
                      fullWidth
                      onClick={generateBill}
                      disabled={cart.length === 0}
                    >
                      Generate Bill
                    </Button>
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bill Dialog */}
      <Dialog
        open={billDialogOpen}
        onClose={() => setBillDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Bill</DialogTitle>
        <DialogContent>
          {currentBill && (
            <div ref={billRef}>
              <Bill billData={currentBill} />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBillDialogOpen(false)}>Close</Button>
          <Button
            onClick={handlePrintBill}
            variant="contained"
            startIcon={<PrintIcon />}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Sales;
