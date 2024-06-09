const axios = require('axios');
require('dotenv').config();

const riotApiKey = process.env.RIOT_API_KEY;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handleRateLimit = async (error) => {
    if (error.response && error.response.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const waitTime = (retryAfter ? parseInt(retryAfter, 10) : 120) * 1000; // Convert to milliseconds
        console.log(`Rate limit reached. Waiting for ${waitTime / 1000} seconds.`);
        await delay(waitTime);
    } else {
        throw error;
    }
};

const fetchSummonerData = async (gameName, tagLine) => {
    try {
        const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
        console.log(`Fetching summoner data from URL: ${url}`);
        await delay(1000); // Adding delay
        const response = await axios.get(url, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        console.log(`Fetched summoner data: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        await handleRateLimit(error);
        return fetchSummonerData(gameName, tagLine);
    }
};

const fetchSummonerRank = async (summonerId) => {
    try {
        const url = `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
        console.log(`Fetching summoner rank from URL: ${url}`);
        await delay(1000); // Adding delay
        const response = await axios.get(url, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        console.log(`Fetched summoner rank: ${JSON.stringify(response.data)}`);
        const rankData = response.data;
        if (rankData.length > 0) {
            // Check if tier and rank fields exist
            const { tier, rank } = rankData[0];
            if (tier && rank) {
                console.log("Summoner rank data is normal ------ ");
                console.log(`Summoner rank data: ${tier} ${rank}`);
                return `${tier} ${rank}`;
            } else {
                console.log(`Summoner rank data: ${tier} ${rank}`);
            }
        }
        // Return 'Unranked' if tier or rank is missing
        console.log('Summoner is Unranked');
        return 'Unranked';
    } catch (error) {
        await handleRateLimit(error);
        return fetchSummonerRank(summonerId);
    }
};

const fetchTopChampions = async (puuid) => {
    try {
        const url = `https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
        console.log(`Fetching top champions from URL: ${url}`);
        await delay(1000); // Adding delay
        const response = await axios.get(url, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        console.log(`Fetched top champions: ${JSON.stringify(response.data)}`);
        return response.data.slice(0, 5);
    } catch (error) {
        await handleRateLimit(error);
        return fetchTopChampions(puuid);
    }
};

const fetchMatchIds = async (puuid) => {
    try {
        const url = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&count=10`;
        console.log(`Fetching match IDs from URL: ${url}`);
        await delay(1000); // Adding delay
        const response = await axios.get(url, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        console.log(`Fetched match IDs: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        await handleRateLimit(error);
        return fetchMatchIds(puuid);
    }
};

const fetchLaneCounts = async (matchIds, puuid) => {
    try {
        const laneCounts = {};
        for (const matchId of matchIds) {
            const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
            console.log(`Fetching match details from URL: ${url}`);
            await delay(1000); // Adding delay
            const response = await axios.get(url, {
                headers: {
                    'X-Riot-Token': riotApiKey
                }
            });
            const matchDetails = response.data;
            console.log(`Fetched match details: ${JSON.stringify(matchDetails)}`);
            const participant = matchDetails.info.participants.find(p => p.puuid === puuid);
            const lane = participant.teamPosition.toLowerCase();
            if (lane && ['top', 'jungle', 'middle', 'bottom', 'utility'].includes(lane)) {
                laneCounts[lane] = (laneCounts[lane] || 0) + 1;
            }
        }
        console.log(`Lane counts: ${JSON.stringify(laneCounts)}`);
        return laneCounts;
    } catch (error) {
        await handleRateLimit(error);
        return fetchLaneCounts(matchIds, puuid);
    }
};

const calculateWinRate = async (matchIds, puuid) => {
    try {
        let wins = 0;
        let totalGames = matchIds.length;

        for (const matchId of matchIds) {
            const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
            console.log(`Fetching match details from URL: ${url}`);
            await delay(1000); // Adding delay
            const matchDetailsResponse = await axios.get(url, {
                headers: {
                    'X-Riot-Token': riotApiKey
                }
            });
            const matchDetails = matchDetailsResponse.data;
            console.log(`Fetched match details: ${JSON.stringify(matchDetails)}`);
            const participant = matchDetails.info.participants.find(p => p.puuid === puuid);
            if (participant.win) {
                wins++;
            }
        }

        const winRate = (wins / totalGames) * 100;
        console.log(`Calculated win rate: ${winRate}%`);
        return winRate;
    } catch (error) {
        await handleRateLimit(error);
        return calculateWinRate(matchIds, puuid);
    }
};

const fetchSummonerByPuuid = async (puuid) => {
    try {
        const url = `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
        console.log(`Fetching summoner by PUUID from URL: ${url}`);
        console.log(`Using Riot API Key: ${riotApiKey}`);
        await delay(1000); // Adding delay
        const response = await axios.get(url, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        console.log(`Fetched summoner by PUUID: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching summoner by PUUID:', error.message);
        await handleRateLimit(error);
        return fetchSummonerByPuuid(puuid);
    }
};

const calculateParticipantSkillScore = (participantRank) => {
    const rankScores = {
        'IRON IV': 1, 'IRON III': 2, 'IRON II': 3, 'IRON I': 4,
        'BRONZE IV': 5, 'BRONZE III': 6, 'BRONZE II': 7, 'BRONZE I': 8,
        'SILVER IV': 9, 'SILVER III': 10, 'SILVER II': 11, 'SILVER I': 12,
        'GOLD IV': 13, 'GOLD III': 14, 'GOLD II': 15, 'GOLD I': 16,
        'PLATINUM IV': 17, 'PLATINUM III': 18, 'PLATINUM II': 19, 'PLATINUM I': 20,
        'EMERALD IV': 21, 'EMERALD III': 22, 'EMERALD II': 23, 'EMERALD I': 24,
        'DIAMOND IVV': 25, 'DIAMOND III': 26, 'DIAMOND II': 27, 'DIAMOND I': 28, 
        'MASTER I': 29, 'GRANDMASTER I': 30, 'CHALLENGER I': 31, 'Unranked': 0
    };

    if (!participantRank) {
        console.log('Participant rank is undefined. Data type:', typeof participantRank);
        return 0;
    }

    const score = rankScores[participantRank] || 0;
    console.log(`Calculated participant skill score: ${score} for rank ${participantRank}`);
    return score;
};

module.exports = {
    fetchSummonerData,
    fetchSummonerRank,
    fetchTopChampions,
    fetchMatchIds,
    fetchLaneCounts,
    calculateWinRate,
    calculateParticipantSkillScore,
    fetchSummonerByPuuid
};
