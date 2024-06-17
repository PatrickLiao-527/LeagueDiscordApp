const Summoner = require('../models/summoners');
const { fetchLaneCounts, fetchMatchIds, fetchTopChampions } = require('../utils/riotAPIUtils');
const axios = require('axios');
const riotApiKey = process.env.RIOT_API_KEY;

const updateSortedLanesAndMasteryScoreForSummoner = async (summoner) => {
    try {
        const matchIds = await fetchMatchIds(summoner.puuid);
        console.log(`Match IDs for ${summoner.puuid}:`, matchIds);  // Log match IDs

        const laneCounts = await fetchLaneCounts(matchIds, summoner.puuid);
        console.log(`Lane Counts for ${summoner.puuid}:`, laneCounts);  // Log lane counts

        const sortedLanes = [
            laneCounts[0] || 0, // top
            laneCounts[1] || 0, // jungle
            laneCounts[2] || 0, // middle
            laneCounts[3] || 0, // bottom
            laneCounts[4] || 0  // utility
        ];
        console.log(`Sorted Lanes for ${summoner.puuid}:`, sortedLanes);  // Log sorted lanes

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
            console.log(`Mastery Data for ${summoner.puuid}:`, masteryData);  // Log mastery data
            console.log(`Mastery Score for ${summoner.puuid}:`, masteryScore.data);  // Log mastery score
        }

        await summoner.save();
        console.log(`Summoner ${summoner.puuid} saved successfully.`);
    } catch (error) {
        console.error(`Error updating summoner ${summoner.puuid}:`, error);
    }
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
