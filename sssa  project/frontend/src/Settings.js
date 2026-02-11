import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import apiClient from './api';

function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentSetting, setCurrentSetting] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/api/settings');
      // Group settings by category
      const groupedSettings = response.data.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      }, {});
      setSettings(groupedSettings);
      setError('');
    } catch (err) {
      setError('Failed to fetch settings');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleEdit = (setting) => {
    setCurrentSetting(setting);
    setEditValue(setting.value);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await apiClient.put(`/api/settings/${currentSetting.key}`, {
        value: editValue
      });
      setSuccessMessage('Setting updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchSettings();
      setEditDialogOpen(false);
    } catch (err) {
      setError('Failed to update setting');
    }
  };

  const renderSettingValue = (setting) => {
    switch (setting.data_type) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={setting.value === 'true'}
                onChange={(e) => {
                  handleEdit({ ...setting, value: e.target.checked.toString() });
                }}
              />
            }
            label={setting.value === 'true' ? 'Enabled' : 'Disabled'}
          />
        );
      case 'json':
        try {
          const jsonValue = JSON.parse(setting.value);
          return (
            <Box sx={{ mt: 1 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(jsonValue, null, 2)}
              </pre>
            </Box>
          );
        } catch {
          return setting.value;
        }
      default:
        return (
          <Typography variant="body1" component="span">
            {setting.value}
          </Typography>
        );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      {Object.entries(settings).map(([category, categorySettings]) => (
        <Accordion key={category} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
              {category} Settings
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {categorySettings.map((setting) => (
                <Grid item xs={12} key={setting.key}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle1" gutterBottom>
                            {setting.key.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                            <Tooltip title={setting.description}>
                              <IconButton size="small" sx={{ ml: 1 }}>
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Typography>
                          {renderSettingValue(setting)}
                        </Box>
                        {setting.data_type !== 'boolean' && (
                          <IconButton onClick={() => handleEdit(setting)}>
                            <EditIcon />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>
          Edit {currentSetting?.key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </DialogTitle>
        <DialogContent>
          {currentSetting?.data_type === 'json' ? (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              sx={{ mt: 2 }}
              error={(() => {
                try {
                  JSON.parse(editValue);
                  return false;
                } catch {
                  return true;
                }
              })()}
              helperText={(() => {
                try {
                  JSON.parse(editValue);
                  return '';
                } catch (e) {
                  return 'Invalid JSON format';
                }
              })()}
            />
          ) : (
            <TextField
              fullWidth
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              sx={{ mt: 2 }}
              type={currentSetting?.data_type === 'number' ? 'number' : 'text'}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              currentSetting?.data_type === 'json' &&
              (() => {
                try {
                  JSON.parse(editValue);
                  return false;
                } catch {
                  return true;
                }
              })()
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Settings; 