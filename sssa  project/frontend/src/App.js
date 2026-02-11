import React from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Container,
  Box,
  CssBaseline,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Breadcrumbs,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SettingsIcon from "@mui/icons-material/Settings";
import HistoryIcon from "@mui/icons-material/History";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Dashboard from "./Dashboard";
import Sales from "./Sales";
import Inventory from "./Inventory";
import Customers from "./Customers";
import Reports from "./Reports";
import Vendors from "./Vendors";
import Settings from "./Settings";
import AuditLog from "./AuditLog";

// Create and export SnackbarContext
export const SnackbarContext = React.createContext(null);

const drawerWidth = 280;

const App = ({ user, onLogout }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "info",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
    navigate("/login");
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const navItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Sales", icon: <ShoppingCartIcon />, path: "/sales" },
    { text: "Inventory", icon: <InventoryIcon />, path: "/inventory" },
    { text: "Customers", icon: <PeopleIcon />, path: "/customers" },
    { text: "Reports", icon: <AssessmentIcon />, path: "/reports" },
    { text: "Vendors", icon: <LocalShippingIcon />, path: "/vendors" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
    { text: "Audit Log", icon: <HistoryIcon />, path: "/audit-log" },
  ];

  const getBreadcrumbPath = () => {
    const path =
      location.pathname === "/"
        ? ["Dashboard"]
        : ["Dashboard", ...location.pathname.split("/").filter((x) => x)];
    return path.map((item) => item.charAt(0).toUpperCase() + item.slice(1));
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3, display: "flex", alignItems: "center" }}>
        <Typography
          variant="h5"
          component="div"
          sx={{ fontWeight: 700, color: theme.palette.primary.main }}
        >
          SSSA System
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1, pt: 2 }}>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={() => isMobile && handleDrawerToggle()}
            sx={{
              py: 1.5,
              px: 2,
              "&.Mui-selected": {
                backgroundColor: theme.palette.primary.light + "20",
                "&:hover": {
                  backgroundColor: theme.palette.primary.light + "30",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  location.pathname === item.path
                    ? theme.palette.primary.main
                    : "inherit",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                "& .MuiTypography-root": {
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  color:
                    location.pathname === item.path
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                },
              }}
            />
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Logged in as
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2">{user?.username}</Typography>
            <Typography variant="caption" color="textSecondary">
              {user?.role || "User"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      <Box sx={{ display: "flex", height: "100vh" }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="breadcrumb"
                sx={{ color: theme.palette.text.secondary }}
              >
                {getBreadcrumbPath().map((item, index) => (
                  <Typography
                    key={index}
                    color={
                      index === getBreadcrumbPath().length - 1
                        ? "textPrimary"
                        : "inherit"
                    }
                    variant="subtitle2"
                  >
                    {item}
                  </Typography>
                ))}
              </Breadcrumbs>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Notifications">
                <IconButton
                  color="inherit"
                  onClick={handleNotificationOpen}
                  size="large"
                >
                  <Badge badgeContent={3} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={notificationAnchorEl}
                open={Boolean(notificationAnchorEl)}
                onClose={handleNotificationClose}
                onClick={handleNotificationClose}
                PaperProps={{
                  sx: { width: 320, maxHeight: 400 },
                }}
              >
                <MenuItem>
                  <Typography variant="subtitle2">
                    New order received
                  </Typography>
                </MenuItem>
                <MenuItem>
                  <Typography variant="subtitle2">Low stock alert</Typography>
                </MenuItem>
                <MenuItem>
                  <Typography variant="subtitle2">
                    System update available
                  </Typography>
                </MenuItem>
              </Menu>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleMenuOpen}
                  size="large"
                  edge="end"
                  color="inherit"
                >
                  <AccountCircleIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="textSecondary">
                    Signed in as {user?.username}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => navigate("/settings")}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToAppIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          {drawer}
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Toolbar />
          <Container maxWidth="xl" sx={{ height: "calc(100% - 64px)" }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/audit-log" element={<AuditLog />} />
            </Routes>
          </Container>
        </Box>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={hideSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert
            onClose={hideSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </SnackbarContext.Provider>
  );
};

export default App;
