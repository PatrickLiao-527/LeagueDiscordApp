const Summoner = require('../models/summoners');
const { fetchLaneCounts, fetchMatchIds, fetchTopChampions } = require('../utils/riotAPIUtils');
const axios = require('axios');
const riotApiKey = process.env.RIOT_API_KEY;

const updateSortedLanesAndMasteryScoreForSummoner = async (summoner) => {
    const matchIds = await fetchMatchIds(summoner.puuid);
    const laneCounts = await fetchLaneCounts(matchIds, summoner.puuid);
    const sortedLanes = [
        laneCounts.top || 0,
        laneCounts.jungle || 0,
        laneCounts.middle || 0,
        laneCounts.bottom || 0,
        laneCounts.utility || 0
    ];

    summoner.sortedLanes = sortedLanes;

    if (!summoner.masteryScore) {
        const masteryData = await fetchTopChampions(summoner.puuid);
        const masteryScore = await axios.get(`https://na1.api.riotgames.com/lol/champion-mastery/v4/scores/by-puuid/${summoner.puuid}`, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        summoner.masteryData = masteryData;
        summoner.masteryScore = masteryScore.data;
    }

    await summoner.save();
};

module.exports = {
    name: 'update_sorted_lanes',
    description: 'Update the sortedLanes and masteryScore field for all summoners in the database.',
    async execute(interaction) {
        try {
            const summoners = await Summoner.find({});
            for (const summoner of summoners) {
                await updateSortedLanesAndMasteryScoreForSummoner(summoner);
            }
            await interaction.reply('Updated sortedLanes and masteryScore for all summoners.');
        } catch (error) {
            console.error('Error updating sortedLanes and masteryScore:', error);
            await interaction.reply('Failed to update sortedLanes and masteryScore for summoners.');
        }
    },
    async updateAllSummoners() {
        try {
            const summoners = await Summoner.find({});
            for (const summoner of summoners) {
                await updateSortedLanesAndMasteryScoreForSummoner(summoner);
            }
            console.log('Updated sortedLanes and masteryScore for all summoners.');
        } catch (error) {
            console.error('Error updating sortedLanes and masteryScore:', error);
        }
    }
};
