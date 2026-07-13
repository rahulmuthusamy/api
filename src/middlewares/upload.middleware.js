const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
    imageFileFilter,
    documentFileFilter,
    generateFileName,
} = require("../utils/file.util.js");

// Upload folders
const FOLDERS = {
    players: "players",
    carousel: "carousel",
    gallery: "gallery",
    sponsors: "sponsors",
    branding: "branding",
    teams: "teams",
    tournaments: "tournaments",
    receipts: "receipts",
    documents: "documents",
    qr: "qr",
};

// Create upload directory if it doesn't exist
const ensureDirectory = (folder) => {
    const dir = path.join(process.cwd(), "uploads", folder);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return dir;
};

// Storage factory
const storageFactory = (folder) =>
    multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, ensureDirectory(folder));
        },
        filename: (req, file, cb) => {
            cb(null, generateFileName(file));
        },
    });

// Default multer configuration
const multerOptions = (folder, fileFilter = imageFileFilter) =>
    multer({
        storage: storageFactory(folder),
        fileFilter,
        limits: {
            fileSize: 20 * 1024 * 1024, // 20 MB
            fieldSize: 20 * 1024 * 1024, // 20 MB per text field
            fields: 100, // Maximum text fields
            files: 20, // Maximum uploaded files
            parts: 120, // Total parts (fields + files)
        },
    });

// Uploaders
const uploadPlayerImage = multerOptions(FOLDERS.players);
const uploadCarouselImage = multerOptions(FOLDERS.carousel);
const uploadGalleryImage = multerOptions(FOLDERS.gallery);
const uploadSponsorLogo = multerOptions(FOLDERS.sponsors);
const uploadAppLogo = multerOptions(FOLDERS.branding);
const uploadTeamLogo = multerOptions(FOLDERS.teams);
const uploadTournament = multerOptions(FOLDERS.tournaments);

const uploadReceipt = multerOptions(
    FOLDERS.receipts,
    documentFileFilter
);

const uploadVerificationDoc = multerOptions(
    FOLDERS.documents,
    documentFileFilter
);

// Mixed upload (player + receipt + QR)
const mixedStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = FOLDERS.players;

        switch (file.fieldname) {
            case "receipt":
                folder = FOLDERS.receipts;
                break;

            case "qrCodeFile":
                folder = FOLDERS.qr;
                break;

            default:
                folder = FOLDERS.players;
        }

        cb(null, ensureDirectory(folder));
    },

    filename: (req, file, cb) => {
        cb(null, generateFileName(file));
    },
});

const uploadMixedRegistration = multer({
    storage: mixedStorage,
    limits: {
        fileSize: 20 * 1024 * 1024,
        fieldSize: 20 * 1024 * 1024,
        fields: 100,
        files: 20,
        parts: 120,
    },
});

const uploadSessionQR = multerOptions(FOLDERS.qr);

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
    uploadSessionQR,
};