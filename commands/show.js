const Summoner = require('../models/summoners');
const { championIdToName, fetchChampionData } = require('../utils/championIdToName');

module.exports = {
    name: 'show',
    description: 'Show your current real rank and other information',
    async execute(client, interaction) {
        await fetchChampionData(); // Ensure champion data is fetched and mapped before listing members
        try {
            const summoner = await Summoner.findOne({ discordId: interaction.user.id });
            if (!summoner) {
                interaction.reply('You are not registered yet. Use the !register command to register.');
                return;
            }

            const topChampions = summoner.masteryData.slice(0, 3).map(champion => 
                `${championIdToName[champion.championId.toString()] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');

            const embed = {
                color: 0x0099ff,
                title: '🧑‍🚀 Your Summoner Info 🧑‍🚀',
                fields: [
                    { name: 'Summoner Name', value: `${summoner.gameName}#${summoner.tagLine}`, inline: true },
                    { name: 'Most Played Lane Recently', value: summoner.sortedLanes[0] || 'undefined', inline: true },
                    { name: 'Highest Rank', value: summoner.highestRank || 'Unranked', inline: true },
                    { name: 'Top Champions', value: topChampions, inline: false },
                    { name: 'Recent Win Rate', value: `${summoner.winRate}%`, inline: true },
                    { name: 'Real Rank ID', value: summoner.realRank.toString(), inline: true },
                ],
            };

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching summoner data:', error.message);
            interaction.reply('An error occurred while fetching your summoner data. Please try again later.');
        }
    }
};