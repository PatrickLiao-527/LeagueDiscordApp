const Summoner = require('../models/summoners');
const { calculateSkillScore } = require('../utils/calculateSkillScore');
const { movePlayersToChannels } = require('../utils/movePlayersToChannels');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');
const { matchmaking } = require('../utils/matchmakingUtil'); // Import the matchmaking utility
const { championIdToName, fetchChampionData } = require('../utils/championIdToName.js');

let matchInProgress = false;

const simulateMatch = async () => {
  if (matchInProgress) {
    console.log('❌ A match is already in progress. Please wait until it is finished.');
    return;
  }

  matchInProgress = true;

  try {
    await fetchChampionData();

    const participants = await Summoner.find().limit(10);
    if (participants.length < 10) {
      console.log('😕 Not enough participants to start the match. Need 10 participants.');
      matchInProgress = false;
      return;
    }

    participants.forEach(participant => {
      if (!participant.sortedLanes || !Array.isArray(participant.sortedLanes) || participant.sortedLanes.length === 0) {
        throw new Error(`Summoner ${participant.gameName} has invalid sortedLanes: ${participant.sortedLanes}`);
      }
      participant.skillScore = calculateSkillScore(participant);
    });

    const { team1, team2 } = matchmaking(participants);

    const formatTeam = team => {
      return team.map(summoner => {
        if (!summoner.masteryData || !Array.isArray(summoner.masteryData)) {
          console.error(`Invalid masteryData for summoner ${summoner.gameName}: ${summoner.masteryData}`);
          return `**${summoner.gameName}#${summoner.tagLine}**\n**Lane:** ${summoner.sortedLanes.join(', ')}\n**Top Champions:** Invalid data\n**Recent Win Rate:** ${summoner.winRate}%\n**Real Rank:** ${summoner.realRank}`;
        }
        const championList = summoner.masteryData.slice(0, 3).map(champion => `${championIdToName[champion.championId] || 'Unknown Champion'} [Level ${champion.championLevel}]`).join(', ');
        return `**${summoner.gameName}#${summoner.tagLine}**\n**Lane:** ${summoner.sortedLanes.join(', ')}\n**Top Champions:** ${championList}\n**Recent Win Rate:** ${summoner.winRate}%\n**Real Rank:** ${summoner.realRank}`;
      }).join('\n\n');
    };

    console.log(`**Team 1**:\n${formatTeam(team1)}\n\n**Team 2**:\n${formatTeam(team2)}`);

  } catch (error) {
    console.error('Error during matchmaking simulation:', error);
  } finally {
    matchInProgress = false;
  }
};

simulateMatch();
