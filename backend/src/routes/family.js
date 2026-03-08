const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { authenticateToken } = require('../middleware/auth');

router.post('/groups', authenticateToken, familyController.createFamilyGroup);
router.get('/groups', authenticateToken, familyController.getFamilyGroups);
router.post('/groups/:groupId/members', authenticateToken, familyController.addFamilyMember);
router.get('/groups/:groupId/devices', authenticateToken, familyController.getGroupDevices);

module.exports = router;