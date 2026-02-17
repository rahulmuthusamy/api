const { Match, TeamMaster, Tournament } = require('../models');

/**
 * Generate fixtures for a tournament based on its format
 */
exports.generateFixtures = async (tournamentId) => {
    const tournament = await Tournament.findByPk(tournamentId, {
        include: [{ model: TeamMaster, as: 'Teams' }]
    });

    if (!tournament) {
        throw new Error('Tournament not found');
    }

    const teams = tournament.Teams;
    if (teams.length < tournament.MinTeams) {
        throw new Error(`Minimum ${tournament.MinTeams} teams required`);
    }

    let fixtures = [];

    switch (tournament.Type) {
        case 'League':
            fixtures = await generateLeagueFixtures(tournament, teams);
            break;
        case 'Knockout':
            fixtures = await generateKnockoutFixtures(tournament, teams);
            break;
        case 'Hybrid':
            fixtures = await generateHybridFixtures(tournament, teams);
            break;
        default:
            throw new Error('Invalid tournament type');
    }

    return fixtures;
};

/**
 * Generate round-robin league fixtures
 */
async function generateLeagueFixtures(tournament, teams) {
    const fixtures = [];
    const teamCount = teams.length;
    let matchNumber = 1;

    // Round-robin algorithm
    for (let round = 0; round < teamCount - 1; round++) {
        for (let match = 0; match < teamCount / 2; match++) {
            const home = (round + match) % (teamCount - 1);
            const away = (teamCount - 1 - match + round) % (teamCount - 1);

            // Last team stays in place
            const teamA = match === 0 ? teams[teamCount - 1] : teams[home];
            const teamB = teams[away];

            const matchData = {
                TournamentID: tournament.TournamentID,
                MatchNumber: matchNumber++,
                TeamA_ID: teamA.TeamID,
                TeamB_ID: teamB.TeamID,
                MatchType: 'League',
                RoundNumber: round + 1,
                MatchFormat: tournament.MatchFormat,
                OversPerSide: tournament.OversPerMatch,
                BallsPerOver: tournament.BallsPerOver,
                PowerplayOvers: tournament.PowerplayOvers,
                Status: 'Scheduled'
            };

            const createdMatch = await Match.create(matchData);
            fixtures.push(createdMatch);
        }
    }

    return fixtures;
}

/**
 * Generate knockout bracket fixtures
 */
async function generateKnockoutFixtures(tournament, teams) {
    const fixtures = [];
    let teamCount = teams.length;

    // Ensure power of 2 for knockout
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(teamCount)));
    const byeCount = nextPowerOf2 - teamCount;

    let matchNumber = 1;
    let currentRound = teams.slice();

    // Determine round type based on team count
    const getRoundType = (teamsInRound) => {
        if (teamsInRound === 2) return 'Final';
        if (teamsInRound === 4) return 'SemiFinal';
        if (teamsInRound === 8) return 'QuarterFinal';
        if (teamsInRound === 16) return 'Round16';
        return 'Group';
    };

    // First round with byes
    for (let i = 0; i < teamCount - byeCount; i += 2) {
        const matchData = {
            TournamentID: tournament.TournamentID,
            MatchNumber: matchNumber++,
            TeamA_ID: currentRound[i].TeamID,
            TeamB_ID: currentRound[i + 1].TeamID,
            MatchType: getRoundType(nextPowerOf2),
            MatchFormat: tournament.MatchFormat,
            OversPerSide: tournament.OversPerMatch,
            BallsPerOver: tournament.BallsPerOver,
            PowerplayOvers: tournament.PowerplayOvers,
            Status: 'Scheduled'
        };

        const createdMatch = await Match.create(matchData);
        fixtures.push(createdMatch);
    }

    return fixtures;
}

/**
 * Generate hybrid (group + knockout) fixtures
 */
async function generateHybridFixtures(tournament, teams) {
    const fixtures = [];
    const groupCount = tournament.GroupCount || 2;
    const teamsPerGroup = Math.ceil(teams.length / groupCount);

    // Divide teams into groups
    const groups = [];
    for (let i = 0; i < groupCount; i++) {
        const groupTeams = teams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
        if (groupTeams.length > 0) {
            groups.push({
                name: String.fromCharCode(65 + i), // A, B, C, etc.
                teams: groupTeams
            });
        }
    }

    let matchNumber = 1;

    // Generate group stage matches (round-robin within each group)
    for (const group of groups) {
        const groupTeams = group.teams;
        const teamCount = groupTeams.length;

        for (let i = 0; i < teamCount; i++) {
            for (let j = i + 1; j < teamCount; j++) {
                const matchData = {
                    TournamentID: tournament.TournamentID,
                    MatchNumber: matchNumber++,
                    TeamA_ID: groupTeams[i].TeamID,
                    TeamB_ID: groupTeams[j].TeamID,
                    MatchType: 'Group',
                    GroupName: `Group ${group.name}`,
                    MatchFormat: tournament.MatchFormat,
                    OversPerSide: tournament.OversPerMatch,
                    BallsPerOver: tournament.BallsPerOver,
                    PowerplayOvers: tournament.PowerplayOvers,
                    Status: 'Scheduled'
                };

                const createdMatch = await Match.create(matchData);
                fixtures.push(createdMatch);
            }
        }
    }

    // Note: Knockout stage fixtures will be generated after group stage completion
    // based on final standings

    return fixtures;
}

/**
 * Assign venues to fixtures
 */
exports.assignVenues = async (matchIds, venues) => {
    const matches = await Match.findAll({
        where: { MatchID: matchIds }
    });

    for (let i = 0; i < matches.length; i++) {
        const venue = venues[i % venues.length]; // Rotate through venues
        await matches[i].update({ Venue: venue });
    }

    return matches;
};

/**
 * Assign dates to fixtures
 */
exports.assignDates = async (matchIds, startDate, matchesPerDay = 2) => {
    const matches = await Match.findAll({
        where: { MatchID: matchIds },
        order: [['MatchNumber', 'ASC']]
    });

    let currentDate = new Date(startDate);
    let matchesScheduledToday = 0;

    for (const match of matches) {
        await match.update({ MatchDate: new Date(currentDate) });

        matchesScheduledToday++;
        if (matchesScheduledToday >= matchesPerDay) {
            currentDate.setDate(currentDate.getDate() + 1);
            matchesScheduledToday = 0;
        }
    }

    return matches;
};
