const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
require('dotenv').config();

let wss;
const clients = new Map();

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'authenticate') {
          const token = data.token;
          
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            ws.userId = decoded.userId;
            
            if (!clients.has(decoded.userId)) {
              clients.set(decoded.userId, []);
            }
            clients.get(decoded.userId).push(ws);
            
            ws.send(JSON.stringify({ type: 'authenticated', userId: decoded.userId }));
            console.log(`User ${decoded.userId} authenticated via WebSocket`);
          } catch (err) {
            ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
            ws.close();
          }
        } else if (data.type === 'subscribe') {
          ws.subscribedDevices = data.deviceIds || [];
          ws.send(JSON.stringify({ type: 'subscribed', deviceIds: ws.subscribedDevices }));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      if (ws.userId && clients.has(ws.userId)) {
        const userClients = clients.get(ws.userId);
        const index = userClients.indexOf(ws);
        if (index > -1) {
          userClients.splice(index, 1);
        }
        if (userClients.length === 0) {
          clients.delete(ws.userId);
        }
      }
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('✓ WebSocket server initialized');
}

function broadcastLocationUpdate(userId, deviceId, locationData) {
  if (clients.has(userId)) {
    const userClients = clients.get(userId);
    const message = JSON.stringify({
      type: 'location_update',
      deviceId,
      location: locationData
    });

    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        if (!client.subscribedDevices || client.subscribedDevices.includes(deviceId)) {
          client.send(message);
        }
      }
    });
  }
}

function broadcastNotification(userId, notification) {
  if (clients.has(userId)) {
    const userClients = clients.get(userId);
    const message = JSON.stringify({
      type: 'notification',
      notification
    });

    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

function broadcastDeviceStatus(userId, deviceId, status) {
  if (clients.has(userId)) {
    const userClients = clients.get(userId);
    const message = JSON.stringify({
      type: 'device_status',
      deviceId,
      status
    });

    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

module.exports = {
  initWebSocket,
  broadcastLocationUpdate,
  broadcastNotification,
  broadcastDeviceStatus
};