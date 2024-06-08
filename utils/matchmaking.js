function transferFunction1(x) {
    return (Math.log(0.3 * (x + 0.3333)) + 1) / 2;
  }
  
  function transferFunction2(x) {
    return (Math.pow(1.5, 0.2366 * x) - 1) / 10;
  }
  
  function calculateLineSkillScores(summoners) {
    return summoners.map(summoner => {
      const { skillScore, sortedLines } = summoner;
      const lineSkillScores = sortedLines.map(line => transferFunction1(line) * skillScore);
      const lineWeights = lineSkillScores.map(score => transferFunction2(score));
      return { ...summoner, lineSkillScores, lineWeights };
    });
  }
  
  function weightedRandomSelection(weights) {
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
    const random = Math.random() * totalWeight;
    let accumulatedWeight = 0;
  
    for (let i = 0; i < weights.length; i++) {
      accumulatedWeight += weights[i];
      if (random <= accumulatedWeight) {
        return i;
      }
    }
  
    return weights.length - 1;
  }
  
  function matchmaking(summoners) {
    if (summoners.length !== 10) {
      throw new Error('The list of summoners must have a length of 10.');
    }
  
    // Calculate line skill scores and line weights for each summoner
    const summonersWithScoresAndWeights = calculateLineSkillScores(summoners);
  
    // Initialize teams
    const team1 = [];
    const team2 = [];
  
    // For each index in the list, consider the weights on each summoner
    for (let i = 0; i < 5; i++) {
      const weights = summonersWithScoresAndWeights.map(summoner => summoner.lineWeights[i]);
  
      // Randomly choose two summoners based on these weights
      const index1 = weightedRandomSelection(weights);
      team1.push(summonersWithScoresAndWeights.splice(index1, 1)[0]);
  
      const newWeights = summonersWithScoresAndWeights.map(summoner => summoner.lineWeights[i]);
      const index2 = weightedRandomSelection(newWeights);
      team2.push(summonersWithScoresAndWeights.splice(index2, 1)[0]);
    }
  
    return { team1, team2 };
  }
  
  // Example data
  const summoners = [
    { skillScore: 15, sortedLines: [8, 10, 2, 0, 0] },
    { skillScore: 16, sortedLines: [0, 10, 2, 0, 8] },
    { skillScore: 17, sortedLines: [20, 0, 0, 0, 0] },
    { skillScore: 18, sortedLines: [0, 0, 0, 20, 0] },
    { skillScore: 12, sortedLines: [0, 0, 20, 0, 0] },
    { skillScore: 8, sortedLines: [1, 2, 3, 4, 10] },
    { skillScore: 22, sortedLines: [2, 9, 5, 0, 4] },
    { skillScore: 21, sortedLines: [0, 0, 2, 3, 15] },
    { skillScore: 8, sortedLines: [8, 0, 2, 0, 10] },
    { skillScore: 8, sortedLines: [0, 0, 12, 8, 0] },
  ];
  
  const { team1, team2 } = matchmaking(summoners);
  console.log('Team 1:', team1);
  console.log('Team 2:', team2);
  