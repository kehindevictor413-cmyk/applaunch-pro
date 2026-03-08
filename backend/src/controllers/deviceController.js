const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

async function registerDevice(req, res) {
  const { deviceName, deviceType, ownerNickname } = req.body;
  const userId = req.user.userId;

  if (!deviceName || !deviceType) {
    return res.status(400).json({ error: 'Device name and type are required' });
  }

  const deviceId = uuidv4();
  const trackingLink = `${process.env.APP_URL}/track/${deviceId}`;

  db.run(
    'INSERT INTO devices (id, user_id, device_name, device_type, owner_nickname, tracking_link) VALUES (?, ?, ?, ?, ?, ?)',
    [deviceId, userId, deviceName, deviceType, ownerNickname, trackingLink],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error registering device' });
      }

      res.status(201).json({
        message: 'Device registered successfully',
        device: {
          id: deviceId,
          deviceName,
          deviceType,
          ownerNickname,
          trackingLink
        }
      });
    }
  );
}

async function getDevices(req, res) {
  const userId = req.user.userId;

  db.all(
    `SELECT d.*, l.latitude, l.longitude, l.address, l.timestamp as last_location_time
     FROM devices d
     LEFT JOIN (
       SELECT device_id, latitude, longitude, address, timestamp,
              ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY timestamp DESC) as rn
       FROM locations
     ) l ON d.id = l.device_id AND l.rn = 1
     WHERE d.user_id = ?
     ORDER BY d.created_at DESC`,
    [userId],
    (err, devices) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedDevices = devices.map(device => ({
        id: device.id,
        deviceName: device.device_name,
        deviceType: device.device_type,
        ownerNickname: device.owner_nickname,
        trackingLink: device.tracking_link,
        isOnline: device.is_online === 1,
        isLostMode: device.is_lost_mode === 1,
        batteryLevel: device.battery_level,
        lastSeen: device.last_seen,
        lastLocation: device.latitude && device.longitude ? {
          latitude: device.latitude,
          longitude: device.longitude,
          address: device.address,
          timestamp: device.last_location_time
        } : null,
        createdAt: device.created_at
      }));

      res.json({ devices: formattedDevices });
    }
  );
}

async function getDeviceById(req, res) {
  const { deviceId } = req.params;
  const userId = req.user.userId;

  db.get(
    `SELECT d.*, l.latitude, l.longitude, l.address, l.timestamp as last_location_time
     FROM devices d
     LEFT JOIN (
       SELECT device_id, latitude, longitude, address, timestamp,
              ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY timestamp DESC) as rn
       FROM locations
     ) l ON d.id = l.device_id AND l.rn = 1
     WHERE d.id = ? AND d.user_id = ?`,
    [deviceId, userId],
    (err, device) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json({
        device: {
          id: device.id,
          deviceName: device.device_name,
          deviceType: device.device_type,
          ownerNickname: device.owner_nickname,
          trackingLink: device.tracking_link,
          isOnline: device.is_online === 1,
          isLostMode: device.is_lost_mode === 1,
          batteryLevel: device.battery_level,
          lastSeen: device.last_seen,
          lastLocation: device.latitude && device.longitude ? {
            latitude: device.latitude,
            longitude: device.longitude,
            address: device.address,
            timestamp: device.last_location_time
          } : null,
          createdAt: device.created_at
        }
      });
    }
  );
}

async function updateDevice(req, res) {
  const { deviceId } = req.params;
  const userId = req.user.userId;
  const { deviceName, deviceType, ownerNickname } = req.body;

  db.run(
    'UPDATE devices SET device_name = ?, device_type = ?, owner_nickname = ? WHERE id = ? AND user_id = ?',
    [deviceName, deviceType, ownerNickname, deviceId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json({ message: 'Device updated successfully' });
    }
  );
}

async function deleteDevice(req, res) {
  const { deviceId } = req.params;
  const userId = req.user.userId;

  db.run(
    'DELETE FROM devices WHERE id = ? AND user_id = ?',
    [deviceId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json({ message: 'Device deleted successfully' });
    }
  );
}

async function toggleLostMode(req, res) {
  const { deviceId } = req.params;
  const userId = req.user.userId;
  const { enabled } = req.body;

  db.run(
    'UPDATE devices SET is_lost_mode = ? WHERE id = ? AND user_id = ?',
    [enabled ? 1 : 0, deviceId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json({ 
        message: enabled ? 'Lost mode activated' : 'Lost mode deactivated',
        isLostMode: enabled
      });
    }
  );
}

async function getLocationHistory(req, res) {
  const { deviceId } = req.params;
  const userId = req.user.userId;
  const { startTime, endTime, limit = 100 } = req.query;

  db.get('SELECT id FROM devices WHERE id = ? AND user_id = ?', [deviceId, userId], (err, device) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    let query = 'SELECT * FROM locations WHERE device_id = ?';
    const params = [deviceId];

    if (startTime) {
      query += ' AND timestamp >= ?';
      params.push(parseInt(startTime));
    }

    if (endTime) {
      query += ' AND timestamp <= ?';
      params.push(parseInt(endTime));
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));

    db.all(query, params, (err, locations) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        deviceId,
        locations: locations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          altitude: loc.altitude,
          speed: loc.speed,
          heading: loc.heading,
          batteryLevel: loc.battery_level,
          timestamp: loc.timestamp,
          address: loc.address
        }))
      });
    });
  });
}

module.exports = {
  registerDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  toggleLostMode,
  getLocationHistory
};