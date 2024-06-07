const axios = require('axios');
const riotApiKey = process.env.RIOT_API_KEY;

const fetchSummonerData = async (gameName, tagLine) => {
    try {
        const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
        console.log(`Fetching summoner data from URL: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        console.log(`Fetched summoner data: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching summoner data:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const fetchSummonerRank = async (summonerId) => {
    try {
        const url = `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
        console.log(`Fetching summoner rank from URL: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        console.log(`Fetched summoner rank: ${JSON.stringify(response.data)}`);
        const rankData = response.data;
        return rankData.length > 0 ? `${rankData[0].tier} ${rankData[0].rank}` : 'Unranked';
    } catch (error) {
        console.error('Error fetching summoner rank:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const fetchTopChampions = async (puuid) => {
    try {
        const url = `https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
        console.log(`Fetching top champions from URL: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        console.log(`Fetched top champions: ${JSON.stringify(response.data)}`);
        return response.data.slice(0, 5);
    } catch (error) {
        console.error('Error fetching top champions:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const fetchMatchIds = async (puuid) => {
    try {
        const url = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`;
        console.log(`Fetching match IDs from URL: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        console.log(`Fetched match IDs: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching match IDs:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const fetchLaneCounts = async (matchIds, puuid) => {
    try {
        const laneCounts = {};
        for (const matchId of matchIds) {
            const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
            console.log(`Fetching match details from URL: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'X-Riot-Token': riotApiKey
                }
            });
            const matchDetails = response.data;
            console.log(`Fetched match details: ${JSON.stringify(matchDetails)}`);
            const participant = matchDetails.info.participants.find(p => p.puuid === puuid);
            const lane = participant.teamPosition.toLowerCase();
            if (lane && ['top', 'jungle', 'middle', 'bottom', 'support'].includes(lane)) {
                laneCounts[lane] = (laneCounts[lane] || 0) + 1;
            }
        }
        console.log(`Lane counts: ${JSON.stringify(laneCounts)}`);
        return laneCounts;
    } catch (error) {
        console.error('Error fetching lane counts:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const calculateWinRate = async (matchIds, puuid) => {
    try {
        let wins = 0;
        let totalGames = matchIds.length;

        for (const matchId of matchIds) {
            const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
            console.log(`Fetching match details from URL: ${url}`);
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
        console.error('Error calculating win rate:', error.response ? error.response.data : error.message);
        throw error;
    }
};
const fetchSummonerByPuuid = async (puuid) => {
    try {
        const url = `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
        console.log(`Fetching summoner by PUUID from URL: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        console.log(`Fetched summoner by PUUID: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching summoner by PUUID:', error.response ? error.response.data : error.message);
        throw error;
    }
};


const calculateParticipantSkillScore = (participantRank) => {
    const rankScores = {
        'IRON IV': 1, 'IRON III': 2, 'IRON II': 3, 'IRON I': 4,
        'BRONZE IV': 5, 'BRONZE III': 6, 'BRONZE II': 7, 'BRONZE I': 8,
        'SILVER IV': 9, 'SILVER III': 10, 'SILVER II': 11, 'SILVER I': 12,
        'GOLD IV': 13, 'GOLD III': 14, 'GOLD II': 15, 'GOLD I': 16,
        'PLATINUM IV': 17, 'PLATINUM III': 18, 'PLATINUM II': 19, 'PLATINUM I': 20,
        'DIAMOND IV': 21, 'DIAMOND III': 22, 'DIAMOND II': 23, 'DIAMOND I': 24,
        'MASTER': 25, 'GRANDMASTER': 26, 'CHALLENGER': 27, 'Unranked': 0
    };

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
