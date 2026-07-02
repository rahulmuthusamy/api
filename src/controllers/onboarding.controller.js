const onboardingService = require('../services/onboarding.service');
const { Owner, TeamMaster, AuctionSession, AuctionTeam, AuctionPlayer, PlayerMaster } = require('../models');
const response = require('../utils/response');
const HTTP = require('../utils/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Owner submits fee payment screenshot/info
 */
exports.submitOwnerFee = asyncHandler(async (req, res) => {
    const { transactionId, notes } = req.body;
    const userId = req.user.userId;
    const result = await onboardingService.submitOwnerFee(userId, transactionId, req.file, notes);
    response.success(res, 'Owner fee proof submitted successfully', result, HTTP.CREATED);
});

/**
 * Admin views pending fee payments
 */
exports.getPendingPayments = asyncHandler(async (req, res) => {
    const result = await onboardingService.getPendingPayments();
    response.success(res, 'Pending payments fetched successfully', result);
});

/**
 * Admin approves/rejects payment receipt
 */
exports.verifyPayment = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { status } = req.body;
    const verifierUserId = req.user.userId;
    const result = await onboardingService.verifyPayment(paymentId, verifierUserId, status);
    response.success(res, `Payment status updated to ${status} successfully`, result);
});

/**
 * Player submits documents
 */
exports.submitPlayerDocs = asyncHandler(async (req, res) => {
    const { documentType } = req.body;
    const userId = req.user.userId;
    const result = await onboardingService.submitPlayerDocs(userId, documentType, req.file);
    response.success(res, 'Player document submitted successfully', result, HTTP.CREATED);
});

/**
 * Admin views players awaiting verification
 */
exports.getPendingPlayers = asyncHandler(async (req, res) => {
    const result = await onboardingService.getPendingPlayers();
    response.success(res, 'Pending players fetched successfully', result);
});

/**
 * Admin verifies/approves player profile
 */
exports.verifyPlayer = asyncHandler(async (req, res) => {
    const { playerId } = req.params;
    const { status, notes } = req.body;
    const verifierUserId = req.user.userId;
    const result = await onboardingService.verifyPlayer(playerId, verifierUserId, status, notes);
    response.success(res, `Player verification updated to ${status} successfully`, result);
});

/**
 * Public endpoint for Owner/Team registration
 */
exports.registerTeam = asyncHandler(async (req, res) => {
    const { ownerName, contactNumber, password, teamName, location, slogan, sessionId, transactionId, notes } = req.body;
    
    if (!ownerName || !contactNumber || !password || !teamName) {
        return response.error(res, { message: 'Missing required fields' }, HTTP.BAD_REQUEST);
    }
    
    if (!req.file || !transactionId) {
        return response.error(res, { message: 'Payment screenshot and Transaction ID are required' }, HTTP.BAD_REQUEST);
    }
    
    const result = await onboardingService.registerTeam(
        ownerName, contactNumber, password, teamName, location, slogan, sessionId, 
        transactionId, notes, req.file
    );
    response.success(res, 'Team registered successfully.', result, HTTP.CREATED);
});

/**
 * Public endpoint for Player auction registration
 */
exports.registerPlayerForAuction = asyncHandler(async (req, res) => {
    const { playerName, fatherName, contactNumber, role, battingStyle, bowlingStyle, jerseySize, basePrice, sessionId } = req.body;
    
    if (!playerName || !fatherName || !contactNumber || !sessionId) {
        return response.error(res, { message: 'Missing required fields (playerName, fatherName, contactNumber, sessionId)' }, HTTP.BAD_REQUEST);
    }
    
    const result = await onboardingService.registerPlayerForAuction(playerName, fatherName, contactNumber, role, battingStyle, bowlingStyle, jerseySize, basePrice, sessionId, req.file);
    response.success(res, 'Player registered for auction successfully.', result, HTTP.CREATED);
});

/**
 * Admin views pending owner registrations
 */
exports.getPendingOwners = asyncHandler(async (req, res) => {
    const result = await onboardingService.getPendingOwners();
    response.success(res, 'Pending owners fetched successfully', result);
});

/**
 * Admin approves/rejects owner registration
 */
exports.verifyOwner = asyncHandler(async (req, res) => {
    const { ownerId } = req.params;
    const { status } = req.body;
    const result = await onboardingService.verifyOwner(ownerId, status);
    response.success(res, `Owner registration ${status} successfully`, result);
});

exports.getOwnerDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const owner = await Owner.findOne({
        where: { UserID: userId },
        include: [{ model: TeamMaster, attributes: ['TeamID', 'Name', 'LogoURL', 'Location', 'Slogan'] }]
    });
    if (!owner) return response.error(res, { message: 'Owner profile not found' }, HTTP.NOT_FOUND);

    const team = owner.TeamMaster;
    let auctionSession = null;
    let auctionTeam = null;
    let boughtPlayers = [];

    const liveSession = await AuctionSession.findOne({ where: { Status: 'live' } });
    const upcomingSession = liveSession ? null : await AuctionSession.findOne({ where: { Status: 'upcoming' } });
    const targetSession = liveSession || upcomingSession;

    if (targetSession && team) {
        auctionTeam = await AuctionTeam.findOne({
            where: { SessionID: targetSession.SessionID, TeamID: team.TeamID }
        });
        if (auctionTeam) {
            boughtPlayers = await AuctionPlayer.findAll({
                where: { SessionID: targetSession.SessionID, TeamID: team.TeamID, Status: 'sold' },
                include: [{ model: PlayerMaster, attributes: ['PlayerID', 'Name', 'Role', 'PhotoURL', 'BattingStyle', 'BowlingStyle'] }]
            });
        }
    }

    let playerProfile = null;
    const playerMaster = await PlayerMaster.findOne({ where: { UserID: userId } });
    if (playerMaster) {
        playerProfile = {
            playerId: playerMaster.PlayerID,
            name: playerMaster.Name,
            role: playerMaster.Role,
            photo: playerMaster.PhotoURL,
            battingStyle: playerMaster.BattingStyle,
            bowlingStyle: playerMaster.BowlingStyle
        };
    }

    response.success(res, 'Owner dashboard data fetched successfully', {
        owner: { ownerId: owner.OwnerID, fullName: owner.FullName, contactNumber: owner.ContactNumber, verificationStatus: owner.VerificationStatus, feePaymentStatus: owner.FeePaymentStatus },
        team: team ? { teamId: team.TeamID, name: team.Name, logoUrl: team.LogoURL, location: team.Location, slogan: team.Slogan } : null,
        auctionSession: targetSession ? { sessionId: targetSession.SessionID, name: targetSession.Name, status: targetSession.Status, maxBudget: targetSession.MaxBudget, maxPlayersPerTeam: targetSession.MaxPlayersPerTeam } : null,
        auctionTeam: auctionTeam ? { auctionTeamId: auctionTeam.AuctionTeamId, remainingBudget: auctionTeam.RemainingBudget, playersCount: auctionTeam.PlayersCount } : null,
        boughtPlayers: boughtPlayers.map(p => ({
            playerId: p.PlayerID,
            name: p.PlayerMaster?.Name,
            role: p.PlayerMaster?.Role,
            photo: p.PlayerMaster?.PhotoURL,
            battingStyle: p.PlayerMaster?.BattingStyle,
            bowlingStyle: p.PlayerMaster?.BowlingStyle,
            soldPrice: p.SoldPrice
        })),
        playerProfile
    });
});
