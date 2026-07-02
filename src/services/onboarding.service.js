const { Owner, TeamMaster, Payment, PlayerMaster, PlayerVerification, User, AuctionSession, AuctionTeam } = require('../models');
const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const HTTP = require('../utils/httpStatusCodes');
const { Op } = require('sequelize');

/**
 * Owner submits fee payment screenshot
 */
const submitOwnerFee = async (userId, transactionId, file, notes) => {
    const owner = await Owner.findOne({ where: { UserID: userId } });
    if (!owner) {
        throw new Error('Owner profile not found');
    }

    // Check if there's already a verified or pending payment
    const existing = await Payment.findOne({ where: { TransactionID: transactionId } });
    if (existing) {
        throw new Error('This transaction ID has already been submitted');
    }

    const receiptPath = file ? `/uploads/receipts/${file.filename}` : null;
    if (!receiptPath) {
        throw new Error('Receipt proof file is required');
    }

    const payment = await Payment.create({
        OwnerID: owner.OwnerID,
        Amount: 10000.00, // Fixed registration fee
        TransactionID: transactionId,
        ReceiptPath: receiptPath,
        Status: 'pending',
        Notes: notes || null
    });

    owner.FeePaymentStatus = 'pending_verification';
    await owner.save();

    return payment;
};

/**
 * Get all pending payments for admin review
 */
const getPendingPayments = async () => {
    return await Payment.findAll({
        where: { Status: 'pending' },
        include: [{ model: Owner, as: 'Owner' }]
    });
};

/**
 * Admin verifies/approves owner payment
 */
const verifyPayment = async (paymentId, verifierUserId, status) => {
    if (!['verified', 'rejected'].includes(status)) {
        throw new Error('Invalid verification status');
    }

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
        throw new Error('Payment record not found');
    }

    payment.Status = status;
    payment.VerifiedBy = verifierUserId;
    payment.VerifiedAt = new Date();
    await payment.save();

    const owner = await Owner.findByPk(payment.OwnerID);
    if (owner) {
        if (status === 'verified') {
            owner.FeePaymentStatus = 'paid';
            owner.VerificationStatus = 'approved';
        } else {
            owner.FeePaymentStatus = 'unpaid';
            owner.VerificationStatus = 'rejected';
        }
        await owner.save();
    }

    return payment;
};

/**
 * Player submits document for verification
 */
const submitPlayerDocs = async (userId, documentType, file) => {
    const player = await PlayerMaster.findOne({ where: { UserID: userId } });
    if (!player) {
        throw new Error('Player profile not found');
    }

    const docPath = file ? `/uploads/documents/${file.filename}` : null;
    if (!docPath) {
        throw new Error('Document file is required');
    }

    const verification = await PlayerVerification.create({
        PlayerID: player.PlayerID,
        DocumentPath: docPath,
        DocumentType: documentType || 'ID Proof',
        Status: 'pending'
    });

    player.Status = 'pending_verification';
    await player.save();

    return verification;
};

/**
 * Get all pending players awaiting verification
 */
const getPendingPlayers = async () => {
    return await PlayerMaster.findAll({
        where: { Status: 'pending_verification' },
        include: [{ model: PlayerVerification, limit: 1, order: [['createdAt', 'DESC']] }]
    });
};

/**
 * Admin verifies player profile
 */
const verifyPlayer = async (playerId, verifierUserId, status, notes) => {
    if (!['verified', 'rejected'].includes(status)) {
        throw new Error('Invalid verification status');
    }

    const player = await PlayerMaster.findByPk(playerId);
    if (!player) {
        throw new Error('Player not found');
    }

    // Find the latest pending verification request
    const verification = await PlayerVerification.findOne({
        where: { PlayerID: playerId, Status: 'pending' },
        order: [['createdAt', 'DESC']]
    });

    if (verification) {
        verification.Status = status;
        verification.Notes = notes || '';
        verification.VerifiedBy = verifierUserId;
        verification.VerifiedAt = new Date();
        await verification.save();
    }

    player.Status = status === 'verified' ? 'active' : 'rejected';
    await player.save();

    return player;
};

/**
 * Public Team Registration (Owner signs up for a specific session or generally)
 */
