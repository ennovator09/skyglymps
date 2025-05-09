const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const Location = require('./models/Location');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// API Documentation
const apiEndpoints = {
  endpoints: [
    {
      path: '/',
      method: 'GET',
      description: 'Welcome message and API status'
    },
    {
      path: '/api/locations',
      method: 'GET',
      description: 'Get all saved locations'
    },
    {
      path: '/api/locations',
      method: 'POST',
      description: 'Save a new location',
      body: {
        latitude: 'number (required)',
        longitude: 'number (required)'
      }
    },
    {
      path: '/api/locations/:locationId',
      method: 'DELETE',
      description: 'Delete a location by ID'
    },
    {
      path: '/api/chat',
      method: 'POST',
      description: 'Send a message to AI chat',
      body: {
        message: 'string (required)'
      }
    },
    {
      path: '/api/weather',
      method: 'GET',
      description: 'Get weather data for coordinates',
      query: {
        latitude: 'number (required)',
        longitude: 'number (required)'
      }
    },
    {
      path: '/api/docs',
      method: 'GET',
      description: 'List all available API endpoints'
    }
  ]
};

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json(apiEndpoints);
});

// Weather API function
const getWeatherData = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );

    const weatherData = {
      temperature: response.data.main.temp,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      windDegree: response.data.wind.deg
    };

    return weatherData;
  } catch (error) {
    console.error('Weather API Error:', error);
    throw new Error('Failed to fetch weather data');
  }
};

// Weather endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const weatherData = await getWeatherData(latitude, longitude);
    res.json(weatherData);
  } catch (error) {
    console.error('Weather Endpoint Error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/SkyGlymps')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  //res.json({ message: 'Welcome to SkyGlymps API' });
  res.json(apiEndpoints);
});

// Location Routes
app.post('/api/locations', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Generate a unique location ID
    const locationId = `${Math.random().toString(36).substr(2, 9)}`;

    const location = new Location({
      locationId,
      latitude,
      longitude
    });

    await location.save();
    res.status(201).json(location);
  } catch (error) {
    console.error('Location Save Error:', error);
    res.status(500).json({ error: 'Failed to save location' });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.find().sort({ locationId: -1 });
    res.json(locations);
  } catch (error) {
    console.error('Location Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

app.delete('/api/locations/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const deletedLocation = await Location.findOneAndDelete({ locationId });
    
    if (!deletedLocation) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ message: 'Location deleted successfully', location: deletedLocation });
  } catch (error) {
    console.error('Location Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});
async function generateImage() {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: "A futuristic city with flying cars at sunset",
        n: 1,
        size: "1024x1024"
      });
  
      const imageUrl = response.data[0].url;
      console.log("Generated image URL:", imageUrl);
    } catch (error) {
      console.error("Error generating image:", error);
    }
  }
// AI Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    generateImage();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for the SkyGlymps application. Provide clear, concise, and friendly responses."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const aiResponse = completion.choices[0].message.content;
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get response from AI',
      details: error.message 
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 