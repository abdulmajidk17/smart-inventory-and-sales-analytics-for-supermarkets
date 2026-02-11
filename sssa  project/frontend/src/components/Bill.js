import React, { forwardRef } from 'react';
import {
  Box,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  styled
} from '@mui/material';

const BillContainer = styled(Paper)(({ theme }) => ({
  width: '80mm', // Thermal printer width
  maxWidth: '300px',
  margin: '0 auto',
  padding: theme.spacing(2),
  fontFamily: 'monospace',
  fontSize: '12px',
  lineHeight: '1.2',
  backgroundColor: '#fff',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  
  '@media print': {
    boxShadow: 'none',
    margin: 0,
    padding: '10px',
    width: '80mm',
    maxWidth: 'none',
  }
}));

const BillHeader = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(2),
  
  '& .store-name': {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '4px',
    fontFamily: 'Arial, sans-serif',
  },
  
  '& .store-tagline': {
    fontSize: '10px',
    color: '#666',
    marginBottom: '8px',
    fontStyle: 'italic',
  },
  
  '& .store-details': {
    fontSize: '10px',
    lineHeight: '1.3',
    color: '#333',
  }
}));

const BillRow = styled(TableRow)(({ theme }) => ({
  '& .MuiTableCell-root': {
    border: 'none',
    padding: '2px 0',
    fontSize: '11px',
    fontFamily: 'monospace',
  }
}));

const BillTotal = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  
  '& .total-row': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2px 0',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
  
  '& .grand-total': {
    fontSize: '14px',
    fontWeight: 'bold',
    borderTop: '2px solid #000',
    borderBottom: '2px solid #000',
    paddingTop: '4px',
    paddingBottom: '4px',
    marginTop: '4px',
  }
}));

const BillFooter = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginTop: theme.spacing(2),
  fontSize: '10px',
  color: '#666',
  
  '& .thank-you': {
    fontSize: '12px',
    fontWeight: 'bold',
    margin: '8px 0',
    color: '#000',
  },
  
  '& .return-policy': {
    fontSize: '9px',
    lineHeight: '1.3',
    marginTop: '8px',
  }
}));

const Bill = forwardRef(({ billData }, ref) => {
  if (!billData) {
    return (
      <BillContainer ref={ref}>
        <Typography variant="body2" align="center">
          No bill data available
        </Typography>
      </BillContainer>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <BillContainer ref={ref}>
      {/* Header */}
      <BillHeader>
        <div className="store-name">SUPER STORE</div>
        <div className="store-tagline">Your Neighborhood Supermarket</div>
        <div className="store-details">
          123 Main Street, City - 123456<br/>
          Phone: +91 98765 43210<br/>
          GSTIN: 12ABCDE3456F7GH<br/>
          Email: info@superstore.com
        </div>
      </BillHeader>

      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

      {/* Bill Info */}
      <Box sx={{ mb: 2, fontSize: '11px', fontFamily: 'monospace' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <span>Bill No:</span>
          <span style={{ fontWeight: 'bold' }}>{billData.bill_number}</span>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <span>Date/Time:</span>
          <span>{formatTime(billData.created_at)}</span>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <span>Customer:</span>
          <span>{billData.customer.name}</span>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <span>Cashier:</span>
          <span>{billData.cashier_name}</span>
        </Box>
      </Box>

      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

      {/* Items */}
      <Table size="small">
        <TableBody>
          <BillRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Qty</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Rate</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
          </BillRow>
          
          {billData.items && billData.items.map((item, index) => (
            <React.Fragment key={index}>
              <BillRow>
                <TableCell colSpan={4} sx={{ paddingBottom: '1px !important' }}>
                  {item.product_name}
                  {item.category && (
                    <Typography variant="caption" sx={{ display: 'block', color: '#666', fontSize: '9px' }}>
                      [{item.category}]
                    </Typography>
                  )}
                </TableCell>
              </BillRow>
              <BillRow>
                <TableCell></TableCell>
                <TableCell align="center">{item.quantity}</TableCell>
                <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(item.line_total)}
                </TableCell>
              </BillRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

      {/* Totals */}
      <BillTotal>
        <div className="total-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(billData.subtotal)}</span>
        </div>
        
        {billData.discount_amount > 0 && (
          <div className="total-row">
            <span>Discount:</span>
            <span style={{ color: '#d32f2f' }}>-{formatCurrency(billData.discount_amount)}</span>
          </div>
        )}
        
        <div className="total-row">
          <span>Tax (GST 18%):</span>
          <span>{formatCurrency(billData.tax_amount)}</span>
        </div>
        
        <div className="total-row grand-total">
          <span>TOTAL:</span>
          <span>{formatCurrency(billData.total_amount)}</span>
        </div>
        
        <div className="total-row" style={{ marginTop: '8px' }}>
          <span>Payment Method:</span>
          <span style={{ fontWeight: 'bold' }}>{billData.payment_method}</span>
        </div>
        
        <div className="total-row">
          <span>Amount Paid:</span>
          <span>{formatCurrency(billData.total_amount)}</span>
        </div>
        
        <div className="total-row">
          <span>Balance:</span>
          <span>₹0.00</span>
        </div>
      </BillTotal>

      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

      {/* Footer */}
      <BillFooter>
        <div className="thank-you">THANK YOU FOR SHOPPING WITH US!</div>
        
        <div>
          Transaction ID: {billData.transaction_id}
        </div>
        
        <div className="return-policy">
          * Goods once sold cannot be returned<br/>
          * Valid for 30 days from date of purchase<br/>
          * Subject to terms & conditions
        </div>
        
        <div style={{ marginTop: '12px', fontSize: '10px' }}>
          Visit us at www.superstore.com<br/>
          Follow us @SuperStoreOfficial
        </div>
      </BillFooter>
    </BillContainer>
  );
});

Bill.displayName = 'Bill';

export default Bill;
