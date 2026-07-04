const auctionService = require('../services/auction-session.service');
const response = require('../utils/response');
const MSG = require('../utils/messages');
const HTTP = require('../utils/httpStatusCodes');

exports.getAllSessions = async (req, res) => {

  const sessions = await auctionService.getAllAuctionSessions();

  if (!sessions.length) {
    return response.success(res, MSG.AUCTIONSESSION.NOT_FOUND, { sessions }, HTTP.NOT_FOUND);
  }

  return response.success(res, MSG.AUCTIONSESSION.FETCH_SUCCESS, { sessions });
};

exports.getUpcomingSessions = async (req, res) => {

  const rawSessions = await auctionService.getUpcomingAuctionSessions();

  const sessions = rawSessions.map(s => {
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

  if (!sessions.length) {
    return response.success(res, MSG.AUCTIONSESSION.NOT_FOUND, { sessions }, HTTP.NOT_FOUND);
  }

  return response.success(res, MSG.AUCTIONSESSION.FETCH_SUCCESS, { sessions });
};

exports.getSessionById = async (req, res) => {

  const { id } = req.params;

  const sessions = await auctionService.getAuctionSessionById(id);

  if (!sessions) {
    return response.success(res, MSG.AUCTIONSESSION.NOT_FOUND, {}, HTTP.NOT_FOUND);
  }

  return response.success(res, MSG.AUCTIONSESSION.FETCH_SUCCESS, { sessions });
};

exports.createSession = async (req, res) => {
  if (req.file) {
    req.body.UPIScannerImageURL = `/uploads/qr/${req.file.filename}`;
  }
  const sessions = await auctionService.createAuctionSession(req.body);

  return response.success(res, MSG.AUCTIONSESSION.CREATED, { sessions }, HTTP.CREATED);
};

exports.updateSession = async (req, res) => {
  const { id } = req.params;
  if (req.file) {
    req.body.UPIScannerImageURL = `/uploads/qr/${req.file.filename}`;
  }
  const updated = await auctionService.updateAuctionSession(id, req.body);

  if (!updated) {
    return response.success(res, MSG.AUCTIONSESSION.NOT_FOUND, {}, HTTP.NOT_FOUND);
  }

  return response.success(res, MSG.AUCTIONSESSION.UPDATED, { sessions: updated });
};

exports.deleteSession = async (req, res) => {

  const { id } = req.params;

  if (!id) {
    return response.error(res, { message: MSG.AUCTIONSESSION.MISSINGID })
  }
  const deleted = await auctionService.deleteAuctionSession(id);

  if (!deleted) {
    return response.success(res, MSG.AUCTIONSESSION.NOT_FOUND, {}, HTTP.NOT_FOUND);
  }

  return response.success(res, MSG.AUCTIONSESSION.DELETED, { deletedCount: deleted });
};
