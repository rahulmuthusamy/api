const { Poll, PollOption, PollVote, PlayerMaster } = require('../models');

exports.getPolls = async (query = {}, playerId = 15) => {
    return await Poll.findAll({
        include: [
            { model: PollOption, as: 'options' },
            {
                model: PollVote,
                as: 'votes',
                // include: [{ model: PlayerMaster, attributes: ['id', 'FirstName', 'LastName'] }]
            }
        ],
        order: [['createdAt', 'DESC'], [{ model: PollOption, as: 'options' }, 'Order', 'ASC']]
    });
};

exports.createPoll = async (data) => {
    const { Question, Description, EndDate, options } = data;
    const poll = await Poll.create({ Question, Description, EndDate });

    if (options && options.length > 0) {
        const optionData = options.map((opt, index) => ({
            PollId: poll.id,
            OptionText: opt,
            Order: index
        }));
        await PollOption.bulkCreate(optionData);
    }

    return await Poll.findByPk(poll.id, { include: [{ model: PollOption, as: 'options' }] });
};

exports.vote = async (pollId, optionId, playerId) => {
    // 1. Check if player exists
    const player = await PlayerMaster.findByPk(playerId);
    if (!player) throw new Error("Only registered players can vote.");

    // 2. Check if player already voted for this poll
    const existingVote = await PollVote.findOne({ where: { PollId: pollId, PlayerId: playerId } });
    if (existingVote) throw new Error("You have already voted in this poll.");

    // 3. Record the vote
    const option = await PollOption.findOne({ where: { id: optionId, PollId: pollId } });
    if (!option) throw new Error("Option not found.");

    await PollVote.create({ PollId: pollId, OptionId: optionId, PlayerId: playerId });
    await option.increment('Votes');
    await Poll.increment('TotalVotes', { where: { id: pollId } });

    return await Poll.findByPk(pollId, {
        include: [
            { model: PollOption, as: 'options' },
            { model: PollVote, as: 'votes' }
        ]
    });
};

exports.deletePoll = async (id) => {
    const poll = await Poll.findByPk(id);
    if (!poll) return null;
    await poll.destroy();
    return true;
};

exports.togglePollStatus = async (id) => {
    const poll = await Poll.findByPk(id);
    if (!poll) return null;
    poll.IsActive = !poll.IsActive;
    await poll.save();
    return poll;
};
