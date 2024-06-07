const calculateSkillScore = (summoner) => {
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
};

module.exports = { calculateSkillScore };
