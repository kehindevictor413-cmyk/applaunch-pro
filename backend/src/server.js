const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();

const db = require('./config/database');
const { initWebSocket } = require('./utils/websocket');

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const trackingRoutes = require('./routes/tracking');
const familyRoutes = require('./routes/family');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/track', trackingRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/track/:deviceId', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/track.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/signup.html'));
});

app.get('/verify-email', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/verify-email.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/reset-password.html'));
});

initWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   X∞ Smart Locator Server Running     ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV}            ║
╚════════════════════════════════════════╝
  `);
});