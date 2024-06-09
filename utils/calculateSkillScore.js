function transferFunction3(x) {
    console.log(`transferFunction1 input: ${x}`);
    const result = (1 / (-x - 1) + 1) ** 2;
    console.log(`transferFunction1 output: ${result}`);
    return result;
}

const calculateSkillScore = (summoner) => {
    return summoner.realRank + transferFunction3(masteryScore.data/100) * 20 + summoner.winRate / 10 + summoner.bias;
};

module.exports = { calculateSkillScore };
