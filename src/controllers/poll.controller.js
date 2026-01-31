const pollService = require('../services/poll.service');
const response = require('../utils/response');
const HTTP = require('../utils/httpStatusCodes');

exports.getPolls = async (req, res) => {
    let player = { id: 15 };
    const data = await pollService.getPolls(player);
    return response.success(res, "Polls fetched successfully", { polls: data });
};

exports.createPoll = async (req, res) => {
    const data = await pollService.createPoll(req.body);
    return response.success(res, "Poll created successfully", { poll: data }, HTTP.CREATED);
};

exports.vote = async (req, res) => {
    try {
        const { pollId, optionId } = req.params;
        const { playerId } = req.body;

        if (!playerId) return response.error(res, { message: "Player ID is required to vote" }, HTTP.BAD_REQUEST);

        const data = await pollService.vote(pollId, optionId, playerId);
        return response.success(res, "Vote recorded successfully", { poll: data });
    } catch (err) {
        return response.error(res, { message: err.message }, HTTP.BAD_REQUEST);
    }
};

exports.toggleStatus = async (req, res) => {
    const data = await pollService.togglePollStatus(req.params.id);
    if (!data) return response.error(res, { message: "Poll not found" }, HTTP.NOT_FOUND);
    return response.success(res, "Poll status toggled", { poll: data });
};

exports.deletePoll = async (req, res) => {
    const success = await pollService.deletePoll(req.params.id);
    if (!success) return response.error(res, { message: "Poll not found" }, HTTP.NOT_FOUND);
    return response.success(res, "Poll deleted successfully");
};
