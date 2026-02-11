import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
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
  Chip,
  Avatar,
  InputAdornment,
  Divider,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import apiClient from './api';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCustomer, setMenuCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/customers');
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      setNotification({ open: true, message: 'Failed to fetch customers.', severity: 'error' });
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [customers, searchTerm]);

  const handleAddCustomer = async () => {
    if (!customerForm.name.trim()) {
      setNotification({ open: true, message: 'Customer name is required.', severity: 'warning' });
      return;
    }
    
    try {
      await apiClient.post('/customers', customerForm);
      setNotification({ open: true, message: 'Customer added successfully!', severity: 'success' });
      setCustomerForm({ name: '', phone: '', email: '', address: '' });
      setAddDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      setNotification({ open: true, message: error.response?.data?.error || 'Failed to add customer.', severity: 'error' });
    }
  };

  const handleEditCustomer = async () => {
    if (!customerForm.name.trim()) {
      setNotification({ open: true, message: 'Customer name is required.', severity: 'warning' });
      return;
    }
    
    try {
      await apiClient.put(`/customers/${selectedCustomer.id}`, customerForm);
      setNotification({ open: true, message: 'Customer updated successfully!', severity: 'success' });
      setEditDialogOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      setNotification({ open: true, message: error.response?.data?.error || 'Failed to update customer.', severity: 'error' });
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      await apiClient.delete(`/customers/${selectedCustomer.id}`);
      setNotification({ open: true, message: 'Customer deleted successfully!', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      setNotification({ open: true, message: error.response?.data?.error || 'Failed to delete customer.', severity: 'error' });
    }
  };

  const openAddDialog = () => {
    setCustomerForm({ name: '', phone: '', email: '', address: '' });
    setAddDialogOpen(true);
  };

  const openEditDialog = (customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    });
    setEditDialogOpen(true);
    handleCloseMenu();
  };

  const openDeleteDialog = (customer) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleMenuClick = (event, customer) => {
    setAnchorEl(event.currentTarget);
    setMenuCustomer(customer);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuCustomer(null);
  };

  const getCustomerInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCustomerStats = (customerId) => {
    // This would normally come from an API call to get customer purchase history
    // For now, returning mock data
    return {
      totalOrders: Math.floor(Math.random() * 20) + 1,
      totalSpent: Math.floor(Math.random() * 50000) + 1000,
      lastPurchase: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification({ ...notification, open: false });
  };

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>Customer Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={openAddDialog}
          sx={{ minWidth: 150 }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {customers.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {customers.filter(c => getCustomerStats(c.id).totalOrders > 5).length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active Customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {customers.length > 0 ? Math.floor(customers.reduce((sum, c) => sum + getCustomerStats(c.id).totalSpent, 0) / customers.length) : 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Avg Spending ₹
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {new Date().toLocaleDateString('en-US', { month: 'short' })}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Current Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                Showing {filteredCustomers.length} of {customers.length} customers
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact Info</TableCell>
                  <TableCell align="center">Orders</TableCell>
                  <TableCell align="right">Total Spent</TableCell>
                  <TableCell align="center">Last Purchase</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {searchTerm ? 'No customers found matching your search.' : 'No customers added yet.'}
                      </Typography>
                      {!searchTerm && (
                        <Button 
                          variant="contained" 
                          startIcon={<AddIcon />}
                          onClick={openAddDialog}
                          sx={{ mt: 2 }}
                        >
                          Add Your First Customer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    const stats = getCustomerStats(customer.id);
                    return (
                      <TableRow key={customer.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {getCustomerInitials(customer.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {customer.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {customer.id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {customer.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <PhoneIcon fontSize="small" color="action" />
                                <Typography variant="body2">{customer.phone}</Typography>
                              </Box>
                            )}
                            {customer.email && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <EmailIcon fontSize="small" color="action" />
                                <Typography variant="body2">{customer.email}</Typography>
                              </Box>
                            )}
                            {customer.address && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationIcon fontSize="small" color="action" />
                                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                  {customer.address}
                                </Typography>
                              </Box>
                            )}
                            {!customer.phone && !customer.email && !customer.address && (
                              <Typography variant="body2" color="text.secondary">
                                No contact info
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={stats.totalOrders}
                            size="small" 
                            color={stats.totalOrders > 10 ? 'success' : stats.totalOrders > 5 ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight="bold">
                            ₹{stats.totalSpent.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {stats.lastPurchase}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="More actions">
                            <IconButton
                              onClick={(e) => handleMenuClick(e, customer)}
                              size="small"
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => openEditDialog(menuCustomer)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Customer
        </MenuItem>
        <MenuItem onClick={() => openDeleteDialog(menuCustomer)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Customer
        </MenuItem>
      </Menu>

      {/* Add Customer Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            Add New Customer
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Full Name *"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                fullWidth
                variant="outlined"
                type="email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                fullWidth
                variant="outlined"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCustomer} variant="contained">
            Add Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            Edit Customer
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Full Name *"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                fullWidth
                variant="outlined"
                type="email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                fullWidth
                variant="outlined"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditCustomer} variant="contained">
            Update Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon />
            Delete Customer
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteCustomer} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Customers; 