const { Gallery, Carousel, Sponsor, AppSetting, LocationMaster } = require('../models');
const BaseService = require('./base.service');

const galleryService = new BaseService(Gallery);
const carouselService = new BaseService(Carousel);
const sponsorService = new BaseService(Sponsor);
const appSettingsService = new BaseService(AppSetting);
const locationService = new BaseService(LocationMaster);


// Gallery Services
exports.getAllGallery = async (query = {}) => {
    return await galleryService.getAll({ where: query, order: [['Order', 'ASC'], ['createdAt', 'DESC']] });
};

exports.createGallery = async (data) => {
    return await galleryService.create(data);
};

exports.updateGallery = async (id, data) => {
    return await galleryService.update(id, data);
};

exports.deleteGallery = async (id) => {
    return await galleryService.delete(id);
};

// Carousel Services
exports.getAllCarousel = async (query = {}) => {
    return await carouselService.getAll({ where: query, order: [['Order', 'ASC']] });
};

exports.createCarousel = async (data) => {
    return await carouselService.create(data);
};

exports.updateCarousel = async (id, data) => {
    return await carouselService.update(id, data);
};

exports.deleteCarousel = async (id) => {
    return await carouselService.delete(id);
};

// Sponsor Services
exports.getAllSponsors = async (query = {}) => {
    return await sponsorService.getAll({ where: query, order: [['Order', 'ASC']] });
};

exports.createSponsor = async (data) => {
    return await sponsorService.create(data);
};

exports.updateSponsor = async (id, data) => {
    return await sponsorService.update(id, data);
};

exports.deleteSponsor = async (id) => {
    return await sponsorService.delete(id);
};

// AppSettings Services
exports.getAppSettings = async () => {
    // Custom singleton logic
    let settings = await appSettingsService.findOne();
    if (!settings) {
        settings = await appSettingsService.create({
            AppName: 'Kattur Cricket Club',
            AppDescription: 'Village Cricket League Management System'
        });
    }
    return settings;
};

exports.updateAppSettings = async (data) => {
    // Custom singleton update logic
    let settings = await appSettingsService.findOne();
    if (!settings) {
        return await appSettingsService.create(data);
    }
    return await settings.update(data);
};

// Location Master Services
exports.getAllLocations = async () => {
    return await locationService.getAll({ order: [['SortOrder', 'ASC'], ['Name', 'ASC']] });
};

exports.getActiveLocations = async () => {
    return await locationService.getAll({ where: { IsActive: true }, order: [['SortOrder', 'ASC'], ['Name', 'ASC']] });
};

exports.createLocation = async (data) => {
    return await locationService.create(data);
};

exports.updateLocation = async (id, data) => {
    return await locationService.update(id, data);
};

exports.deleteLocation = async (id) => {
    return await locationService.delete(id);
};

