const Summoner = require('../models/summoners');
const { calculateSkillScore } = require('../utils/calculateSkillScore');
const { movePlayersToChannels } = require('../utils/movePlayersToChannels');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');

let matchInProgress = false;

module.exports = async (client, message) => {
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
                return `**${summoner.gameName}#${summoner.tagLine}**\n**Lane:** ${summoner.lane}\n**Top Champions:** ${championList}\n**Recent Win Rate:** ${summoner.winRate}%\n**Real Rank:** ${summoner.realRank}`;
            }).join('\n\n');
        };

        message.channel.send(`**Team 1**:\n${formatTeam(team1, 'Team 1')}\n\n**Team 2**:\n${formatTeam(team2, 'Team 2')}`);

        await movePlayersToChannels(team1, team1ChannelId);
        await movePlayersToChannels(team2, team2ChannelId);

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
};
