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
const { championIdToName, fetchChampionData } = require('../utils/championIdToName');
const riotApiKey = process.env.RIOT_API_KEY;

let registerQueue = []; // Initialize the register queue
let registerInProgress = false; // Mutex lock for registration

const processRegistrationQueue = async () => {
    if (registerInProgress || registerQueue.length === 0) {
        return;
    }

    registerInProgress = true;
    const { interaction, lane, gameName, tagLine } = registerQueue.shift();

    try {
        await fetchChampionData(); // Fetch and map champion data

        console.log(`Fetching summoner data for ${gameName}#${tagLine}`);
        const summonerData = await fetchSummonerData(gameName, tagLine);
        const puuid = summonerData.puuid;

        console.log(`Fetching summoner by PUUID: ${puuid}`);
        const summonerByPuuid = await fetchSummonerByPuuid(puuid);
        const summonerId = summonerByPuuid.id;

        const summonerRank = await fetchSummonerRank(summonerId);
        const masteryData = await fetchTopChampions(puuid);
        const masteryScore = await axios.get(`https://na1.api.riotgames.com/lol/champion-mastery/v4/scores/by-puuid/${puuid}`, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
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
                if (!participantRank || participantRank === 'Unranked' || participantRank === 'undefined undefined') {
                    console.log('Participant rank is invalid or undefined. Data type:', typeof participantRank, participantRank);
                    console.log('Received data:', matchDetails);
                    continue;
                }
                realRank += calculateParticipantSkillScore(participantRank);
                count += 1;
            }
        }
        realRank = realRank / count;

        const sortedLanes = laneCounts;

        const championList = masteryData.map(champion => `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');

        function transferFunction1(x) {
            console.log(`transferFunction1 input: ${x}`);
            const result = (1 / (-x - 1) + 1) ** 2;
            console.log(`transferFunction1 output: ${result}`);
            return result;
        }

        const skillScore = realRank + transferFunction1(masteryScore.data / 100) * 20 + winRate / 10;

        const summoner = new Summoner({
            discordId: interaction.user.id,
            discordTag: interaction.user.tag,
            gameName,
            tagLine,
            puuid,
            lane,
            masteryData,
            masteryScore: masteryScore.data,
            sortedLanes,
            highestRank: summonerRank,
            winRate,
            realRank,
            skillScore
        });

        await summoner.save();

        await interaction.followUp(`🎉 **Registration Complete!** 🎉\n\n**Lane:** ${lane}\n**Summoner Name:** ${gameName}#${tagLine}\n**Highest Rank:** ${summonerRank}\n**Top Champions:** ${championList}\n**Top Lanes:** ${sortedLanes.join(', ')}\n**Recent Win Rate:** ${winRate}%\n**Real Rank:** ${realRank}`);
        displayQueue(interaction.channel); // Show the queue list after registration
    } catch (error) {
        console.error('Error fetching data from Riot API:', error.response ? error.response.data : error.message);
        await interaction.followUp(`Failed to fetch summoner data for ${gameName}#${tagLine}: ${error.response ? error.response.data.status.message : error.message}`);
    } finally {
        registerInProgress = false; // Release the lock
        processRegistrationQueue(); // Process the next user in the queue
    }
};


const displayQueue = (channel) => {
    const queueList = registerQueue.map((entry, index) => `${index + 1}. ${entry.interaction.user.username}`).join('\n');
    channel.send(`📋 **Current Registration Queue:**\n${queueList}`);
};

module.exports = {
    name: 'register',
    description: 'Register as a new summoner',
    async execute(interaction) {
        const existingSummoner = await Summoner.findOne({ discordId: interaction.user.id });
        if (existingSummoner) {
            await interaction.reply(`You are already registered as ${existingSummoner.gameName}#${existingSummoner.tagLine}. Use /remove to delete your information.`);
            return;
        }

        await interaction.reply('Please enter the lane you want to play [Top, Jg, Mid, Bot, Sup]:');

        const filter = response => response.author.id === interaction.user.id;
        const laneCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

        laneCollector.on('collect', async response => {
            const lane = response.content.trim().toLowerCase();
            const validLanes = ['top', 'jg', 'mid', 'bot', 'sup'];

            if (!validLanes.includes(lane)) {
                await interaction.followUp('Invalid lane. Please enter one of the following lanes: [Top, Jg, Mid, Bot, Sup]');
                return;
            }

            await interaction.followUp('Please enter your summoner name and tagline in the format gameName#tagLine:');

            const summonerCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

            summonerCollector.on('collect', async response => {
                const [gameName, tagLine] = response.content.split('#');

                if (!gameName || !tagLine) {
                    await interaction.followUp('Invalid format. Please enter your summoner name and tagline in the format gameName#tagLine.');
                    return;
                }

                await interaction.followUp(`🔍 You will be added to the registration queue. Please wait...\n🔍 Fetching your data, please wait... 🕵️‍♂️`);

                registerQueue.push({ interaction, lane, gameName, tagLine });
                displayQueue(interaction.channel); // Show the queue list
                processRegistrationQueue(); // Process the registration queue
            });

            summonerCollector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp('You did not enter your summoner name in time.');
                }
            });
        });

        laneCollector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp('You did not enter your lane in time.');
            }
        });
    },
};

// Export registerQueue so it can be used in other command files
module.exports.registerQueue = registerQueue;
