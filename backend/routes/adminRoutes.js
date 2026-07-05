const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  getStats,
  getPendingOrganizations,
  verifyOrganization,
  getAllUsers,
  toggleUserActive,
  deleteUser,
  sendNotificationToUser,
  getAllOpportunities,
  deleteOpportunity,
  deleteExpiredOpportunities,
  getReports,
} = require('../controllers/adminController');

router.use(verifyToken, requireRole('admin'));

router.get('/stats', getStats);
router.get('/reports', getReports);
router.get('/organizations/pending', getPendingOrganizations);
router.put('/organizations/:id/verify', verifyOrganization);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-active', toggleUserActive);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/notify', sendNotificationToUser);
router.get('/opportunities', getAllOpportunities);
router.delete('/opportunities/:id', deleteOpportunity);
router.delete('/opportunities/expired', deleteExpiredOpportunities);

module.exports = router;