// this needs to change

const calculateSkillScore = (summoner) => {
    const rankScore = summoner.realRank
    const championScore = summoner.masteryData.reduce((total, champ) => total + champ.championLevel, 0);
    const winRateScore = summoner.winRate / 10;

    return rankScore + championScore + winRateScore;
};

module.exports = { calculateSkillScore };
