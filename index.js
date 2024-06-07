const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const mongoose = require('mongoose');
const Summoner = require('./models/summoners');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');
require('dotenv').config();


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const token = process.env.DISCORD_BOT_TOKEN;
const team1ChannelId = '810023118092763152';
const team2ChannelId = '1194862474931998780';
const riotApiKey = process.env.RIOT_API_KEY;
const userPreferences = {};
let championIdToName = {};
let matchInProgress = false;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/summoners', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

// Fetch champion data from Riot API
async function fetchChampionData() {
    try {
        const response = await axios.get('https://ddragon.leagueoflegends.com/cdn/11.24.1/data/en_US/champion.json');
        const champions = response.data.data;
        for (const champion in champions) {
            championIdToName[champions[champion].key] = champions[champion].name;
        }
        console.log('Champion data fetched and mapped:', championIdToName);
    } catch (error) {
        console.error('Error fetching champion data:', error.response ? error.response.data : error.message);
    }
}

// Call the function to fetch champion data
fetchChampionData();

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', async message => {
    if (message.content === '!register') {
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

                // Send a fetching message
                message.channel.send(`🔍 Fetching your data, please wait... 🕵️‍♂️`);

                // Fetch summoner data from Riot API
                try {
                    console.log(`Fetching data for summoner: ${gameName}#${tagLine}`);
                    const summonerResponse = await axios.get(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`, {
                        headers: {
                            'X-Riot-Token': riotApiKey
                        }
                    });
                    const summonerData = summonerResponse.data;
                    console.log(`Summoner data: ${JSON.stringify(summonerData)}`);
                    const puuid = summonerData.puuid;

                    // Fetch highest rank
                    const summonerByIdResponse = await axios.get(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`, {
                        headers: {
                            'X-Riot-Token': riotApiKey
                        }
                    });
                    const summonerByIdData = summonerByIdResponse.data;
                    const summonerId = summonerByIdData.id;

                    console.log(`Fetching rank for summonerId: ${summonerId}`);
                    const rankResponse = await axios.get(`https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`, {
                        headers: {
                            'X-Riot-Token': riotApiKey
                        }
                    });
                    const rankData = rankResponse.data;
                    console.log(`Rank data: ${JSON.stringify(rankData)}`);
                    const highestRank = rankData.length > 0 ? `${rankData[0].tier} ${rankData[0].rank}` : 'Unranked';

                    // Fetch top 5 champions
                    console.log(`Fetching champion mastery for puuid: ${puuid}`);
                    const masteryResponse = await axios.get(`https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`, {
                        headers: {
                            'X-Riot-Token': riotApiKey
                        }
                    });
                    const masteryData = masteryResponse.data.slice(0, 5);
                    console.log(`Mastery data: ${JSON.stringify(masteryData)}`);

                    // Fetch most played lanes from match history
                    console.log(`Fetching match history for puuid: ${puuid}`);
                    const matchResponse = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`, {
                        headers: {
                            'X-Riot-Token': riotApiKey
                        }
                    });
                    const matchIds = matchResponse.data;
                    console.log(`Match IDs: ${JSON.stringify(matchIds)}`);
                    const laneCounts = {};
                    let realRank = 0;
                    let count = 0;
                    for (const matchId of matchIds) {
                        console.log(`Fetching match details for matchId: ${matchId}`);
                        const matchDetailsResponse = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`, {
                            headers: {
                                'X-Riot-Token': riotApiKey
                            }
                        });
                        const matchDetails = matchDetailsResponse.data;

                        //********Ethan's comment: why are you doing p.puuid, isnt the participant field a vector of puuid already?*********
                        const participant = matchDetails.info.participants.find(p => p.puuid === puuid);
                        const lane = participant.teamPosition.toLowerCase();
                        if (lane && ['top', 'jungle', 'middle', 'bottom', 'support'].includes(lane)) {
                            laneCounts[lane] = (laneCounts[lane] || 0) + 1;
                        }


                        // using /lol/match/v5/matches/by-puuid/{puuid}/ids to find preivous 20 matches
                        // then for each match use /lol/match/v5/matches/{matchId}  .participant to find all the participant (already in puuid)
                        // find the rank of each paritipant using exisitng method

                        console.log(`Finding all particiapnt in match: ${matchId}`);
                        const matchParticipants = matchDetails.info.participants;
                        
                        for (const participantUid of matchParticipants) {
                            const participantIDData = await axios.get(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${participantUid}`, {
                            headers: {
                                'X-Riot-Token': riotApiKey
                                }    
                            });

                        const participantId = participantIDData.data.id;
                        console.log(`Fetching rank for participantId: ${participantId}`);
                        const pariticipantrankResponse = await axios.get(`https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${participantId}`, {
                            headers: {
                                'X-Riot-Token': riotApiKey
                            }
                            });
                        const participantRankData = pariticipantrankResponse.data;
                        console.log(`Rank data: ${JSON.stringify(participantRankData)}`);
                        const participantRank = participantRankData.length > 0 ? `${participantRankData[0].tier} ${participantRankData[0].rank}` : 'Unranked';

                        if (participantRank != 'Unranked'){
                            realRank += calculateParticipantSkillScore(participantRank);
                            count += 1;
                            }
                        }
                    }
                    realRank = realRank/count;

                    const sortedLanes = Object.entries(laneCounts).sort(([, a], [, b]) => b - a).map(([lane]) => lane).slice(0, 5);
                    console.log(`Sorted lanes: ${JSON.stringify(sortedLanes)}`);

                    // Calculate win rates for recent matches
                    const winRate = await calculateWinRate(matchIds, puuid);

                    userPreferences[message.author.id] = { lane, gameName, tagLine, summonerData, masteryData, sortedLanes, winRate };

                    const championList = masteryData.map(champion => `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');
                    const laneList = sortedLanes.join(', ');

                    // Save summoner data to MongoDB
                    const summoner = new Summoner({
                        discordId: message.author.id,
                        discordTag: message.author.tag,
                        gameName,
                        tagLine,
                        puuid,
                        lane,
                        masteryData,
                        sortedLanes,
                        highestRank,
                        winRate,
                        realRank
                    });

                    await summoner.save();

                    message.channel.send(`🎉 **Registration Complete!** 🎉\n\n**Discord:** ${message.author.username}\n**Lane:** ${lane}\n**Summoner Name:** ${gameName}#${tagLine}\n**Top Champions:** ${championList}\n**Top Lanes:** ${laneList}\n**Highest Rank:** ${highestRank}`);
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
    }

    if (message.content === '!members') {
        // Fetch all registered summoners from MongoDB
        const summoners = await Summoner.find({});
        if (summoners.length === 0) {
            message.channel.send('No registered summoners.');
        } else {
            const memberList = summoners.map(summoner => {
                const topChampions = summoner.masteryData.slice(0, 3).map(champion => `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');
                return `🧑‍🚀 **${summoner.gameName}#${summoner.tagLine}**\n**Lane:** ${summoner.lane}\n**Highest Rank:** ${summoner.highestRank}\n**Top Champions:** ${topChampions}`;
            }).join('\n\n');
            message.channel.send(`📋 **Registered Summoners** 📋\n\n${memberList}`);
        }
    }

    if (message.content === '!match') {
        if (matchInProgress) {
            message.channel.send('❌ A match is already in progress. Please wait until it is finished.');
            return;
        }
        
        matchInProgress = true;

        const teamMessage = await message.channel.send('React to join the team selection!\n\n❗ to join');

        await teamMessage.react('❗');

        const filter = (reaction, user) => {
            return reaction.emoji.name === '❗' && !user.bot;
        };

        const collector = teamMessage.createReactionCollector({ filter, dispose: true, time: 100000 });

        let participants = [];

        collector.on('collect', async (reaction, user) => {
            const summoner = await Summoner.findOne({ discordId: user.id });
            if (summoner) {
                participants.push(summoner);
                if (participants.length > 10) {
                    message.channel.send('❌ The match is full. Please wait for the next match.');
                    return;
                }
                message.channel.send(`🚀 **${user.username}** has joined the team selection.`);
            } else {
                message.channel.send(`⚠️ **${user.username}** is not registered. Please register first using !register.`);
            }
        });

        collector.on('end', async collected => {
            if (participants.length < 10) {
                message.channel.send('😕 Not enough participants to start the match. Need 10 participants.');
                matchInProgress = false;
                return;
            }

            // Shuffle and assign teams fairly
            const lanes = ['top', 'jungle', 'mid', 'bottom', 'support'];
            participants = participants.sort(() => 0.5 - Math.random());
            const team1 = [];
            const team2 = [];

            let team1Score = 0;
            let team2Score = 0;

            const laneAssignments = { team1: {}, team2: {} };

            for (const lane of lanes) {
                const team1Player = participants.find(p => p.lane === lane || p.sortedLanes.includes(lane));
                const team2Player = participants.find(p => (p.lane === lane || p.sortedLanes.includes(lane)) && p !== team1Player);

                if (team1Player) {
                    team1.push(team1Player);
                    team1Score += calculateSkillScore(team1Player);
                    laneAssignments.team1[lane] = team1Player.discordId;
                }

                if (team2Player) {
                    team2.push(team2Player);
                    team2Score += calculateSkillScore(team2Player);
                    laneAssignments.team2[lane] = team2Player.discordId;
                }
            }

            const formatTeam = (team, teamName) => {
                return team.map(summoner => {
                    const championList = summoner.masteryData.slice(0, 3).map(champion => `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');
                    return `**${summoner.gameName}#${summoner.tagLine}**\n**Lane:** ${summoner.lane}\n**Top Champions:** ${championList}\n**Recent Win Rate:** ${summoner.winRate}%`;
                }).join('\n\n');
            };

            message.channel.send(`**Team 1**:\n${formatTeam(team1, 'Team 1')}\n\n**Team 2**:\n${formatTeam(team2, 'Team 2')}`);

            // Move players to designated channels
            await movePlayersToChannels(team1, team1ChannelId);
            await movePlayersToChannels(team2, team2ChannelId);

            // Play sound effect in a voice channel
            const voiceChannel = message.member.voice.channel;
            if (voiceChannel) {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });

                const player = createAudioPlayer();
                const resource = createAudioResource(path.join(__dirname, 'qifei.mp3'));

                player.play(resource);
                connection.subscribe(player);

                player.on(AudioPlayerStatus.Idle, () => connection.destroy());
            }

            matchInProgress = false;
        });
    }

    if (message.content === '!remove') {
        const existingSummoner = await Summoner.findOne({ discordId: message.author.id });
        if (!existingSummoner) {
            message.channel.send('You are not registered. Use !register to sign up.');
            return;
        }

        await Summoner.deleteOne({ discordId: message.author.id });
        message.channel.send('😢 Your data has been deleted. Hope to see you back soon!');
    }

    if (message.content === '!help') {
        message.channel.send(`📜 **Commands** 📜\n
        \`!register\` - Register your summoner information.
        \`!remove\` - Remove your summoner information.
        \`!members\` - List all registered summoners.
        \`!match\` - Start the team selection process.`);
    }
});

