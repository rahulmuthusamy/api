const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboarding.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');
const { uploadReceipt, uploadVerificationDoc, uploadMixedRegistration } = require('../middlewares/upload.middleware');

// Owner submits payment screenshot
router.post('/owner/fee', authMiddleware, rbacMiddleware(['owner']), uploadReceipt.single('receipt'), onboardingController.submitOwnerFee);

// Player submits identity document
router.post('/player/documents', authMiddleware, rbacMiddleware(['player']), uploadVerificationDoc.single('document'), onboardingController.submitPlayerDocs);

// Admin views and verifies payments
router.get('/admin/payments', authMiddleware, rbacMiddleware(['super_admin']), onboardingController.getPendingPayments);
router.post('/admin/payments/:paymentId/verify', authMiddleware, rbacMiddleware(['super_admin']), onboardingController.verifyPayment);

// Admin views and verifies players
router.get('/admin/players', authMiddleware, rbacMiddleware(['super_admin']), onboardingController.getPendingPlayers);
router.post('/admin/players/:playerId/verify', authMiddleware, rbacMiddleware(['super_admin']), onboardingController.verifyPlayer);

// Public Team Registration
router.post('/public/register-team', uploadMixedRegistration.fields([{ name: 'receipt', maxCount: 1 }, { name: 'qrCodeFile', maxCount: 1 }]), onboardingController.registerTeam);

// Public Player Auction Registration
router.post('/public/register-player', uploadMixedRegistration.fields([{ name: 'photo', maxCount: 1 }, { name: 'receipt', maxCount: 1 }, { name: 'qrCodeFile', maxCount: 1 }, { name: 'aadharFile', maxCount: 1 }]), onboardingController.registerPlayerForAuction);
// Admin views and verifies pending team/owner registrations
router.get('/admin/owners', authMiddleware, rbacMiddleware(['super_admin']), onboardingController.getPendingOwners);
router.post('/admin/owners/:ownerId/verify', authMiddleware, rbacMiddleware(['super_admin']), onboardingController.verifyOwner);

// Admin views and verifies pending auction players
router.get('/admin/auction-players', authMiddleware, rbacMiddleware(['super_admin']), onboardingController.getPendingAuctionPlayers);
router.post('/admin/auction-players/:auctionPlayerId/verify', authMiddleware, rbacMiddleware(['super_admin']), onboardingController.verifyAuctionPlayer);

// Owner dashboard
router.get('/owner/dashboard', authMiddleware, rbacMiddleware(['owner']), onboardingController.getOwnerDashboard);

module.exports = router;
