import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Paper
} from '@mui/material';
import { Email, CheckCircle } from '@mui/icons-material';

function EmailPreviewDialog({ open, onClose, purchaseOrder }) {
  if (!purchaseOrder) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Email /> Email Notification Preview
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">To:</Typography>
            <Typography variant="body1" fontWeight="bold">{purchaseOrder.vendor_email || 'vendor@example.com'}</Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Subject:</Typography>
            <Typography variant="body1" fontWeight="bold">New Purchase Order #{purchaseOrder.id}</Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>Dear {purchaseOrder.vendor_name},</Typography>
          
          <Typography paragraph>
            We are pleased to place the following purchase order with your company:
          </Typography>
          
          <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, my: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>Order Details:</Typography>
            <Typography><strong>Order ID:</strong> #{purchaseOrder.id}</Typography>
            <Typography><strong>Product:</strong> {purchaseOrder.product_name}</Typography>
            <Typography><strong>Quantity:</strong> {purchaseOrder.quantity} units</Typography>
            <Typography><strong>Unit Price:</strong> ₹{purchaseOrder.unit_price?.toFixed(2)}</Typography>
            <Typography><strong>Total Amount:</strong> ₹{(purchaseOrder.quantity * purchaseOrder.unit_price)?.toFixed(2)}</Typography>
            <Typography><strong>Expected Delivery:</strong> {purchaseOrder.expected_delivery}</Typography>
          </Box>
          
          <Typography paragraph>
            Please confirm receipt of this order and provide an estimated delivery date.
          </Typography>
          
          <Typography paragraph>
            For any queries, please contact us at admin@sssa-system.com or call +91-XXXXXXXXXX
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Best regards,<br/>
            SSSA System<br/>
            Inventory Management Team
          </Typography>
        </Paper>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" />
          <Typography variant="body2" color="success.dark">
            This email would be automatically sent to the vendor when the purchase order is created.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onClose}>Understood</Button>
      </DialogActions>
    </Dialog>
  );
}

export default EmailPreviewDialog;
