const db = require('../config/database');

async function createFamilyGroup(req, res) {
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  db.run(
    'INSERT INTO family_groups (name, owner_id) VALUES (?, ?)',
    [name, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating family group' });
      }

      const groupId = this.lastID;

      db.run(
        'INSERT INTO family_members (group_id, user_id) VALUES (?, ?)',
        [groupId, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error adding owner to group' });
          }

          res.status(201).json({
            message: 'Family group created successfully',
            group: {
              id: groupId,
              name,
              ownerId: userId
            }
          });
        }
      );
    }
  );
}

async function getFamilyGroups(req, res) {
  const userId = req.user.userId;

  db.all(
    `SELECT fg.*, fm.user_id as member_id
     FROM family_groups fg
     JOIN family_members fm ON fg.id = fm.group_id
     WHERE fm.user_id = ?`,
    [userId],
    (err, groups) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ groups });
    }
  );
}

async function addFamilyMember(req, res) {
  const { groupId } = req.params;
  const { email } = req.body;
  const userId = req.user.userId;

  db.get('SELECT * FROM family_groups WHERE id = ? AND owner_id = ?', [groupId, userId], (err, group) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!group) {
      return res.status(404).json({ error: 'Family group not found or you are not the owner' });
    }

    db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      db.run(
        'INSERT INTO family_members (group_id, user_id) VALUES (?, ?)',
        [groupId, user.id],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'User is already a member' });
            }
            return res.status(500).json({ error: 'Error adding family member' });
          }

          res.status(201).json({ message: 'Family member added successfully' });
        }
      );
    });
  });
}

async function getGroupDevices(req, res) {
  const { groupId } = req.params;
  const userId = req.user.userId;

  db.get(
    'SELECT * FROM family_members WHERE group_id = ? AND user_id = ?',
    [groupId, userId],
    (err, member) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!member) {
        return res.status(403).json({ error: 'You are not a member of this group' });
      }

      db.all(
        `SELECT d.*, u.name as owner_name, l.latitude, l.longitude, l.timestamp as last_location_time
         FROM devices d
         JOIN users u ON d.user_id = u.id
         JOIN family_members fm ON d.user_id = fm.user_id
         LEFT JOIN (
           SELECT device_id, latitude, longitude, timestamp,
                  ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY timestamp DESC) as rn
           FROM locations
         ) l ON d.id = l.device_id AND l.rn = 1
         WHERE fm.group_id = ?
         ORDER BY d.created_at DESC`,
        [groupId],
        (err, devices) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          const formattedDevices = devices.map(device => ({
            id: device.id,
            deviceName: device.device_name,
            deviceType: device.device_type,
            ownerName: device.owner_name,
            isOnline: device.is_online === 1,
            batteryLevel: device.battery_level,
            lastSeen: device.last_seen,
            lastLocation: device.latitude && device.longitude ? {
              latitude: device.latitude,
              longitude: device.longitude,
              timestamp: device.last_location_time
            } : null
          }));

          res.json({ devices: formattedDevices });
        }
      );
    }
  );
}

module.exports = {
  createFamilyGroup,
  getFamilyGroups,
  addFamilyMember,
  getGroupDevices
};