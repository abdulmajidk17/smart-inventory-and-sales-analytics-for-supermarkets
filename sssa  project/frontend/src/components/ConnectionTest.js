import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import apiClient from '../api';

const ConnectionTest = () => {
  const [status, setStatus] = useState('testing');
  const [error, setError] = useState('');

  const testConnection = async () => {
    setStatus('testing');
    setError('');
    
    try {
      const response = await apiClient.get('/api/health');
      if (response.status === 200) {
        setStatus('connected');
      }
    } catch (err) {
      setStatus('failed');
      setError(err.message || 'Connection failed');
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Backend Connection Test
      </Typography>
      
      {status === 'testing' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>Testing connection...</Typography>
        </Box>
      )}
      
      {status === 'connected' && (
        <Alert severity="success">
          ✅ Backend connection successful!
        </Alert>
      )}
      
      {status === 'failed' && (
        <Alert severity="error">
          ❌ Connection failed: {error}
        </Alert>
      )}
      
      <Button 
        onClick={testConnection} 
        variant="contained" 
        sx={{ mt: 2 }}
        disabled={status === 'testing'}
      >
        Test Again
      </Button>
    </Box>
  );
};

export default ConnectionTest;