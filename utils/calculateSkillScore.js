function transferFunction3(x) {
    console.log(`transferFunction3 input: ${x}`);
    const result = (1 / (-x - 1) + 1) ** 2;
    console.log(`transferFunction3 output: ${result}`);
    return result;
}

const calculateSkillScore = (summoner) => {
    const bias = summoner.bias !== undefined ? summoner.bias : 0;
    return summoner.realRank + transferFunction3(summoner.masteryScore / 100) * 20 + summoner.winRate / 10 + bias;
};

module.exports = { calculateSkillScore };
