import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Card,
  Grid,
  InputAdornment,
  useTheme,
  alpha,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Fab,
} from "@mui/material";
import {
  Edit,
  Delete,
  Add as AddIcon,
  Search as SearchIcon,
  Inventory2 as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  LocalShipping as ShippingIcon,
  Settings as SettingsIcon,
  Store as StoreIcon,
} from "@mui/icons-material";
import apiClient from "./api";
import { SnackbarContext } from "./App";


function InventoryEnhanced() {
  const theme = useTheme();
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    stock: "",
    price: "",
    gst_rate: "18",
    holding_cost: "",
    order_cost: "",
    lead_time: "7",
    min_stock: "",
    reorder_point: "",
    max_stock: "",
    vendor_id: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const showSnackbar = useContext(SnackbarContext);

  // Get unique categories from products
  const categories = [...new Set(products.map((p) => p.category))];

  // Filter products based on search and filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !filterCategory || product.category === filterCategory;
    const matchesStatus =
      !filterStatus ||
      (filterStatus === "low" &&
        product.stock <= (product.reorder_point || 20)) ||
      (filterStatus === "critical" &&
        product.stock <= (product.safety_stock || 5)) ||
      (filterStatus === "normal" &&
        product.stock > (product.reorder_point || 20));
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get stock status helper
  const getStockStatus = (product) => {
    const safetyStock = product.safety_stock || 5;
    const reorderPoint = product.reorder_point || 20;

    if (product.stock <= safetyStock) {
      return { label: "Critical", color: "error", icon: <ErrorIcon /> };
    }
    if (product.stock <= reorderPoint) {
      return { label: "Low", color: "warning", icon: <WarningIcon /> };
    }
    return { label: "Normal", color: "success", icon: <CheckIcon /> };
  };

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/products");
      setProducts(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch products");
      showSnackbar("Failed to fetch products", "error");
      console.error("Error fetching products:", err);
    }
    setLoading(false);
  }, [showSnackbar]);

  // Fetch vendors from API
  const fetchVendors = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/vendors");
      setVendors(res.data.filter((v) => v.status === "active"));
    } catch (err) {
      console.warn("Could not fetch vendors:", err);
      setVendors([]);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchProducts();
    fetchVendors();
  }, [fetchProducts, fetchVendors]);

  // Open dialog for adding/editing product
  const handleOpenDialog = (product = null) => {
    setEditProduct(product);
    if (product) {
      setForm({
        name: product.name || "",
        category: product.category || "",
        stock: product.stock || "",
        price: product.price || "",
        gst_rate: product.gst_rate || "18",
        holding_cost: product.holding_cost || "",
        order_cost: product.order_cost || "",
        lead_time: product.lead_time || "7",
        min_stock: product.min_stock || "",
        reorder_point: product.reorder_point || "",
        max_stock: product.max_stock || "",
        vendor_id: product.vendor_id || "",
      });
    } else {
      setForm({
        name: "",
        category: "",
        stock: "",
        price: "",
        gst_rate: "18",
        holding_cost: "",
        order_cost: "",
        lead_time: "7",
        min_stock: "",
        reorder_point: "",
        max_stock: "",
        vendor_id: "",
      });
    }
    setFieldErrors({});
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError("");
    setFieldErrors({});
    setForm({
      name: "",
      category: "",
      stock: "",
      price: "",
      gst_rate: "18",
      holding_cost: "",
      order_cost: "",
      lead_time: "7",
      min_stock: "",
      reorder_point: "",
      max_stock: "",
      vendor_id: "",
    });
  };

  // Handle form input changes with number validation
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear any existing field error for this field
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: null });
    }

    // For numeric fields, allow empty string or valid numbers
    if (
      [
        "stock",
        "price",
        "holding_cost",
        "order_cost",
        "min_stock",
        "reorder_point",
        "max_stock",
        "lead_time",
      ].includes(name)
    ) {
      // Allow empty string for clearing field
      if (value === "") {
        setForm({ ...form, [name]: value });
        return;
      }

      // For price and cost fields, allow decimals
      if (["price", "holding_cost", "order_cost"].includes(name)) {
        // Allow valid decimal number format
        if (/^\d*\.?\d*$/.test(value)) {
          setForm({ ...form, [name]: value });
        }
        return;
      }

      // For integer fields, only allow whole numbers
      if (/^\d*$/.test(value)) {
        setForm({ ...form, [name]: value });
      }
      return;
    }

    // For non-numeric fields, allow any value
    setForm({ ...form, [name]: value });
  };

  // Save product (create or update)
  // Submit form
  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    const errors = {};

    try {
      // Basic validation
      if (!form.name.trim()) {
        errors.name = "Product name is required";
      }
      if (!form.category.trim()) {
        errors.category = "Category is required";
      }
      if (!form.stock) {
        errors.stock = "Stock quantity is required";
      }
      if (!form.price) {
        errors.price = "Base selling price is required";
      }
      if (!form.gst_rate) {
        errors.gst_rate = "GST rate is required";
      }

      // Validate numeric fields
      const stock = parseInt(form.stock);
      const price = parseFloat(form.price);
      const gstRate = parseFloat(form.gst_rate);

      if (form.stock && (isNaN(stock) || stock < 0)) {
        errors.stock = "Please enter a valid stock quantity";
      }

      if (form.price && (isNaN(price) || price <= 0)) {
        errors.price = "Please enter a valid price greater than 0";
      }

      if (form.gst_rate && (isNaN(gstRate) || gstRate < 0 || gstRate > 100)) {
        errors.gst_rate = "Please enter a valid GST rate between 0 and 100";
      }

      // Convert numeric fields to proper types
      const formData = {
        ...form,
        stock: stock,
        price: price,
        gst_rate: gstRate,
        holding_cost: form.holding_cost
          ? parseFloat(form.holding_cost)
          : undefined,
        order_cost: form.order_cost ? parseFloat(form.order_cost) : undefined,
        lead_time: parseInt(form.lead_time) || 7,
        min_stock: form.min_stock ? parseInt(form.min_stock) : undefined,
        reorder_point: form.reorder_point
          ? parseInt(form.reorder_point)
          : undefined,
        max_stock: form.max_stock ? parseInt(form.max_stock) : undefined,
        vendor_id: form.vendor_id || undefined,
      };

      // Validate optional numeric fields if provided
      if (form.holding_cost && isNaN(parseFloat(form.holding_cost))) {
        errors.holding_cost = "Please enter a valid holding cost";
      }

      if (form.order_cost && isNaN(parseFloat(form.order_cost))) {
        errors.order_cost = "Please enter a valid order cost";
      }

      if (
        form.min_stock &&
        (isNaN(parseInt(form.min_stock)) || parseInt(form.min_stock) < 0)
      ) {
        errors.min_stock = "Please enter a valid minimum stock (0 or greater)";
      }

      if (
        form.reorder_point &&
        (isNaN(parseInt(form.reorder_point)) ||
          parseInt(form.reorder_point) < 0)
      ) {
        errors.reorder_point =
          "Please enter a valid reorder point (0 or greater)";
      }

      if (
        form.max_stock &&
        (isNaN(parseInt(form.max_stock)) || parseInt(form.max_stock) < 0)
      ) {
        errors.max_stock = "Please enter a valid maximum stock (0 or greater)";
      }

      // If there are validation errors, show them and stop submission
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        showSnackbar("Please fix the validation errors", "error");
        setSubmitting(false);
        return;
      }

      if (editProduct) {
        await apiClient.put(`/products/${editProduct.id}`, formData);
        showSnackbar("Product updated successfully", "success");
      } else {
        await apiClient.post("/products", formData);
        showSnackbar("Product added successfully", "success");
      }

      fetchProducts();
      handleCloseDialog();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to save product";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
      console.error("Error saving product:", err);
    }
    setSubmitting(false);
  };

  // Delete product
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await apiClient.delete(`/products/${id}`);
        fetchProducts();
        showSnackbar("Product deleted successfully", "info");
      } catch (err) {
        const errorMessage = "Failed to delete product";
        setError(errorMessage);
        showSnackbar(errorMessage, "error");
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Enhanced Header with Statistics */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
          borderRadius: 3,
          p: 3,
          mb: 4,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                display: "flex",
                alignItems: "center",
                mb: 1,
              }}
            >
              <InventoryIcon sx={{ mr: 2, fontSize: 40 }} />
              Enhanced Inventory Management
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
              Professional inventory control with advanced product management
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip
                icon={<StoreIcon />}
                label={`${products.length} Products`}
                color="primary"
                variant="filled"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<ErrorIcon />}
                label={`${products.filter((p) => p.stock <= (p.safety_stock || 5)).length} Critical Stock`}
                color="error"
                variant="outlined"
              />
              <Chip
                icon={<WarningIcon />}
                label={`${products.filter((p) => p.stock <= (p.reorder_point || 20) && p.stock > (p.safety_stock || 5)).length} Low Stock`}
                color="warning"
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Enhanced Add Product Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Add New Product
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Enhanced Filters Section */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}
        >
          🔍 Search & Filter Products
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Stock Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="low">Low Stock</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("");
                setFilterStatus("");
              }}
              sx={{ height: "56px", borderRadius: 2 }}
            >
              Clear All
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Table */}
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={400}
        >
          <CircularProgress size={60} />
        </Box>
      ) : filteredProducts.length === 0 ? (
        <Card
          sx={{
            p: 8,
            textAlign: "center",
            border: `2px dashed ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          <InventoryIcon
            sx={{ fontSize: 100, color: theme.palette.text.secondary, mb: 2 }}
          />
          <Typography variant="h5" gutterBottom color="textSecondary">
            {searchTerm || filterCategory || filterStatus
              ? "No Products Match Your Filters"
              : "No Products Yet"}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
          >
            {searchTerm || filterCategory || filterStatus
              ? "Try adjusting your search terms or filters to find products."
              : "Start building your inventory by adding your first product with our enhanced creation tool."}
          </Typography>
          {!searchTerm && !filterCategory && !filterStatus && (
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                textTransform: "none",
              }}
            >
              Add Your First Product
            </Button>
          )}
        </Card>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            boxShadow: theme.shadows[3],
            border: `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
          }}
        >
          <Table>
            <TableHead
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.04)})`,
              }}
            >
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Product Details
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Inventory Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Stock Level
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Pricing Details
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, fontSize: "0.95rem" }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product);
                return (
                  <TableRow
                    key={product.id}
                    hover
                    sx={{
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {product.id}
                          {product.vendor_name &&
                            ` • Vendor: ${product.vendor_name}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.category}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main,
                          fontWeight: 500,
                          borderRadius: 2,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={status.icon}
                        label={status.label}
                        color={status.color}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500, borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {product.stock} units
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Min: {product.min_stock || "Auto"} • Reorder:{" "}
                          {product.reorder_point || "Auto"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ minWidth: 120 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Base: ₹{product.price?.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          GST ({product.gst_rate || 18}%): ₹
                          {(
                            ((product.price || 0) * (product.gst_rate || 18)) /
                            100
                          ).toLocaleString()}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.primary.main,
                          }}
                        >
                          Final: ₹
                          {(
                            product.final_price || (product.price || 0) * 1.18
                          ).toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Tooltip title="Edit product">
                          <IconButton
                            onClick={() => handleOpenDialog(product)}
                            size="small"
                            sx={{
                              color: theme.palette.primary.main,
                              "&:hover": {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                transform: "scale(1.1)",
                              },
                              transition: "all 0.2s",
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete product">
                          <IconButton
                            onClick={() =>
                              handleDelete(product.id, product.name)
                            }
                            size="small"
                            sx={{
                              color: theme.palette.error.main,
                              "&:hover": {
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                transform: "scale(1.1)",
                              },
                              transition: "all 0.2s",
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Enhanced Add/Edit Product Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadows[20],
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: "white",
            fontWeight: 700,
            fontSize: "1.4rem",
            py: 3,
            display: "flex",
            alignItems: "center",
          }}
        >
          {editProduct ? (
            <>
              <Edit sx={{ mr: 2 }} />
              Edit Product: {editProduct.name}
            </>
          ) : (
            <>
              <AddIcon sx={{ mr: 2 }} />
              Add New Product
            </>
          )}
        </DialogTitle>

        <DialogContent sx={{ pt: 4, pb: 2, px: 4 }}>
          <Grid container spacing={3}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                }}
              >
                <InventoryIcon sx={{ mr: 1 }} />
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Product Name *"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                required
                autoFocus
                placeholder="e.g., MacBook Pro 13-inch, Wireless Mouse"
                helperText={
                  fieldErrors.name || "Enter a unique, descriptive product name"
                }
                error={!!fieldErrors.name}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!fieldErrors.category}>
                <InputLabel>Product Category *</InputLabel>
                <Select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  label="Product Category *"
                >
                  {categories.length > 0 &&
                    categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  <MenuItem value="Electronics">Electronics</MenuItem>
                  <MenuItem value="Clothing">Clothing</MenuItem>
                  <MenuItem value="Footwear">Footwear</MenuItem>
                  <MenuItem value="Appliances">Appliances</MenuItem>
                  <MenuItem value="Accessories">Accessories</MenuItem>
                  <MenuItem value="Books">Books</MenuItem>
                  <MenuItem value="Food & Beverages">Food & Beverages</MenuItem>
                  <MenuItem value="Health & Beauty">Health & Beauty</MenuItem>
                  <MenuItem value="Sports & Fitness">Sports & Fitness</MenuItem>
                  <MenuItem value="Home & Garden">Home & Garden</MenuItem>
                  <MenuItem value="Automotive">Automotive</MenuItem>
                  <MenuItem value="Office Supplies">Office Supplies</MenuItem>
                </Select>
                {fieldErrors.category && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ ml: 2, mt: 0.5 }}
                  >
                    {fieldErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Vendor</InputLabel>
                <Select
                  name="vendor_id"
                  value={form.vendor_id}
                  onChange={handleChange}
                  label="Vendor"
                >
                  <MenuItem value="">
                    <em>No Vendor</em>
                  </MenuItem>
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <BusinessIcon sx={{ mr: 1, fontSize: 16 }} />
                        {vendor.name}
                        {vendor.rating && (
                          <Chip
                            label={`${vendor.rating}★`}
                            size="small"
                            sx={{ ml: "auto", height: 20 }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Initial Stock Quantity *"
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ min: 0 }}
                placeholder="100"
                helperText={fieldErrors.stock || "Current inventory on hand"}
                error={!!fieldErrors.stock}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Base Price (₹) *"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
                placeholder="999.99"
                helperText={fieldErrors.price || "Base price before GST"}
                error={!!fieldErrors.price}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* GST Rate Field */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="GST Rate (%) *"
                name="gst_rate"
                type="number"
                value={form.gst_rate}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                placeholder="18.00"
                helperText={
                  fieldErrors.gst_rate || "Goods and Services Tax rate"
                }
                error={!!fieldErrors.gst_rate}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Advanced Settings Accordion */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Accordion
                elevation={0}
                sx={{
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 3,
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.03),
                    borderRadius: "12px 12px 0 0",
                    minHeight: 64,
                    "&.Mui-expanded": { minHeight: 64 },
                  }}
                >
                  <Typography
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      color: theme.palette.primary.main,
                    }}
                  >
                    <SettingsIcon sx={{ mr: 2 }} />
                    Advanced Inventory Settings
                    <Chip
                      label="Optional"
                      size="small"
                      sx={{ ml: 2, height: 24 }}
                      color="primary"
                      variant="outlined"
                    />
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {/* Stock Management Section */}
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          color: theme.palette.text.primary,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        📊 Stock Level Management
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Minimum Stock"
                        name="min_stock"
                        type="number"
                        value={form.min_stock}
                        onChange={handleChange}
                        fullWidth
                        inputProps={{ min: 0 }}
                        placeholder="10"
                        helperText={
                          fieldErrors.min_stock || "Safety stock level"
                        }
                        error={!!fieldErrors.min_stock}
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Reorder Point"
                        name="reorder_point"
                        type="number"
                        value={form.reorder_point}
                        onChange={handleChange}
                        fullWidth
                        inputProps={{ min: 0 }}
                        placeholder="25"
                        helperText={
                          fieldErrors.reorder_point || "When to reorder"
                        }
                        error={!!fieldErrors.reorder_point}
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Maximum Stock"
                        name="max_stock"
                        type="number"
                        value={form.max_stock}
                        onChange={handleChange}
                        fullWidth
                        inputProps={{ min: 0 }}
                        placeholder="500"
                        helperText={fieldErrors.max_stock || "Storage capacity"}
                        error={!!fieldErrors.max_stock}
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          color: theme.palette.text.primary,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        💰 Cost Management
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Holding Cost (₹/unit/year)"
                        name="holding_cost"
                        type="number"
                        value={form.holding_cost}
                        onChange={handleChange}
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                        placeholder="10.50"
                        helperText={
                          fieldErrors.holding_cost ||
                          "Annual storage cost per unit"
                        }
                        error={!!fieldErrors.holding_cost}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₹</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Order Cost (₹/order)"
                        name="order_cost"
                        type="number"
                        value={form.order_cost}
                        onChange={handleChange}
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                        placeholder="100.00"
                        helperText={
                          fieldErrors.order_cost || "Cost per purchase order"
                        }
                        error={!!fieldErrors.order_cost}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₹</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          color: theme.palette.text.primary,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        🚚 Logistics & Delivery
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Lead Time (days)"
                        name="lead_time"
                        type="number"
                        value={form.lead_time}
                        onChange={handleChange}
                        fullWidth
                        inputProps={{ min: 1, max: 365 }}
                        placeholder="7"
                        helperText="Delivery time from vendor"
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">days</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          height: "100%",
                          bgcolor: alpha(theme.palette.info.main, 0.05),
                          borderRadius: 2,
                          p: 2,
                        }}
                      >
                        <ShippingIcon
                          sx={{ mr: 1, color: theme.palette.info.main }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          Lead time helps calculate optimal reorder points and
                          safety stock levels
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Helpful Information */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
                <Typography variant="body2">
                  💡 <strong>Smart Defaults:</strong> Leave advanced fields
                  empty to use intelligent defaults. The system automatically
                  calculates optimal inventory parameters based on your product
                  price and initial stock.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            p: 4,
            pt: 2,
            bgcolor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            size="large"
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={20} />
              ) : editProduct ? (
                <Edit />
              ) : (
                <AddIcon />
              )
            }
            sx={{
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              px: 4,
              textTransform: "none",
              fontWeight: 600,
              "&:disabled": {
                background: theme.palette.action.disabled,
              },
            }}
          >
            {submitting
              ? "Saving..."
              : editProduct
                ? "Update Product"
                : "Add Product"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          "&:hover": {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            transform: "scale(1.1)",
          },
          transition: "all 0.3s ease",
          display: { xs: "flex", sm: "none" },
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

export default InventoryEnhanced;
