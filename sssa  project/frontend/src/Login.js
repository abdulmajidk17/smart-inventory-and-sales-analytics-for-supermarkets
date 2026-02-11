import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Paper,
  Container,
  InputAdornment,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Link,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  Business,
  TrendingUp,
  Inventory,
  Assessment,
} from "@mui/icons-material";
import apiClient from "./api";


function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const from = location.state?.from?.pathname || "/";

  // Clear form on component mount to ensure no saved credentials
  useEffect(() => {
    // Clear form fields
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setError("");
    setLoading(false);

    // Clear any browser stored credentials
    try {
      // Clear localStorage entries that might contain authentication data
      const keysToRemove = ["token", "user", "auth", "session"];
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Force clear any form autocomplete data
      setTimeout(() => {
        const inputs = document.querySelectorAll(
          'input[type="text"], input[type="password"], input[name="username"]',
        );
        inputs.forEach((input) => {
          input.value = "";
          input.setAttribute("autocomplete", "off");
          input.setAttribute("autocorrect", "off");
          input.setAttribute("autocapitalize", "off");
          input.setAttribute("spellcheck", "false");
        });
      }, 100);
    } catch (e) {
      console.warn("Could not clear stored credentials:", e);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiClient.post(`/api/auth/login`, {
        username,
        password,
      });

      if (res.data.token) {
        // Store the token
        localStorage.setItem("token", res.data.token);

        // Clear form after successful login
        setUsername("");
        setPassword("");
        setShowPassword(false);
        setError("");

        onLogin(res.data.user);
        navigate(from, { replace: true });
      }
    } catch (err) {
      let errorMessage = "Failed to connect to the server. Please try again.";
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 401) {
        errorMessage = "Invalid username or password";
      } else if (!err.response) {
        errorMessage = "Cannot connect to server. Make sure the backend is running.";
      }
      
      setError(errorMessage);
      // Clear password on error for security
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
            alignItems: "center",
            minHeight: "80vh",
          }}
        >
          {/* Left Side - Branding */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              p: 4,
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mb: 3,
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <Business sx={{ fontSize: 60, color: "white" }} />
            </Box>

            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700, color: theme.palette.primary.main }}
            >
              SSSA System
            </Typography>

            <Typography
              variant="h6"
              color="textSecondary"
              sx={{ mb: 4, maxWidth: 400 }}
            >
              Smart Inventory & Sales Analytics for Supermarkets
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: "100%",
                maxWidth: 300,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                  }}
                >
                  <TrendingUp color="success" />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Advanced Sales Forecasting
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                  }}
                >
                  <Inventory color="info" />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Smart Inventory Management
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  }}
                >
                  <Assessment color="warning" />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  AI-Powered Analytics
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right Side - Login Form */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Card
              elevation={8}
              sx={{
                width: "100%",
                maxWidth: 450,
                borderRadius: 3,
                background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.background.paper, 0.8)})`,
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    mb: 4,
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      mb: 2,
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    <LockOutlined sx={{ color: "white", fontSize: 28 }} />
                  </Box>

                  <Typography
                    component="h1"
                    variant="h4"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Welcome Back
                  </Typography>

                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ textAlign: "center" }}
                  >
                    Sign in to access your dashboard
                  </Typography>
                </Box>

                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      "& .MuiAlert-message": {
                        width: "100%",
                      },
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <form
                  onSubmit={handleSubmit}
                  autoComplete="off"
                  noValidate
                  data-save="never"
                >
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Username"
                    name="username"
                    autoComplete="new-username"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.default,
                        "& input": {
                          color: theme.palette.text.primary,
                          fontSize: "1rem",
                          letterSpacing: showPassword ? "normal" : "0.125em",
                          fontFamily: showPassword
                            ? theme.typography.fontFamily
                            : "monospace",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: theme.palette.primary.main,
                        },
                        "&.Mui-focused": {
                          backgroundColor: theme.palette.background.paper,
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: theme.palette.text.secondary,
                        "&.Mui-focused": {
                          color: theme.palette.primary.main,
                        },
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                            disabled={loading}
                            sx={{
                              color: theme.palette.text.secondary,
                              "&:hover": {
                                color: theme.palette.primary.main,
                                backgroundColor: alpha(
                                  theme.palette.primary.main,
                                  0.04,
                                ),
                              },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      mb: 3,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                      "&:hover": {
                        boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                        transform: "translateY(-1px)",
                      },
                      "&:disabled": {
                        background: theme.palette.action.disabledBackground,
                        boxShadow: "none",
                        transform: "none",
                      },
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Login;