const registerTeam = async (ownerName, contactNumber, password, teamName, location, slogan, sessionId, transactionId, notes, receiptFile) => {
    // 1. Check if user with contact number exists
    const normalizedPhone = String(contactNumber || '').trim();

    let user = await User.findOne({ where: { Email: normalizedPhone } });
    let team, owner;

    if (user) {
        if (user.Role !== 'owner') {
            throw new ApiError(HTTP.BAD_REQUEST, 'A non-owner user with this phone number already exists.');
        }
        owner = await Owner.findOne({ where: { UserID: user.UserID } });
        if (!owner) {
            throw new ApiError(HTTP.BAD_REQUEST, 'Owner profile is missing for this phone number.');
        }
        team = await TeamMaster.findByPk(owner.TeamID);
        if (!team) {
            throw new ApiError(HTTP.BAD_REQUEST, 'Team profile is missing for this owner.');
        }

        team.Name = teamName || team.Name;
        team.OwnerName = ownerName || team.OwnerName;
        team.Contact = normalizedPhone;
        team.Location = location || team.Location;
        team.Slogan = slogan || team.Slogan;
        await team.save();

        owner.FullName = ownerName || owner.FullName;
        owner.ContactNumber = normalizedPhone;
        owner.RequestedSessionID = sessionId || owner.RequestedSessionID;
        await owner.save();
    } else {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User (Role: owner)
        user = await User.create({
            Email: normalizedPhone,
            PasswordHash: hashedPassword,
            Role: 'owner'
        });

        // Create TeamMaster
        team = await TeamMaster.create({
            Name: teamName,
            OwnerName: ownerName,
            Contact: normalizedPhone,
            Location: location,
            Slogan: slogan
        });

        // Create Owner mapping
        owner = await Owner.create({
            UserID: user.UserID,
            FullName: ownerName,
            ContactNumber: normalizedPhone,
            TeamID: team.TeamID,
            RequestedSessionID: sessionId || null,
            VerificationStatus: 'pending', // Will be approved by admin
            FeePaymentStatus: 'unpaid'
        });
    }

    let assignedSession = null;
    // If sessionId is provided and owner is already approved (existing owner), directly map to auction
    if (sessionId && owner.VerificationStatus === 'approved') {
        const session = await AuctionSession.findByPk(sessionId);
        if (session) {
            const alreadyRegistered = await AuctionTeam.findOne({
                where: { SessionID: session.SessionID, TeamID: team.TeamID }
            });

            if (!alreadyRegistered) {
                await AuctionTeam.create({
                    SessionID: session.SessionID,
                    TeamID: team.TeamID,
                    Budget: session.MaxBudget,
                    RemainingBudget: session.MaxBudget,
                    PlayersCount: 0
                });
                assignedSession = session;
            } else {
                throw new ApiError(HTTP.BAD_REQUEST, 'Team is already registered for this auction.');
            }
        }
    } else if (sessionId && owner.VerificationStatus === 'pending') {
        owner.RequestedSessionID = sessionId;
        await owner.save();
    }

    // Process payment
    const existingPayment = await Payment.findOne({ where: { TransactionID: transactionId } });
    if (existingPayment) {
        throw new ApiError(HTTP.BAD_REQUEST, 'This transaction ID has already been submitted');
    }

    const receiptPath = receiptFile ? `/uploads/receipts/${receiptFile.filename}` : null;
    if (receiptPath) {
        const payment = await Payment.create({
            OwnerID: owner.OwnerID,
            Amount: 10000.00, // Fixed registration fee
            TransactionID: transactionId,
            ReceiptPath: receiptPath,
            Status: 'pending',
            Notes: notes || null
        });

        owner.FeePaymentStatus = 'pending_verification';
        await owner.save();
    }

    return { user, team, owner, assignedSession };
};

/**
 * Public Player Registration for an Auction Session
 */
