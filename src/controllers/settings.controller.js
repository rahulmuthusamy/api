const settingsService = require('../services/settings.service');
const response = require('../utils/response');
const HTTP = require('../utils/httpStatusCodes');

// Helper to get image path
const getImagePath = (file, folder) => {
    return file ? `/uploads/${folder}/${file.filename}` : null;
};

// Gallery Controllers
exports.getGallery = async (req, res) => {
    const data = await settingsService.getAllGallery(req.query);
    return response.success(res, "Gallery fetched successfully", { gallery: data });
};

exports.createGallery = async (req, res) => {
    const payload = req.body;
    if (req.file) {
        payload.ImageURL = getImagePath(req.file, 'gallery');
    }
    const data = await settingsService.createGallery(payload);
    return response.success(res, "Gallery image added successfully", { gallery: data }, HTTP.CREATED);
};

exports.updateGallery = async (req, res) => {
    const payload = req.body;
    if (req.file) {
        payload.ImageURL = getImagePath(req.file, 'gallery');
    }
    const data = await settingsService.updateGallery(req.params.id, payload);
    if (!data) return response.error(res, { message: "Gallery image not found" }, HTTP.NOT_FOUND);
    return response.success(res, "Gallery image updated successfully", { gallery: data });
};

exports.deleteGallery = async (req, res) => {
    const success = await settingsService.deleteGallery(req.params.id);
    if (!success) return response.error(res, { message: "Gallery image not found" }, HTTP.NOT_FOUND);
    return response.success(res, "Gallery image deleted successfully");
};

// Carousel Controllers
exports.getCarousel = async (req, res) => {
    const data = await settingsService.getAllCarousel(req.query);
    return response.success(res, "Carousel fetched successfully", { carousel: data });
};

exports.createCarousel = async (req, res) => {
    const payload = req.body;
    if (req.file) {
        payload.ImageURL = getImagePath(req.file, 'carousel');
    }
    const data = await settingsService.createCarousel(payload);
    return response.success(res, "Carousel item added successfully", { carousel: data }, HTTP.CREATED);
};

exports.updateCarousel = async (req, res) => {
    const payload = req.body;
    if (req.file) {
        payload.ImageURL = getImagePath(req.file, 'carousel');
    }
    const data = await settingsService.updateCarousel(req.params.id, payload);
    if (!data) return response.error(res, { message: "Carousel item not found" }, HTTP.NOT_FOUND);
    return response.success(res, "Carousel item updated successfully", { carousel: data });
};

exports.deleteCarousel = async (req, res) => {
    const success = await settingsService.deleteCarousel(req.params.id);
    if (!success) return response.error(res, { message: "Carousel item not found" }, HTTP.NOT_FOUND);
    return response.success(res, "Carousel item deleted successfully");
};

// Sponsor Controllers
exports.getSponsors = async (req, res) => {
    const data = await settingsService.getAllSponsors(req.query);
    return response.success(res, "Sponsors fetched successfully", { sponsors: data });
};

exports.createSponsor = async (req, res) => {
    const payload = req.body;
    if (req.file) {
        payload.LogoURL = getImagePath(req.file, 'sponsors');
    }
    const data = await settingsService.createSponsor(payload);
    return response.success(res, "Sponsor added successfully", { sponsor: data }, HTTP.CREATED);
};

exports.updateSponsor = async (req, res) => {
    const payload = req.body;
    if (req.file) {
        payload.LogoURL = getImagePath(req.file, 'sponsors');
    }
    const data = await settingsService.updateSponsor(req.params.id, payload);
    if (!data) return response.error(res, { message: "Sponsor not found" }, HTTP.NOT_FOUND);
    return response.success(res, "Sponsor updated successfully", { sponsor: data });
};

exports.deleteSponsor = async (req, res) => {
    const success = await settingsService.deleteSponsor(req.params.id);
    if (!success) return response.error(res, { message: "Sponsor not found" }, HTTP.NOT_FOUND);
    return response.success(res, "Sponsor deleted successfully");
};

// AppSettings Controllers
exports.getAppSettings = async (req, res) => {
    const data = await settingsService.getAppSettings();
    return response.success(res, "App settings fetched successfully", { settings: data });
};

exports.updateAppSettings = async (req, res) => {
    const payload = req.body;
    if (req.files && req.files['logo']) {
        payload.AppLogoURL = getImagePath(req.files['logo'][0], 'branding');
    }
    if (req.files && req.files['upiScanner']) {
        payload.UPIScannerImageURL = getImagePath(req.files['upiScanner'][0], 'branding');
    }
    const data = await settingsService.updateAppSettings(payload);
    return response.success(res, "App settings updated successfully", { settings: data });
};

// Location Master Controllers
exports.getLocations = async (req, res) => {
    const activeOnly = req.query.active === 'true';
    const data = activeOnly
        ? await settingsService.getActiveLocations()
        : await settingsService.getAllLocations();
    return response.success(res, "Locations fetched successfully", { locations: data });
};

exports.createLocation = async (req, res) => {
    const data = await settingsService.createLocation(req.body);
    return response.success(res, "Location added successfully", { location: data }, HTTP.CREATED);
};

exports.updateLocation = async (req, res) => {
    const data = await settingsService.updateLocation(req.params.id, req.body);
    if (!data) return response.error(res, { message: "Location not found" }, HTTP.NOT_FOUND);
    return response.success(res, "Location updated successfully", { location: data });
};

exports.deleteLocation = async (req, res) => {
    const success = await settingsService.deleteLocation(req.params.id);
    if (!success) return response.error(res, { message: "Location not found" }, HTTP.NOT_FOUND);
    return response.success(res, "Location deleted successfully");
};

