const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', authenticateToken, deviceController.registerDevice);
router.get('/', authenticateToken, deviceController.getDevices);
router.get('/:deviceId', authenticateToken, deviceController.getDeviceById);
router.put('/:deviceId', authenticateToken, deviceController.updateDevice);
router.delete('/:deviceId', authenticateToken, deviceController.deleteDevice);
router.post('/:deviceId/lost-mode', authenticateToken, deviceController.toggleLostMode);
router.get('/:deviceId/history', authenticateToken, deviceController.getLocationHistory);

module.exports = router;