// Calculate skill score based on rank, champion mastery, and lanes
function calculateSkillScore(summoner) {
    const rankScores = {
        'IRON IV': 1, 'IRON III': 2, 'IRON II': 3, 'IRON I': 4,
        'BRONZE IV': 5, 'BRONZE III': 6, 'BRONZE II': 7, 'BRONZE I': 8,
        'SILVER IV': 9, 'SILVER III': 10, 'SILVER II': 11, 'SILVER I': 12,
        'GOLD IV': 13, 'GOLD III': 14, 'GOLD II': 15, 'GOLD I': 16,
        'PLATINUM IV': 17, 'PLATINUM III': 18, 'PLATINUM II': 19, 'PLATINUM I': 20,
        'DIAMOND IV': 21, 'DIAMOND III': 22, 'DIAMOND II': 23, 'DIAMOND I': 24,
        'MASTER': 25, 'GRANDMASTER': 26, 'CHALLENGER': 27, 'Unranked': 0
    };

    const rankScore = rankScores[summoner.highestRank] || 0;
    const championScore = summoner.masteryData.reduce((total, champ) => total + champ.championLevel, 0);
    const laneScore = summoner.sortedLanes.length;
    const winRateScore = summoner.winRate / 10;

    return rankScore + championScore + laneScore + winRateScore;
}

