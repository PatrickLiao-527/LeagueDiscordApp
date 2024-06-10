const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const Summoner = require('../models/summoners');
const { calculateSkillScore } = require('../utils/calculateSkillScore');
const { matchmaking } = require('../utils/matchmakingUtil');
const { championIdToName, fetchChampionData } = require('../utils/championIdToName');

let matchInProgress = false;
let queue = [];

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
            queue.push(user);
            await updateQueueMessage(reaction.message.channel);

            if (queue.length >= 10 && !matchInProgress) {
                matchInProgress = true; // Set the flag to indicate a match is in progress

                // We have enough players, start matchmaking
                const participants = queue.slice(0, 10);
                queue = queue.slice(10); // Remove the matched players from the queue
                await updateQueueMessage(reaction.message.channel); // Update queue message after removing matched players

                for (const participant of participants) {
                    participant.skillScore = calculateSkillScore(participant);
                    console.log(`Participant: ${participant.gameName}#${participant.tagLine}, Skill Score: ${participant.skillScore}`);
                }

                const { team1, team2 } = matchmaking(participants);

                const formatTeam = team => {
                    return team.map(summoner => {
                        const championList = summoner.masteryData.slice(0, 3).map(champion => `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');
                        return `**${summoner.gameName}#${summoner.tagLine}**\n**Lane:** ${summoner.sortedLanes.join(', ')}\n**Top Champions:** ${championList}\n**Recent Win Rate:** ${summoner.winRate}%\n**Real Rank:** ${summoner.realRank}`;
                    }).join('\n\n');
                };

                await reaction.message.channel.send(`**Team 1**:\n${formatTeam(team1)}\n\n**Team 2**:\n${formatTeam(team2)}`);
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

    const index = queue.findIndex(q => q.id === user.id);
    if (index !== -1) {
        queue.splice(index, 1);
        await updateQueueMessage(reaction.message.channel);
        await reaction.message.channel.send(`${user.tag} decided to opt out of the queue. Guess they couldn't handle the pressure! 😏`);
    }
};

const handleFetchSummoners = async (interaction) => {
    console.log('Fetching summoners from database...');
    const summoners = await Summoner.find({}).limit(10).exec();
    const fetchedSummoners = summoners.map(summoner => {
        console.log(`Fetched Summoner: ${summoner.gameName}#${summoner.tagLine}`);
        return summoner;
    });
    if (fetchedSummoners.length < 10) {
        await interaction.channel.send('Not enough summoners registered for matchmaking.');
        return;
    }

    for (const summoner of fetchedSummoners) {
        summoner.skillScore = calculateSkillScore(summoner);
        console.log(`Fetched Summoner: ${summoner.gameName}#${summoner.tagLine}, Skill Score: ${summoner.skillScore}`);
    }

    const { team1, team2 } = matchmaking(fetchedSummoners);

    const formatTeam = team => {
        return team.map(summoner => {
            const championList = summoner.masteryData.slice(0, 3).map(champion => `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');
            return `**${summoner.gameName}#${summoner.tagLine}**\n**Lane:** ${summoner.sortedLanes.join(', ')}\n**Top Champions:** ${championList}\n**Recent Win Rate:** ${summoner.winRate}%\n**Real Rank:** ${summoner.realRank}`;
        }).join('\n\n');
    };

    await interaction.channel.send(`**Team 1**:\n${formatTeam(team1)}\n\n**Team 2**:\n${formatTeam(team2)}`);
};

module.exports = {
    name: 'match',
    description: 'Initiate a matchmaking process in the lobby.',
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Matchmaking Queue')
            .setDescription('React to this message to join the matchmaking queue. We need 10 players to start the match.');

        const button = new ButtonBuilder()
            .setCustomId('fetchSummoners')
            .setLabel('Fetch Summoners')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        // Set QUEUE_MESSAGE_ID for further updates
        process.env.QUEUE_MESSAGE_ID = message.id;

        // React to the message with an emoji to collect reactions
        await message.react('🫵');

        const filter = (reaction, user) => reaction.emoji.name === '🫵' && !user.bot;
        const collector = message.createReactionCollector({ filter, dispose: true });

        collector.on('collect', async (reaction, user) => {
            await handleReactionAdd(reaction, user);
        });

        collector.on('remove', async (reaction, user) => {
            await handleReactionRemove(reaction, user);
        });

        collector.on('end', collected => {
            console.log(`Collected ${collected.size} reactions`);
        });

        const buttonCollector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 60000 });

        buttonCollector.on('collect', async i => {
            if (i.customId === 'fetchSummoners') {
                await handleFetchSummoners(i);
                await i.reply({ content: 'Summoners fetched and matchmaking initiated.', ephemeral: true });
            }
        });

        buttonCollector.on('end', collected => {
            console.log(`Button collector ended after collecting ${collected.size} interactions`);
        });
    },
    handleReactionAdd,
    handleReactionRemove
};
