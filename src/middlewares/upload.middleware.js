const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { imageFileFilter, generateFileName } = require('../utils/file.util.js');

// Folders
const FOLDERS = {
    players: 'players',
    carousel: 'carousel',
    gallery: 'gallery',
    sponsors: 'sponsors',
    branding: 'branding',
    teams: 'teams',
    tournaments: 'tournaments'
};

// Storage factory
const storageFactory = (folder) => {
    const dir = path.join(process.cwd(), `uploads/${folder}`);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return multer.diskStorage({
        destination: (req, file, cb) => cb(null, dir),
        filename: (req, file, cb) => cb(null, generateFileName(file))
    });
};

const createUploader = (folder) => multer({
    storage: storageFactory(folder),
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadPlayerImage = createUploader(FOLDERS.players);
const uploadCarouselImage = createUploader(FOLDERS.carousel);
const uploadGalleryImage = createUploader(FOLDERS.gallery);
const uploadSponsorLogo = createUploader(FOLDERS.sponsors);
const uploadAppLogo = createUploader(FOLDERS.branding);
const uploadTeamLogo = createUploader(FOLDERS.teams);
const uploadTournament = createUploader(FOLDERS.tournaments);

module.exports = {
    uploadPlayerImage,
    uploadCarouselImage,
    uploadGalleryImage,
    uploadSponsorLogo,
    uploadAppLogo,
    uploadTeamLogo,
    uploadTournament
};
