const Summoner = require('../models/summoners');
const { championIdToName, fetchChampionData } = require('../utils/championIdToName');

module.exports = {
    name: 'show',
    description: 'Show your current real rank and other information',
    async execute(interaction) {
        await fetchChampionData(); // Ensure champion data is fetched and mapped before listing members
        try {
            const summoner = await Summoner.findOne({ discordId: interaction.user.id });
            if (!summoner) {
                await interaction.reply('You are not registered yet. Use the /register command to register.');
                return;
            }

            const gameName = summoner.gameName || 'Unknown';
            const tagLine = summoner.tagLine || 'Unknown';
            const sortedLanes = summoner.sortedLanes && summoner.sortedLanes.length > 0 ? summoner.sortedLanes[0] : 'undefined';
            const highestRank = summoner.highestRank || 'Unranked';
            const winRate = summoner.winRate !== undefined ? `${summoner.winRate}%` : 'N/A';
            const realRank = summoner.realRank !== undefined ? Math.round(summoner.realRank).toString() : 'N/A';
            const bias = summoner.bias !== undefined ? summoner.bias.toString() : 'No Bias';
            const skillScore = summoner.skillScore !== undefined ? Math.round(summoner.skillScore).toString() : 'N/A';
            const topChampions = summoner.masteryData && summoner.masteryData.length > 0 ? 
                summoner.masteryData.slice(0, 3).map(champion => 
                    `${championIdToName[champion.championId.toString()] || 'Unknown Champion'} [Level ${champion.championLevel}]`
                ).join(', ') : 'No data';

            const embed = {
                color: 0x0099ff,
                title: '🧑‍🚀 Your Summoner Info 🧑‍🚀',
                fields: [
                    { name: 'Summoner Name', value: `${gameName}#${tagLine}`, inline: true },
                    { name: 'Most Played Lane Recently', value: sortedLanes, inline: true },
                    { name: 'Highest Rank', value: highestRank, inline: true },
                    { name: 'Top Champions', value: topChampions, inline: false },
                    { name: 'Recent Win Rate', value: winRate, inline: true },
                    { name: 'Real Rank', value: realRank, inline: true },
                    { name: 'Bias Level', value: bias, inline: true },
                    { name: 'Current Skill Score', value: skillScore, inline: true }
                ],
            };

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching summoner data:', error.message);
            await interaction.reply('An error occurred while fetching your summoner data. Please try again later.');
        }
    }
};
