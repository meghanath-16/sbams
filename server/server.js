const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sbams')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const buildingRoutes = require('./routes/buildingRoutes');
const roomRoutes = require('./routes/roomRoutes');
const energyLogRoutes = require('./routes/energyLogRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');

const http = require('http');
const socketIO = require('./utils/socket');

const server = http.createServer(app);

// Init Socket.io
const io = socketIO.init(server);

// Base API route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the SBAMS API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/energylogs', energyLogRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Basic Route
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'SBAMS API is up and running!'
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

