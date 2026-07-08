const settingsService = require('../services/settings.service');
const auctionService = require('../services/auction-session.service');
const matchService = require('../services/match.service');
const { PlayerMaster, AuctionPlayer, TeamMaster, Owner } = require('../models');
const response = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

exports.getWebsiteInitData = asyncHandler(async (req, res) => {

    // Run all queries in parallel for performance
    const [
        appSettings,
        carousel,
        sponsors,
        gallery,
        auctionSessions,
        matches,
        locations,
        allPlayers,
        allTeams,
        allOwners
    ] = await Promise.all([
        settingsService.getAppSettings(),
        settingsService.getAllCarousel(),
        settingsService.getAllSponsors(),
        settingsService.getAllGallery(),
        auctionService.getUpcomingAuctionSessions(),
        matchService.getAllMatches({}),
        settingsService.getActiveLocations(),
        // Fetch players with their auction registration entries
        PlayerMaster.findAll({
            include: [{
                model: AuctionPlayer,
                as: 'AuctionEntries',
                required: false,
                attributes: ['AuctionPlayerID', 'PaymentStatus', 'ApprovalStatus', 'SessionID']
            }]
        }),
        // Fetch all teams
        TeamMaster.findAll(),
        // Fetch all owners (Owner.TeamID links to TeamMaster)
        Owner.findAll({ attributes: ['OwnerID', 'TeamID', 'FeePaymentStatus'] })
    ]);

    // ─── Filter Players ────────────────────────────────────────────────────────
    // Show player if:
    //   - No auction entries (directly created by admin), OR
    //   - Has at least one auction entry where PaymentStatus === 'paid'
    const validPlayers = allPlayers.filter(p => {
        const entries = p.AuctionEntries || [];
        if (entries.length === 0) return true; // direct creation
        return entries.some(e => e.PaymentStatus === 'paid');
    });

    // ─── Filter Teams ──────────────────────────────────────────────────────────
    // Show team if:
    //   - No owner linked to this team, OR
    //   - Has at least one owner with FeePaymentStatus === 'paid'
    const ownersByTeam = {};
    allOwners.forEach(o => {
        if (!o.TeamID) return;
        if (!ownersByTeam[o.TeamID]) ownersByTeam[o.TeamID] = [];
        ownersByTeam[o.TeamID].push(o);
    });

    const validTeams = allTeams.filter(t => {
        const teamOwners = ownersByTeam[t.TeamID] || [];
        if (teamOwners.length === 0) return true; // directly created team
        return teamOwners.some(o => o.FeePaymentStatus === 'paid');
    });

    // ─── Format Auction Sessions ───────────────────────────────────────────────
    const formattedSessions = auctionSessions.map(s => {
        const registeredTeams = (s.AuctionTeams || []).map(at => ({
            teamId: at.TeamID,
            name: at.TeamMaster?.Name,
            logoUrl: at.TeamMaster?.LogoURL,
            location: at.TeamMaster?.Location,
        }));

        return {
            SessionID: s.SessionID,
            Name: s.Name,
            Status: s.Status,
            Year: s.Year,
            MaxBudget: s.MaxBudget,
            MaxPlayersPerTeam: s.MaxPlayersPerTeam,
            StartDate: s.StartDate,
            EndDate: s.EndDate,
            Notes: s.Notes,
            PlayerRegistrationFee: s.PlayerRegistrationFee,
            OwnerRegistrationFee: s.OwnerRegistrationFee,
            UPIScannerImageURL: s.UPIScannerImageURL,
            UPIName: s.UPIName,
            UPIId: s.UPIId,
            registeredTeams,
            registeredTeamCount: registeredTeams.length
        };
    });

    return response.success(res, 'Website data initialized successfully', {
        appSettings,
        carousel,
        sponsors,
        gallery,
        auctionSessions: formattedSessions,
        matches,
        locations,
        players: validPlayers,
        teams: validTeams
    });
});
