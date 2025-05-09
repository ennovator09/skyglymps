import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  CircularProgress,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudIcon from '@mui/icons-material/Cloud';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locations, setLocations] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [avatarSeed] = useState(Math.random().toString(36).substring(7));
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/locations');
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    setDeleteLoading(prev => ({ ...prev, [locationId]: true }));
    try {
      const response = await fetch(`http://localhost:5000/api/locations/${locationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLocations(prev => prev.filter(loc => loc.locationId !== locationId));
      } else {
        console.error('Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
    } finally {
      setDeleteLoading(prev => ({ ...prev, [locationId]: false }));
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { text: message, sender: 'user' };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      const aiMessage = { text: data.response, sender: 'ai' };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!latitude || !longitude) return;

    setLocationLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (response.ok) {
        setLatitude('');
        setLongitude('');
        fetchLocations();
      }
    } catch (error) {
      console.error('Error saving location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchWeatherData = async (lat, lon) => {
    setWeatherLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/weather?latitude=${lat}&longitude=${lon}`);
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    fetchWeatherData(location.latitude, location.longitude);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Header */}
        <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <CloudIcon sx={{ fontSize: 40, mr: 1 }} />
              <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                SkyGlymps
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
              Your trusted weather partner
            </Typography>
            <Box sx={{ flexGrow: 1 }} /> {/* Spacer for right side */}
            <Avatar 
              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`}
              sx={{ 
                width: 40,
                height: 40,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                }
              }}
            />
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          {/* Left Sidebar */}
          <Paper 
            elevation={3} 
            sx={{ 
              width: 300, 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              borderRight: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <LocationOnIcon sx={{ mr: 1 }} />
              Location Input
            </Typography>
            
            <TextField
              label="Latitude"
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              sx={{ mb: 2 }}
              fullWidth
            />
            
            <TextField
              label="Longitude"
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              sx={{ mb: 2 }}
              fullWidth
            />
            
            <Button
              variant="contained"
              onClick={handleSaveLocation}
              disabled={locationLoading || !latitude || !longitude}
              sx={{ mb: 2 }}
            >
              Save Location
            </Button>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Saved Locations
            </Typography>
            
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {locations.map((location) => (
                <ListItem 
                  key={location.locationId}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    },
                    cursor: 'pointer',
                    backgroundColor: selectedLocation?.locationId === location.locationId ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                  }}
                  onClick={() => handleLocationSelect(location)}
                >
                  <ListItemText
                    primary={`Lat: ${location.latitude}, Long: ${location.longitude}`}
                    secondary={`ID: ${location.locationId}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLocation(location.locationId);
                      }}
                      disabled={deleteLoading[location.locationId]}
                    >
                      {deleteLoading[location.locationId] ? (
                        <CircularProgress size={24} />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Main Chat Area */}
          <Container maxWidth="md" sx={{ flexGrow: 1, py: 4 }}>
            <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h5" component="h1" align="center">
                  SkyGlymps AI Chat
                </Typography>
              </Box>
              
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {chatHistory.map((chat, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: chat.sender === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        backgroundColor: chat.sender === 'user' ? '#e3f2fd' : '#f5f5f5',
                      }}
                    >
                      <Typography>{chat.text}</Typography>
                    </Paper>
                  </Box>
                ))}
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                    <CircularProgress size={20} />
                  </Box>
                )}
              </Box>

              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={loading}
                    endIcon={<SendIcon />}
                  >
                    Send
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Container>

          {/* Weather Display Area */}
          <Paper 
            elevation={3} 
            sx={{ 
              width: 300, 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              borderLeft: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <CloudIcon sx={{ mr: 1 }} />
              Weather Data
            </Typography>

            {weatherLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : weatherData ? (
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ThermostatIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          Temperature: {weatherData.temperature}°C
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <WaterDropIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          Humidity: {weatherData.humidity}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AirIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          Wind: {weatherData.windSpeed} m/s
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Wind Direction: {weatherData.windDegree}°
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                Select a location to view weather data
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App; 