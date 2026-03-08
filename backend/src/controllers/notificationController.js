const db = require('../config/database');

async function createNotification(userId, deviceId, type, message) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO notifications (user_id, device_id, type, message) VALUES (?, ?, ?, ?)',
      [userId, deviceId, type, message],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

async function getNotifications(req, res) {
  const userId = req.user.userId;
  const { unreadOnly } = req.query;

  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [userId];

  if (unreadOnly === 'true') {
    query += ' AND is_read = 0';
  }

  query += ' ORDER BY created_at DESC LIMIT 50';

  db.all(query, params, (err, notifications) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const formattedNotifications = notifications.map(n => ({
      id: n.id,
      deviceId: n.device_id,
      type: n.type,
      message: n.message,
      isRead: n.is_read === 1,
      createdAt: n.created_at
    }));

    res.json({ notifications: formattedNotifications });
  });
}

async function markAsRead(req, res) {
  const { notificationId } = req.params;
  const userId = req.user.userId;

  db.run(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [notificationId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ message: 'Notification marked as read' });
    }
  );
}

async function markAllAsRead(req, res) {
  const userId = req.user.userId;

  db.run(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: `${this.changes} notifications marked as read` });
    }
  );
}

function checkDeviceOffline() {
  const offlineThreshold = Math.floor(Date.now() / 1000) - 300; // 5 minutes

  db.all(
    'SELECT * FROM devices WHERE is_online = 1 AND last_seen < ?',
    [offlineThreshold],
    (err, devices) => {
      if (err) {
        console.error('Error checking offline devices:', err);
        return;
      }

      devices.forEach(device => {
        db.run('UPDATE devices SET is_online = 0 WHERE id = ?', [device.id]);
        
        createNotification(
          device.user_id,
          device.id,
          'offline',
          `Device "${device.device_name}" went offline`
        ).catch(err => console.error('Error creating notification:', err));
      });
    }
  );
}

function checkLowBattery() {
  db.all(
    'SELECT * FROM devices WHERE battery_level IS NOT NULL AND battery_level <= 20 AND is_online = 1',
    [],
    (err, devices) => {
      if (err) {
        console.error('Error checking low battery:', err);
        return;
      }

      devices.forEach(device => {
        db.get(
          `SELECT * FROM notifications 
           WHERE user_id = ? AND device_id = ? AND type = 'low_battery' 
           AND created_at > ?`,
          [device.user_id, device.id, Math.floor(Date.now() / 1000) - 3600],
          (err, recentNotification) => {
            if (!recentNotification) {
              createNotification(
                device.user_id,
                device.id,
                'low_battery',
                `Device "${device.device_name}" has low battery (${device.battery_level}%)`
              ).catch(err => console.error('Error creating notification:', err));
            }
          }
        );
      });
    }
  );
}

setInterval(checkDeviceOffline, 60000);
setInterval(checkLowBattery, 300000);

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead
};