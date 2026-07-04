const { User, Owner, PlayerMaster, Member } = require('../models');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const buildPayload = (user) => ({
    userId: user.UserID,
    email: user.Email,
    role: user.Role,
    ownerProfile: user.OwnerProfile || null,
    memberProfile: user.MemberProfile || null,
    playerProfile: user.PlayerProfile || null
});

/**
 * Handle user registration
 */
const handleRegister = async (userData) => {
    const { email, password, role, fullName, contactNumber, fatherName } = userData;

    // Check if email already registered
    const existingUser = await User.findOne({ where: { Email: email } });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User record
    const user = await User.create({
        Email: email,
        PasswordHash: passwordHash,
        Role: role
    });

    // Handle role specific profile creations
    if (role === 'owner') {
        await Owner.create({
            UserID: user.UserID,
            FullName: fullName || 'New Owner',
            ContactNumber: contactNumber || null,
            VerificationStatus: 'pending',
            FeePaymentStatus: 'unpaid'
        });
    } else if (role === 'player') {
        // PlayerMaster has some strict non-null fields
        await PlayerMaster.create({
            UserID: user.UserID,
            Name: fullName || 'New Player',
            FatherName: fatherName || 'Pending',
            Mobile: contactNumber || `0000000_${user.UserID}`,
            Email: email,
            Status: 'pending'
        });
    } else if (role === 'member') {
        await Member.create({
            UserID: user.UserID,
            FullName: fullName || 'New Member',
            ContactNumber: contactNumber || null,
            VerificationStatus: 'pending'
        });
    }

    return {
        userId: user.UserID,
        email: user.Email,
        role: user.Role
    };
};

/**
 * Handle user login
 */
const handleLogin = async (credentials) => {
    const { email, password } = credentials; // 'email' can be either email or phone

    // Try to find user by email first
    let user = await User.findOne({ 
        where: { Email: email },
        include: [
            { model: Owner, as: 'OwnerProfile' },
            { model: Member, as: 'MemberProfile' }
        ]
    });

    // If not found by email, try by contact number across profiles
    if (!user) {
        // Check Owner
        const owner = await Owner.findOne({ 
            where: { ContactNumber: email },
            include: [{ model: User, as: 'User' }]
        });
        if (owner) {
            user = owner.User;
            user.OwnerProfile = owner;
        }
    }

    if (!user) {
        // Check Player
        const player = await PlayerMaster.findOne({
            where: { Mobile: email }
        });
        if (player) {
            user = await User.findByPk(player.UserID, {
                include: [
                    { model: Owner, as: 'OwnerProfile' },
                    { model: Member, as: 'MemberProfile' }
                ]
            });
        }
    }

    if (!user) {
        // Check Member
        const member = await Member.findOne({
            where: { ContactNumber: email },
            include: [{ model: User, as: 'User' }]
        });
        if (member) {
            user = member.User;
            user.MemberProfile = member;
        }
    }

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // --- Owner Approval Check ---
    if (user.Role === 'owner') {
        const ownerProfile = await Owner.findOne({ where: { UserID: user.UserID } });
        if (!ownerProfile) {
            throw new Error('Owner profile missing.');
        }
        if (ownerProfile.VerificationStatus === 'pending') {
            throw new Error('Your team registration is pending admin approval.');
        }
        if (ownerProfile.VerificationStatus === 'rejected') {
            throw new Error('Your team registration was rejected by admin.');
        }
        user.OwnerProfile = ownerProfile;
    }

    // --- Member Approval Check ---
    if (user.Role === 'member') {
        const memberProfile = await Member.findOne({ where: { UserID: user.UserID } });
        if (!memberProfile) {
            throw new Error('Member profile missing.');
        }
        if (memberProfile.VerificationStatus === 'pending') {
            throw new Error('Your registration is pending admin approval.');
        }
        if (memberProfile.VerificationStatus === 'rejected') {
            throw new Error('Your registration was rejected by admin.');
        }
        user.MemberProfile = memberProfile;
    }

    const payload = buildPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return { payload, accessToken, refreshToken };
};

/**
 * Handle refresh token
 */
const handleRefreshToken = async (token) => {
    try {
        const decoded = verifyRefreshToken(token);
        let user = await User.findByPk(decoded.userId, {
            include: [
                { model: Owner, as: 'OwnerProfile' },
                { model: Member, as: 'MemberProfile' },
                { model: PlayerMaster, as: 'PlayerProfile' }
            ]
        });
        
        if (!user) {
            throw new Error('User not found');
        }

        // Re-check approval status on refresh
        if (user.Role === 'owner') {
            const ownerProfile = await Owner.findOne({ where: { UserID: user.UserID } });
            if (!ownerProfile || ownerProfile.VerificationStatus !== 'approved') {
                throw new Error('Account no longer active.');
            }
            user.OwnerProfile = ownerProfile;
        }

        if (user.Role === 'member') {
            const memberProfile = await Member.findOne({ where: { UserID: user.UserID } });
            if (!memberProfile || memberProfile.VerificationStatus !== 'approved') {
                throw new Error('Account no longer active.');
            }
            user.MemberProfile = memberProfile;
        }

        const payload = buildPayload(user);
        const accessToken = generateAccessToken(payload);
        return { accessToken, user: payload };
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

module.exports = {
    handleRegister,
    handleLogin,
    handleRefreshToken
};