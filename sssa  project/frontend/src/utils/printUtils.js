export const printBill = (billRef, billNumber) => {
  if (!billRef.current) {
    console.error('Bill ref is not available');
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  
  if (!printWindow) {
    alert('Please allow popups for this site to enable printing');
    return;
  }

  // Get the bill content
  const billContent = billRef.current.innerHTML;
  
  // Create the print document
  const printDocument = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill - ${billNumber}</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.2;
          color: #000;
          background: #fff;
          width: 80mm;
          margin: 0;
          padding: 10px;
        }
        
        @page {
          size: 80mm auto;
          margin: 0;
        }
        
        @media print {
          body {
            width: 80mm;
            margin: 0;
            padding: 5mm;
          }
          
          .MuiPaper-root {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        .store-name {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 4px;
          font-family: Arial, sans-serif;
        }
        
        .store-tagline {
          font-size: 10px;
          color: #666;
          text-align: center;
          margin-bottom: 8px;
          font-style: italic;
        }
        
        .store-details {
          font-size: 10px;
          text-align: center;
          line-height: 1.3;
          color: #333;
          margin-bottom: 12px;
        }
        
        .bill-info {
          margin-bottom: 12px;
          font-size: 11px;
        }
        
        .bill-info div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
        }
        
        th, td {
          padding: 2px;
          font-size: 10px;
          text-align: left;
          border: none;
        }
        
        th {
          font-weight: bold;
          border-bottom: 1px solid #000;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        .total-section {
          margin-top: 8px;
          border-top: 1px dashed #000;
          padding-top: 4px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 1px 0;
          font-size: 11px;
        }
        
        .grand-total {
          font-size: 13px;
          font-weight: bold;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 4px 0;
          margin: 4px 0;
        }
        
        .footer {
          text-align: center;
          margin-top: 12px;
          font-size: 10px;
          color: #666;
          border-top: 1px dashed #000;
          padding-top: 8px;
        }
        
        .thank-you {
          font-size: 12px;
          font-weight: bold;
          color: #000;
          margin: 8px 0;
        }
        
        .return-policy {
          font-size: 9px;
          line-height: 1.3;
          margin-top: 8px;
        }
        
        hr {
          border: none;
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      ${billContent}
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => {
            window.close();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;
  
  // Write the document to the print window
  printWindow.document.write(printDocument);
  printWindow.document.close();
};

export const downloadBillAsPDF = (billRef, billNumber) => {
  if (!billRef.current) {
    console.error('Bill ref is not available');
    return;
  }

  // For PDF generation, install html2canvas and jspdf packages:
  // npm install html2canvas jspdf
  // Then uncomment and use the PDF generation code
  
  // For now, fallback to print (which can save as PDF in browser)
  console.log('PDF generation requires html2canvas and jspdf packages');
  alert('Use your browser\'s Print option and select "Save as PDF" for PDF export');
  printBill(billRef, billNumber);
};

// Utility to format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

// Utility to format date/time
export const formatDateTime = (dateString) => {
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

// Generate bill number
export const generateBillNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BL${dateStr}${timeStr}${random}`;
};