function calculateParticipantSkillScore(participantRank) {
    const rankScores = {
        'IRON IV': 1, 'IRON III': 2, 'IRON II': 3, 'IRON I': 4,
        'BRONZE IV': 5, 'BRONZE III': 6, 'BRONZE II': 7, 'BRONZE I': 8,
        'SILVER IV': 9, 'SILVER III': 10, 'SILVER II': 11, 'SILVER I': 12,
        'GOLD IV': 13, 'GOLD III': 14, 'GOLD II': 15, 'GOLD I': 16,
        'PLATINUM IV': 17, 'PLATINUM III': 18, 'PLATINUM II': 19, 'PLATINUM I': 20,
        'DIAMOND IV': 21, 'DIAMOND III': 22, 'DIAMOND II': 23, 'DIAMOND I': 24,
        'MASTER': 25, 'GRANDMASTER': 26, 'CHALLENGER': 27, 'Unranked': 0
    };

    const rankScore = rankScores[participantRank] || 0;
    // const championScore = summoner.masteryData.reduce((total, champ) => total + champ.championLevel, 0);
    // const laneScore = summoner.sortedLanes.length;
    // const winRateScore = summoner.winRate / 10;

    return rankScore;
}

// Calculate recent win rate
async function calculateWinRate(matchIds, puuid) {
    let wins = 0;
    let totalGames = matchIds.length;

    for (const matchId of matchIds) {
        const matchDetailsResponse = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`, {
            headers: {
                'X-Riot-Token': riotApiKey
            }
        });
        const matchDetails = matchDetailsResponse.data;
        const participant = matchDetails.info.participants.find(p => p.puuid === puuid);
        if (participant.win) {
            wins++;
        }
    }

    return (wins / totalGames) * 100;
}

// Move players to designated channels
async function movePlayersToChannels(team, channelId) {
    for (const player of team) {
        const member = await client.guilds.cache.first().members.fetch(player.discordId);
        if (member.voice.channel) {
            await member.voice.setChannel(channelId);
        }
    }
}

client.login(token);



