function transferFunction3(x) {
    console.log(`transferFunction3 input: ${x}`);
    const result = isNaN(x) ? 0 : (1 / (-x - 1) + 1) ** 2;
    console.log(`transferFunction3 output: ${result}`);
    return result;
}

const calculateSkillScore = (summoner) => {
    const rankScore = summoner.realRank || 0;
    const championScore = summoner.masteryData.reduce((total, champ) => total + champ.championLevel, 0);
    const winRateScore = summoner.winRate / 10 || 0;
    const bias = summoner.bias || 0;

    return rankScore + transferFunction3(championScore / 100) * 20 + winRateScore + bias;
};

module.exports = { calculateSkillScore };
