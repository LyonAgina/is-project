const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  getStats,
  getPendingOrganizations,
  verifyOrganization,
  getAllUsers,
  getAllOpportunities,
  deleteOpportunity,
  deleteExpiredOpportunities,
} = require('../controllers/adminController');

router.use(verifyToken, requireRole('admin'));

router.get('/stats', getStats);
router.get('/organizations/pending', getPendingOrganizations);
router.put('/organizations/:id/verify', verifyOrganization);
router.get('/users', getAllUsers);
router.get('/opportunities', getAllOpportunities);
router.delete('/opportunities/:id', deleteOpportunity);
router.delete('/opportunities/expired', deleteExpiredOpportunities);

module.exports = router;