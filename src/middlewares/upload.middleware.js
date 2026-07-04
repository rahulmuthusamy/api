const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { imageFileFilter, documentFileFilter, generateFileName } = require('../utils/file.util.js');

// Folders
const FOLDERS = {
    players: 'players',
    carousel: 'carousel',
    gallery: 'gallery',
    sponsors: 'sponsors',
    branding: 'branding',
    teams: 'teams',
    tournaments: 'tournaments',
    receipts: 'receipts',
    documents: 'documents'
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

const createUploader = (folder, fileFilter = imageFileFilter) => multer({
    storage: storageFactory(folder),
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadPlayerImage = createUploader(FOLDERS.players);
const uploadCarouselImage = createUploader(FOLDERS.carousel);
const uploadGalleryImage = createUploader(FOLDERS.gallery);
const uploadSponsorLogo = createUploader(FOLDERS.sponsors);
const uploadAppLogo = createUploader(FOLDERS.branding);
const uploadTeamLogo = createUploader(FOLDERS.teams);
const uploadTournament = createUploader(FOLDERS.tournaments);

// New document uploaders
const uploadReceipt = createUploader(FOLDERS.receipts, documentFileFilter);
const uploadVerificationDoc = createUploader(FOLDERS.documents, documentFileFilter);

// Custom storage for mixed player registration
const mixedStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = FOLDERS.players;
        if (file.fieldname === 'receipt') folder = FOLDERS.receipts;
        if (file.fieldname === 'qrCodeFile') folder = 'qr';
        
        const dir = path.join(process.cwd(), `uploads/${folder}`);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, generateFileName(file))
});
const uploadMixedRegistration = multer({ storage: mixedStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const uploadSessionQR = createUploader('qr');

module.exports = {
    uploadPlayerImage,
    uploadCarouselImage,
    uploadGalleryImage,
    uploadSponsorLogo,
    uploadAppLogo,
    uploadTeamLogo,
    uploadTournament,
    uploadReceipt,
    uploadVerificationDoc,
    uploadMixedRegistration,
    uploadSessionQR
};
