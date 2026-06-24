const express = require('express');
const router = express.Router();
const controller = require('../controllers/settings.controller');
const {
    uploadCarouselImage,
    uploadGalleryImage,
    uploadSponsorLogo,
    uploadAppLogo
} = require('../middlewares/upload.middleware');
const asyncHandler = require('../utils/asyncHandler');

// App Settings
router.get('/app-settings', asyncHandler(controller.getAppSettings));
router.put('/app-settings', uploadAppLogo.fields([{name: 'logo', maxCount: 1}, {name: 'upiScanner', maxCount: 1}]), asyncHandler(controller.updateAppSettings));

// Gallery
router.get('/gallery', asyncHandler(controller.getGallery));
router.post('/gallery', uploadGalleryImage.single('file'), asyncHandler(controller.createGallery));
router.put('/gallery/:id', uploadGalleryImage.single('file'), asyncHandler(controller.updateGallery));
router.delete('/gallery/:id', asyncHandler(controller.deleteGallery));

// Carousel
router.get('/carousel', asyncHandler(controller.getCarousel));
router.post('/carousel', uploadCarouselImage.single('file'), asyncHandler(controller.createCarousel));
router.put('/carousel/:id', uploadCarouselImage.single('file'), asyncHandler(controller.updateCarousel));
router.delete('/carousel/:id', asyncHandler(controller.deleteCarousel));

// Sponsors
router.get('/sponsors', asyncHandler(controller.getSponsors));
router.post('/sponsors', uploadSponsorLogo.single('file'), asyncHandler(controller.createSponsor));
router.put('/sponsors/:id', uploadSponsorLogo.single('file'), asyncHandler(controller.updateSponsor));
router.delete('/sponsors/:id', asyncHandler(controller.deleteSponsor));

// Location Master
router.get('/locations', asyncHandler(controller.getLocations));
router.post('/locations', asyncHandler(controller.createLocation));
router.put('/locations/:id', asyncHandler(controller.updateLocation));
router.delete('/locations/:id', asyncHandler(controller.deleteLocation));

module.exports = router;

