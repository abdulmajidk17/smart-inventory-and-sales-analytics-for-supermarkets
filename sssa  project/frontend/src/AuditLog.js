import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Info as InfoIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import apiClient from "./api";

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    entity_type: "",
    action: "",
    start_date: null,
    end_date: null,
  });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const entityTypes = [
    "product",
    "customer",
    "sale",
    "vendor",
    "purchase_order",
    "setting",
  ];
  const actions = ["create", "update", "delete"];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.entity_type)
        params.append("entity_type", filters.entity_type);
      if (filters.action) params.append("action", filters.action);
      if (filters.start_date)
        params.append(
          "start_date",
          filters.start_date.toISOString().split("T")[0],
        );
      if (filters.end_date)
        params.append("end_date", filters.end_date.toISOString().split("T")[0]);

      const response = await apiClient.get(
        `/api/audit-logs?${params}`,
      );
      setLogs(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch audit logs");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterApply = () => {
    fetchLogs();
    setFilterDialogOpen(false);
  };

  const handleFilterClear = () => {
    setFilters({
      entity_type: "",
      action: "",
      start_date: null,
      end_date: null,
    });
    setFilterDialogOpen(false);
    fetchLogs();
  };

  const getActionColor = (action) => {
    switch (action) {
      case "create":
        return "success";
      case "update":
        return "info";
      case "delete":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Audit Log</Typography>
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setFilterDialogOpen(true)}
        >
          Filter
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.action}
                    color={getActionColor(log.action)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography sx={{ textTransform: "capitalize" }}>
                    {log.entity_type}
                  </Typography>
                </TableCell>
                <TableCell>{log.description}</TableCell>
                <TableCell align="right">
                  {log.details && (
                    <IconButton
                      onClick={() => {
                        setSelectedLog(log);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <InfoIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
      >
        <DialogTitle>Filter Audit Logs</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={filters.entity_type}
                  label="Entity Type"
                  onChange={(e) =>
                    setFilters({ ...filters, entity_type: e.target.value })
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {entityTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={filters.action}
                  label="Action"
                  onChange={(e) =>
                    setFilters({ ...filters, action: e.target.value })
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {actions.map((action) => (
                    <MenuItem key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <DatePicker
                      label="Start Date"
                      value={filters.start_date}
                      onChange={(newValue) =>
                        setFilters({ ...filters, start_date: newValue })
                      }
                      renderInput={(params) => (
                        <TextField {...params} fullWidth />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DatePicker
                      label="End Date"
                      value={filters.end_date}
                      onChange={(newValue) =>
                        setFilters({ ...filters, end_date: newValue })
                      }
                      renderInput={(params) => (
                        <TextField {...params} fullWidth />
                      )}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterClear}>Clear</Button>
          <Button onClick={handleFilterApply} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
      >
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Changes:
              </Typography>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AuditLog;
