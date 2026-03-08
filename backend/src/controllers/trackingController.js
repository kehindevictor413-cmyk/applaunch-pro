const db = require('../config/database');

async function submitLocation(req, res) {
  const { deviceId } = req.params;
  const { latitude, longitude, accuracy, altitude, speed, heading, batteryLevel, timestamp } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  db.get('SELECT * FROM devices WHERE id = ?', [deviceId], (err, device) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const locationTimestamp = timestamp || Math.floor(Date.now() / 1000);

    db.run(
      `INSERT INTO locations (device_id, latitude, longitude, accuracy, altitude, speed, heading, battery_level, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [deviceId, latitude, longitude, accuracy, altitude, speed, heading, batteryLevel, locationTimestamp],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error saving location' });
        }

        db.run(
          'UPDATE devices SET last_seen = ?, battery_level = ?, is_online = 1 WHERE id = ?',
          [locationTimestamp, batteryLevel, deviceId],
          (err) => {
            if (err) {
              console.error('Error updating device status:', err);
            }
          }
        );

        res.json({ 
          message: 'Location updated successfully',
          isLostMode: device.is_lost_mode === 1,
          updateInterval: device.is_lost_mode === 1 ? 3000 : 5000
        });
      }
    );
  });
}

async function getDeviceInfo(req, res) {
  const { deviceId } = req.params;

  db.get('SELECT * FROM devices WHERE id = ?', [deviceId], (err, device) => {
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
        isLostMode: device.is_lost_mode === 1,
        updateInterval: device.is_lost_mode === 1 ? 3000 : 5000
      }
    });
  });
}

async function getLatestLocation(req, res) {
  const { deviceId } = req.params;

  db.get(
    'SELECT * FROM locations WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1',
    [deviceId],
    (err, location) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!location) {
        return res.status(404).json({ error: 'No location data found' });
      }

      res.json({
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          altitude: location.altitude,
          speed: location.speed,
          heading: location.heading,
          batteryLevel: location.battery_level,
          timestamp: location.timestamp
        }
      });
    }
  );
}

module.exports = {
  submitLocation,
  getDeviceInfo,
  getLatestLocation
};