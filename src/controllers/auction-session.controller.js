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

exports.getSessionById = async (req, res) => {

  const { id } = req.params;

  const sessions = await auctionService.getAuctionSessionById(id);

  if (!sessions) {
    return response.success(res, MSG.AUCTIONSESSION.NOT_FOUND, {}, HTTP.NOT_FOUND);
  }

  return response.success(res, MSG.AUCTIONSESSION.FETCH_SUCCESS, { sessions });
};

exports.createSession = async (req, res) => {

  const sessions = await auctionService.createAuctionSession(req.body);

  return response.success(res, MSG.AUCTIONSESSION.CREATED, { sessions }, HTTP.CREATED);

};

exports.updateSession = async (req, res) => {

  const { id } = req.params;

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
