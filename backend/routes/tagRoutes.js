const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getAllTags, findOrCreateTag } = require('../controllers/tagController');

router.use(verifyToken);
router.get('/', getAllTags);
router.post('/', findOrCreateTag);

module.exports = router;
