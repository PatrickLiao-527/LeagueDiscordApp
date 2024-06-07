const axios = require('axios');
const Summoner = require('../models/summoners');
const {
    calculateWinRate,
    fetchSummonerData,
    fetchSummonerRank,
    fetchTopChampions,
    fetchMatchIds,
    fetchLaneCounts,
    calculateParticipantSkillScore,
    fetchSummonerByPuuid
} = require('../utils/riotAPIUtils');
const championIdToName = require('../utils/championIdToName');
const riotApiKey = process.env.RIOT_API_KEY;

module.exports = async (client, message) => {
    const existingSummoner = await Summoner.findOne({ discordId: message.author.id });
    if (existingSummoner) {
        message.channel.send(`You are already registered as ${existingSummoner.gameName}#${existingSummoner.tagLine}. Use !remove to delete your information.`);
        return;
    }

    message.channel.send('Please enter the lane you want to play [Top, Jg, Mid, Bot, Sup]:');

    const filter = m => m.author.id === message.author.id;
    const laneCollector = message.channel.createMessageCollector({ filter, max: 1, time: 30000 });

    laneCollector.on('collect', m => {
        const lane = m.content.trim().toLowerCase();
        const validLanes = ['top', 'jg', 'mid', 'bot', 'sup'];

        if (!validLanes.includes(lane)) {
            message.channel.send('Invalid lane. Please enter one of the following lanes: [Top, Jg, Mid, Bot, Sup]');
            return;
        }

        message.channel.send('Please enter your summoner name and tagline in the format gameName#tagLine:');

        const summonerCollector = message.channel.createMessageCollector({ filter, max: 1, time: 60000 });

        summonerCollector.on('collect', async m => {
            const [gameName, tagLine] = m.content.split('#');

            if (!gameName || !tagLine) {
                message.channel.send('Invalid format. Please enter your summoner name and tagline in the format gameName#tagLine.');
                return;
            }

            message.channel.send(`🔍 Fetching your data, please wait... 🕵️‍♂️`);

            try {
                console.log(`Fetching summoner data for ${gameName}#${tagLine}`);
                const summonerData = await fetchSummonerData(gameName, tagLine);
                const puuid = summonerData.puuid;

                console.log(`Fetching summoner by PUUID: ${puuid}`);
                const summonerByPuuid = await fetchSummonerByPuuid(puuid);
                const summonerId = summonerByPuuid.id;

                const summonerRank = await fetchSummonerRank(summonerId);
                const masteryData = await fetchTopChampions(puuid);
                const matchIds = await fetchMatchIds(puuid);
                const laneCounts = await fetchLaneCounts(matchIds, puuid);
                const winRate = await calculateWinRate(matchIds, puuid);

                let realRank = 0;
                let count = 0;
                for (const matchId of matchIds) {
                    const matchDetailsResponse = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`, {
                        headers: {
                            'X-Riot-Token': riotApiKey
                        }
                    });
                    const matchDetails = matchDetailsResponse.data;
                    const matchParticipants = matchDetails.info.participants;

                    for (const participant of matchParticipants) {
                        const participantRank = await fetchSummonerRank(participant.summonerId);
                        if (participantRank !== 'Unranked') {
                            realRank += calculateParticipantSkillScore(participantRank);
                            count += 1;
                        }
                    }
                }
                realRank = realRank / count;

                const sortedLanes = Object.entries(laneCounts).sort(([, a], [, b]) => b - a).map(([lane]) => lane).slice(0, 5);

                const championList = masteryData.map(champion => `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');

                const summoner = new Summoner({
                    discordId: message.author.id,
                    discordTag: message.author.tag,
                    gameName,
                    tagLine,
                    puuid,
                    lane,
                    masteryData,
                    sortedLanes,
                    highestRank: summonerRank,
                    winRate,
                    realRank
                });

                await summoner.save();

                message.channel.send(`🎉 **Registration Complete!** 🎉\n\n**Discord:** ${message.author.username}\n**Lane:** ${lane}\n**Summoner Name:** ${gameName}#${tagLine}\n**Top Champions:** ${championList}\n**Top Lanes:** ${sortedLanes.join(', ')}\n**Highest Rank:** ${summonerRank}`);
            } catch (error) {
                console.error('Error fetching data from Riot API:', error.response ? error.response.data : error.message);
                message.channel.send(`Failed to fetch summoner data for ${gameName}#${tagLine}: ${error.response ? error.response.data.status.message : error.message}`);
            }
        });

        summonerCollector.on('end', collected => {
            if (collected.size === 0) {
                message.channel.send('You did not enter your summoner name in time.');
            }
        });
    });

    laneCollector.on('end', collected => {
        if (collected.size === 0) {
            message.channel.send('You did not enter your lane in time.');
        }
    });
};
