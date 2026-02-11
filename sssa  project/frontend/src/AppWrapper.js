import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import apiClient from "./api";
import App from "./App";
import Login from "./Login";
import theme from "./theme";
import { Box, Alert, Button, CircularProgress } from "@mui/material";


// Protected Route component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // Verify token
    const verifyToken = async () => {
      try {
        await apiClient.get(`/api/auth/verify`);
        setIsAuthenticated(true);
        setBackendError(null);
      } catch (error) {
        console.error("Token verification failed:", error);
        
        // Check if it's a network error
        if (!error.response) {
          const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
          setBackendError(`Cannot connect to server at ${API_URL}`);
        }
        
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      }
    };

    verifyToken();
  }, []);

  if (isAuthenticated === null) {
    // Show loading state
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  if (backendError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{backendError}</Alert>
        <Button 
          onClick={() => window.location.reload()} 
          sx={{ mt: 2 }}
          variant="contained"
        >
          Retry
        </Button>
      </Box>
    );
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

const AppWrapper = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem("token");
    if (token) {
      // Verify token and get user data
      apiClient
        .get(`/api/auth/verify`)
        .then((response) => {
          setUser(response.data.user);
        })
        .catch((error) => {
          console.error("Verification error:", error);
          localStorage.removeItem("token");
        });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("token");
    setUser(null);

    // Clear any browser saved credentials/forms
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "/login");
    }

    // Force browser to not cache credentials
    document.querySelectorAll('input[type="password"]').forEach((input) => {
      input.value = "";
      input.setAttribute("autocomplete", "off");
    });
    document.querySelectorAll('input[type="text"]').forEach((input) => {
      if (input.name === "username" || input.name === "email") {
        input.value = "";
        input.setAttribute("autocomplete", "off");
      }
    });

    // Clear all localStorage to ensure no saved credentials remain
    try {
      localStorage.clear();
    } catch (e) {
      // Fallback if clear() fails
      Object.keys(localStorage).forEach((key) => {
        localStorage.removeItem(key);
      });
    }

    // Clear sessionStorage as well
    try {
      sessionStorage.clear();
    } catch (e) {
      // Fallback if clear() fails
      Object.keys(sessionStorage).forEach((key) => {
        sessionStorage.removeItem(key);
      });
    }

    // Force page reload to completely clear state
    window.location.href = "/login";
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <App user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default AppWrapper;