const registerPlayerForAuction = async (playerName, fatherName, contactNumber, role, battingStyle, bowlingStyle, jerseySize, basePrice, sessionId, photoFile) => {
    const { AuctionPlayer } = require('../models');
    const normalizedPhone = String(contactNumber || '').trim();

    if (!sessionId) {
        throw new ApiError(HTTP.BAD_REQUEST, 'Auction Session ID is required');
    }

    // Upsert User
    let user = await User.findOne({ where: { Email: normalizedPhone } });
    if (!user) {
        // Create user with default password 'player123' (they can change it later)
        const hashedPassword = await bcrypt.hash('player123', 10);
        user = await User.create({
            Email: normalizedPhone,
            PasswordHash: hashedPassword,
            Role: 'player'
        });
    } else if (user.Role !== 'player') {
        throw new ApiError(HTTP.BAD_REQUEST, 'A non-player user with this phone number already exists.');
    }

    // Upsert PlayerMaster. Older master records may not have UserID linked yet,
    // so phone lookup is required to reuse existing player data safely.
    let player = await PlayerMaster.findOne({ where: { UserID: user.UserID } });
    if (!player) {
        player = await PlayerMaster.findOne({ where: { Mobile: normalizedPhone } });
    }
    const photoUrl = photoFile ? `/uploads/players/${photoFile.filename}` : null;

    if (!player) {
        player = await PlayerMaster.create({
            UserID: user.UserID,
            Name: playerName,
            FatherName: fatherName,
            Mobile: normalizedPhone,
            Role: role || 'Batsman',
            BattingStyle: battingStyle || 'Right-hand bat',
            BowlingStyle: bowlingStyle || 'Right-arm medium',
            JerseySize: jerseySize || 'M',
            PhotoURL: photoUrl,
            Status: 'active' // auto-active for simplicity
        });
    } else {
        player.UserID = player.UserID || user.UserID;
        player.Name = player.Name || playerName;
        player.FatherName = player.FatherName || fatherName;
        player.Mobile = player.Mobile || normalizedPhone;
        player.Role = player.Role || role || 'Batsman';
        player.BattingStyle = player.BattingStyle || battingStyle || 'Right-hand bat';
        player.BowlingStyle = player.BowlingStyle || bowlingStyle || 'Right-arm medium';
        player.JerseySize = jerseySize || player.JerseySize || 'M';
        if (photoUrl) {
            player.PhotoURL = photoUrl;
        }
        await player.save();
    }

    // Map to AuctionPlayers
    const alreadyRegistered = await AuctionPlayer.findOne({
        where: { SessionID: sessionId, PlayerID: player.PlayerID }
    });

    if (alreadyRegistered) {
        throw new ApiError(HTTP.BAD_REQUEST, 'Player is already registered for this auction.');
    }

    const auctionPlayer = await AuctionPlayer.create({
        SessionID: sessionId,
        PlayerID: player.PlayerID,
        BasePrice: basePrice || 100,
        Status: 'available'
    });

    return { user, player, auctionPlayer };
};

/**
 * Get all pending owners for admin review
 */
const getPendingOwners = async () => {
    return await Owner.findAll({
        where: { VerificationStatus: 'pending' },
        include: [
            { model: User, as: 'User', attributes: ['Email'] },
            { model: TeamMaster, as: 'Team' },
            { model: Payment, as: 'Payments', limit: 1, order: [['createdAt', 'DESC']] }
        ],
        order: [['CreatedAt', 'DESC']]
    });
};

/**
 * Admin verifies/approves owner registration
 */
const verifyOwner = async (ownerId, status) => {
    if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Invalid verification status');
    }

    const owner = await Owner.findByPk(ownerId);
    if (!owner) {
        throw new Error('Owner record not found');
    }

    owner.VerificationStatus = status;

    // As per user request, skip payment flow for now
    // If approved, ensure the owner has an associated team. If missing, create a default team.
    if (status === 'approved') {
        // Ensure fee status is marked paid per user request.
        owner.FeePaymentStatus = 'paid';

        // Auto-create a default team if owner lacks TeamID.
        if (!owner.TeamID) {
            // Create a placeholder team name using owner's full name or a generic identifier.
            const defaultTeamName = owner.FullName ? `${owner.FullName}'s Team` : `Team${owner.OwnerID}`;
            const newTeam = await TeamMaster.create({
                Name: defaultTeamName,
                OwnerName: owner.FullName || 'Owner',
                Contact: owner.ContactNumber || '',
                Location: '',
                Slogan: ''
            });
            // Update owner with the newly created TeamID.
            owner.TeamID = newTeam.TeamID;
            await owner.save();
        }
    }

    await owner.save();

    // ── Auto-assign team to nearest upcoming auction session ──
    // ── Auto-assign team to nearest upcoming auction session ──
    let assignedSession = null;
    if (status === 'approved' && owner.TeamID) {
        try {
            const requestedSession = owner.RequestedSessionID
                ? await AuctionSession.findByPk(owner.RequestedSessionID)
                : null;
            const upcomingSession = requestedSession || await AuctionSession.findOne({
                where: {
                    Status: 'upcoming',
                    StartDate: { [Op.gte]: new Date() }
                },
                order: [['StartDate', 'ASC']]
            });

            if (upcomingSession) {
                // Check if already registered
                const alreadyRegistered = await AuctionTeam.findOne({
                    where: { SessionID: upcomingSession.SessionID, TeamID: owner.TeamID }
                });

                if (!alreadyRegistered) {
                    await AuctionTeam.create({
                        SessionID: upcomingSession.SessionID,
                        TeamID: owner.TeamID,
                        Budget: upcomingSession.MaxBudget,
                        RemainingBudget: upcomingSession.MaxBudget,
                        PlayersCount: 0
                    });
                    assignedSession = upcomingSession;
                }
            }
        } catch (err) {
            console.error('Auto-assign to session failed (non-critical):', err.message);
        }
    }


    return { owner, assignedSession };
};

module.exports = {
    submitOwnerFee,
    getPendingPayments,
    verifyPayment,
    submitPlayerDocs,
    getPendingPlayers,
    verifyPlayer,
    registerTeam,
    registerPlayerForAuction,
    getPendingOwners,
    verifyOwner
};
