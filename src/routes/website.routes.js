const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/website.controller');

// GET /api/website/init
router.get('/init', websiteController.getWebsiteInitData);

module.exports = router;
