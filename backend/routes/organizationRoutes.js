const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const c = require('../controllers/organizationController');

router.use(verifyToken, requireRole('organization'));

router.get('/profile', c.getProfile);
router.put('/profile', c.updateProfile);
router.post('/opportunities', c.createOpportunity);
router.get('/opportunities', c.getMyOpportunities);
router.put('/opportunities/:id/status', c.updateOpportunityStatus);
router.delete('/opportunities/:id', c.deleteOpportunity);
router.get('/opportunities/:id/applicants', c.getApplicants);
router.put('/applications/:appId/status', c.updateApplicationStatus);

module.exports = router;