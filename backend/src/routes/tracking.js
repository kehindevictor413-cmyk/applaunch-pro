const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

router.get('/:deviceId/info', trackingController.getDeviceInfo);
router.post('/:deviceId/location', trackingController.submitLocation);
router.get('/:deviceId/latest', trackingController.getLatestLocation);

module.exports = router;