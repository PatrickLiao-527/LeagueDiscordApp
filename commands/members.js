const Summoner = require('../models/summoners');
const { championIdToName, fetchChampionData } = require('../utils/championIdToName');

module.exports = {
    name: 'members',
    description: 'List all registered summoners',
    async execute(interaction) {
        await fetchChampionData(); // Ensure champion data is fetched and mapped before listing members
        const summoners = await Summoner.find({});
        if (summoners.length === 0) {
            await interaction.reply('No registered summoners.');
        } else {
            const embeds = [];
            let description = '';

            summoners.forEach(summoner => {
                const gameName = summoner.gameName || 'Unknown';
                const tagLine = summoner.tagLine || 'Unknown';
                const sortedLanes = summoner.sortedLanes && summoner.sortedLanes.length > 0 ? summoner.sortedLanes.join(', ') : 'undefined';
                const realRank = summoner.realRank !== undefined ? Math.round(summoner.realRank).toString() : 'N/A';
                const topChampions = summoner.masteryData && summoner.masteryData.length > 0 ? 
                    summoner.masteryData.slice(0, 3).map(champion => 
                        `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`
                    ).join(', ') : 'No data';

                const memberInfo = `🧑‍🚀 **${gameName}#${tagLine}**\n**Lane:** ${sortedLanes}\n**Real rank:** ${realRank}\n**Top Champions:** ${topChampions}\n\n`;

                if (description.length + memberInfo.length > 2048) {
                    embeds.push({ description });
                    description = '';
                }

                description += memberInfo;
            });

            if (description.length > 0) {
                embeds.push({ description });
            }

            // Send the initial response with the first embed
            await interaction.reply({ embeds: [embeds.shift()] });

            // Follow up with any additional embeds
            for (const embed of embeds) {
                await interaction.followUp({ embeds: [embed] });
            }
        }
    }
};
