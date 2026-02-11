import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

const DiagnosticPanel = () => {
  const [status, setStatus] = useState({
    frontend: "checking",
    backend: "checking",
    database: "checking",
    token: "checking",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const newStatus = {
        frontend: "ok",
        backend: "error",
        database: "unknown",
        token: localStorage.getItem("token") ? "ok" : "missing",
      };

      try {
        const response = await fetch(`${API_URL}/api/health`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          newStatus.backend = "ok";
          newStatus.database = data.database === "connected" ? "ok" : "error";
        } else {
          newStatus.backend = "error";
        }
      } catch (error) {
        console.error("Diagnostic error:", error);
        newStatus.backend = "error";
      }

      setStatus(newStatus);
      setLoading(false);
    };

    runDiagnostics();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "ok":
        return <CheckCircleIcon sx={{ color: "success.main", mr: 1 }} />;
      case "error":
        return <ErrorIcon sx={{ color: "error.main", mr: 1 }} />;
      case "missing":
        return <WarningIcon sx={{ color: "warning.main", mr: 1 }} />;
      default:
        return <CircularProgress size={20} sx={{ mr: 1 }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ok":
        return "success";
      case "error":
        return "error";
      case "missing":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        System Diagnostics
      </Typography>

      {!loading && status.backend === "error" && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Backend is not responding. Make sure to run: <code>python app.py</code>
        </Alert>
      )}

      {!loading && status.token === "missing" && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No authentication token found. Please login first.
        </Alert>
      )}

      <Box sx={{ display: "grid", gap: 2 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {getStatusIcon(status.frontend)}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Frontend</Typography>
                <Typography variant="body2" color="textSecondary">
                  React app running
                </Typography>
              </Box>
              <Typography variant="body2" color={getStatusColor(status.frontend)}>
                {status.frontend.toUpperCase()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {getStatusIcon(status.backend)}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Backend</Typography>
                <Typography variant="body2" color="textSecondary">
                  {API_URL}
                </Typography>
              </Box>
              <Typography variant="body2" color={getStatusColor(status.backend)}>
                {status.backend.toUpperCase()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {getStatusIcon(status.database)}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Database</Typography>
                <Typography variant="body2" color="textSecondary">
                  SQLite connection
                </Typography>
              </Box>
              <Typography variant="body2" color={getStatusColor(status.database)}>
                {status.database.toUpperCase()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {getStatusIcon(status.token)}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Authentication</Typography>
                <Typography variant="body2" color="textSecondary">
                  User token status
                </Typography>
              </Box>
              <Typography variant="body2" color={getStatusColor(status.token)}>
                {status.token.toUpperCase()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Troubleshooting Steps
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <li>
            <Typography variant="body2">
              Verify backend is running: <code>python app.py</code>
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Check backend status:
              <code>{` curl ${API_URL}/api/health`}</code>
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Check if port 5000 is available:
              <code> netstat -ano | findstr :5000</code>
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Clear browser cache and local storage, then refresh page
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Check browser console (F12) for detailed error messages
            </Typography>
          </li>
        </Box>
      </Box>

      <Button
        onClick={() => window.location.reload()}
        variant="contained"
        sx={{ mt: 3 }}
      >
        Retry Diagnostics
      </Button>
    </Box>
  );
};

export default DiagnosticPanel;
