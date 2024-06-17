const { EmbedBuilder } = require('discord.js');
const Summoner = require('../models/summoners');
const { calculateSkillScore } = require('../utils/calculateSkillScore');
const { matchmaking } = require('../utils/matchmakingUtil');
const { championIdToName, fetchChampionData } = require('../utils/championIdToName');

let matchInProgress = false;
let queue = [];
const lanes = ["Top", "Jungle", "Mid", "Bot", "Support"];
const teamNames = ["姐姐履高跟踩吾之卵其痛虽难忍但爽于心", "落地率先倒地，激发队友潜力", "理塘最強伝説と絕兇の猛虎！純真丁一郎です！", "24岁，是伞兵", "大司马小队"];

const getRandomTeamName = () => {
    return teamNames[Math.floor(Math.random() * teamNames.length)];
};

const updateQueueMessage = async (channel) => {
    let message = 'Current Team Making Queue:\n';
    queue.forEach((user, index) => {
        message += `${index + 1}. ${user.tag}\n`;
    });
    try {
        const queueMessage = await channel.messages.fetch(process.env.QUEUE_MESSAGE_ID);
        await queueMessage.edit(message);
    } catch (error) {
        console.error('Error updating queue message:', error);
    }
};

const handleReactionAdd = async (reaction, user) => {
    console.log(`Reaction added by ${user.tag}`);
    if (user.bot) return; // Ignore bot reactions

    const summoner = await Summoner.findOne({ discordId: user.id });
    if (!summoner) {
        await reaction.message.channel.send(`${user.tag}, you need to register first!`);
        return;
    }

    if (reaction.message.id === process.env.QUEUE_MESSAGE_ID) {
        if (!queue.some(q => q.id === user.id)) {
            queue.push({ user, summoner });
            await updateQueueMessage(reaction.message.channel);

            if (queue.length >= 10 && !matchInProgress) {
                matchInProgress = true; // Set the flag to indicate a match is in progress

                // We have enough players, start matchmaking
                const participants = queue.slice(0, 10).map(entry => entry.summoner);
                queue = queue.slice(10); // Remove the matched players from the queue
                await updateQueueMessage(reaction.message.channel); // Update queue message after removing matched players

                participants.forEach(participant => {
                    participant.skillScore = calculateSkillScore(participant._doc);
                    console.log(`Participant: ${participant._doc.gameName}#${participant._doc.tagLine}, Skill Score: ${participant.skillScore}`);
                });

                const { team1, team2, team1TotalScore, team2TotalScore } = matchmaking(participants.map(p => p._doc));

                const formatPlayerAnnouncement = (summoner, index) => {
                    const playerName = summoner.gameName.split("#")[0]; // Remove the hashtag and everything after
                    const lane = lanes[index];
                    const topChampions = summoner.masteryData.slice(0, 3).map(champion => `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');

                    return `**${playerName}** will be playing in the **${lane}** lane! Their top champions are: ${topChampions}`;
                };

                const sendDramaticAnnouncement = async (channel, team, teamName, teamScore) => {
                    await channel.send(`Get ready for the match! Presenting **${teamName}**!`);
                    for (let i = 0; i < team.length; i++) {
                        const announcement = formatPlayerAnnouncement(team[i], i);
                        await channel.send(announcement);
                    }
                    await channel.send(`**${teamName}**'s total team score is: **${teamScore}**!`);
                };

                const sendMessageInChunks = async (channel, content) => {
                    const MAX_LENGTH = 2000;
                    if (content.length <= MAX_LENGTH) {
                        await channel.send(content);
                    } else {
                        const chunks = [];
                        let start = 0;
                        while (start < content.length) {
                            let end = start + MAX_LENGTH;
                            if (end >= content.length) {
                                chunks.push(content.slice(start));
                                break;
                            }
                            let lastNewline = content.lastIndexOf('\n', end);
                            if (lastNewline > start) {
                                end = lastNewline + 1;
                            }
                            chunks.push(content.slice(start, end));
                            start = end;
                        }
                        for (const chunk of chunks) {
                            await channel.send(chunk);
                        }
                    }
                };

                const team1Name = getRandomTeamName();
                const team2Name = getRandomTeamName();

                await sendDramaticAnnouncement(reaction.message.channel, team1, team1Name, team1TotalScore);
                await sendDramaticAnnouncement(reaction.message.channel, team2, team2Name, team2TotalScore);

                matchInProgress = false; // Reset the flag after matchmaking is done
            }
        } else {
            await reaction.message.channel.send(`${user.tag}, you are already in the queue!`);
        }
    }
};

const handleReactionRemove = async (reaction, user) => {
    console.log(`Reaction removed by ${user.tag}`);
    if (user.bot) return; // Ignore bot reactions

    const index = queue.findIndex(entry => entry.user.id === user.id);
    if (index !== -1) {
        queue.splice(index, 1);
        await updateQueueMessage(reaction.message.channel);
        await reaction.message.channel.send(`${user.tag} decided to opt out of the queue. Guess they couldn't handle the pressure! 😏`);
    }
};

const handleSimulatedMatch = async (reaction, channel) => {
    console.log('Simulated match initiated.');
    if (matchInProgress) {
        await channel.send('A matchmaking process is already in progress. Please wait for it to finish.');
        return;
    }

    try {
        await fetchChampionData(); // Ensure champion data is fetched before proceeding

        const summoners = await Summoner.find({}).limit(10); // Fetch 10 summoners from the database
        console.log(summoners);
        if (summoners.length < 10) {
            await channel.send('Not enough summoners registered for a simulated match.');
            return;
        }

        // Print raw data for debugging
        summoners.forEach((summoner, index) => {
            console.log(`Summoner ${index + 1}:`, JSON.stringify(summoner._doc, null, 2));
        });

        matchInProgress = true;

        summoners.forEach(summoner => {
            summoner._doc.skillScore = calculateSkillScore(summoner._doc);
            console.log(`Participant: ${summoner._doc.gameName}#${summoner._doc.tagLine}, Skill Score: ${summoner._doc.skillScore}, Mastery Data: ${JSON.stringify(summoner._doc.masteryData)}, Sorted Lanes: ${summoner._doc.sortedLanes}`);
        });

        const { team1, team2, team1TotalScore, team2TotalScore } = matchmaking(summoners.map(summoner => summoner._doc));

        const formatPlayerAnnouncement = (summoner, index) => {
            const playerName = summoner.gameName.split("#")[0]; // Remove the hashtag and everything after
            const lane = lanes[index];
            const topChampions = summoner.masteryData.slice(0, 3).map(champion => `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');

            return `**${playerName}** will be playing in the **${lane}** lane! Their top champions are: ${topChampions}`;
        };

        const sendDramaticAnnouncement = async (channel, team, teamName, teamScore) => {
            await channel.send(`Get ready for the match! Presenting **${teamName}**!`);
            for (let i = 0; i < team.length; i++) {
                const announcement = formatPlayerAnnouncement(team[i], i);
                await channel.send(announcement);
            }
            await channel.send(`**${teamName}**'s total team score is: **${teamScore}**!`);
        };

        const team1Name = getRandomTeamName();
        const team2Name = getRandomTeamName();

        await sendDramaticAnnouncement(channel, team1, team1Name, team1TotalScore);
        await sendDramaticAnnouncement(channel, team2, team2Name, team2TotalScore);

        matchInProgress = false;
    } catch (error) {
        console.error('Error during simulated match:', error);
        await channel.send('An error occurred while initiating the simulated match. Please try again later.');
        matchInProgress = false;
    }
};

module.exports = {
    name: 'match',
    description: 'Initiate a matchmaking process in the lobby.',
    async execute(interaction) {
        if (matchInProgress) {
            await interaction.reply('A matchmaking process is already in progress. Please wait for it to finish.');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Matchmaking Queue')
            .setDescription('React to this message to join the matchmaking queue. We need 10 players to start the match.\nReact with 🛠️ to initiate a simulated match.');

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });

        // Set QUEUE_MESSAGE_ID for further updates
        process.env.QUEUE_MESSAGE_ID = message.id;

        // React to the message with an emoji to collect reactions
        await message.react('🫵');
        await message.react('🛠️'); // New emoji for simulated match

        const filter = (reaction, user) => ['🫵', '🛠️'].includes(reaction.emoji.name) && !user.bot;
        const collector = message.createReactionCollector({ filter, dispose: true });

        collector.on('collect', async (reaction, user) => {
            if (reaction.emoji.name === '🛠️') {
                await handleSimulatedMatch(reaction, message.channel);
            } else {
                await handleReactionAdd(reaction, user);
            }
        });

        collector.on('remove', async (reaction, user) => {
            if (reaction.emoji.name !== '🛠️') {
                await handleReactionRemove(reaction, user);
            }
        });

        collector.on('end', collected => {
            console.log(`Collected ${collected.size} reactions`);
        });
    },
    handleReactionAdd,
    handleReactionRemove
};
