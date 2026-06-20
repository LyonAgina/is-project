const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const c = require('../controllers/studentController');
const upload = require('../middleware/upload');

router.use(verifyToken, requireRole('student'));
router.post('/profile/cv', upload.single('cv'), c.uploadCv);
router.get('/profile', c.getProfile);
router.put('/profile', c.updateProfile);
router.get('/opportunities', c.browseOpportunities);
router.post('/applications', c.applyToOpportunity);
router.get('/applications', c.getMyApplications);
router.get('/notifications', c.getNotifications);
router.put('/notifications/:id/read', c.markNotificationRead);

module.exports = router;