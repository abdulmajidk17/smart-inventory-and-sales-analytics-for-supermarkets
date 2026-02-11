import React, { useState, useEffect } from "react";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { API_BASE_URL } from "../apiConfig";

const NetworkStatusChecker = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [backendReachable, setBackendReachable] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
          method: "GET",
          timeout: 5000,
        });
        setBackendReachable(response.ok);
      } catch (error) {
        console.warn("Backend unreachable:", error);
        setBackendReachable(false);
      }
    };

    // Check on mount
    checkBackend();

    // Check periodically
    const interval = setInterval(checkBackend, 30000);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      setBackendReachable(response.ok);
    } catch (error) {
      setBackendReachable(false);
    } finally {
      setRetrying(false);
    }
  };

  if (!isOnline) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          No internet connection. Please check your network and try again.
        </Alert>
      </Box>
    );
  }

  if (backendReachable === false) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? <CircularProgress size={20} /> : "Retry"}
            </Button>
          }
        >
          Cannot connect to backend server at {API_BASE_URL}. Make sure the
          backend is running. (Error: Connection refused)
        </Alert>
      </Box>
    );
  }

  return children;
};

export default NetworkStatusChecker;
