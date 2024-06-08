const mongoose = require('mongoose');

const summonerSchema = new mongoose.Schema({
    discordId: { type: String, required: true },
    discordTag: { type: String, required: true },
    gameName: { type: String, required: true },
    tagLine: { type: String, required: true },
    puuid: { type: String, required: true },
    highestRank: { type: String, default: 'unknown' },
    masteryScore: { type: Number, required: true},
    masteryData: { type: Array, required: true },
    sortedLanes: { type: Array, required: true },
    winRate: { type: Number, required: true },
    realRank: { type: Number, required: true },
    skillScore: { type: Number, required: true}
});

module.exports = mongoose.model('Summoner', summonerSchema);
