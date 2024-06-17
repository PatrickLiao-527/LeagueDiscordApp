function transferFunction1(x) {
  console.log(`transferFunction1 input: ${x}`);
  const result = (Math.log(0.6 * (x + 0.3)) + 0.8)/2;
  console.log(`transferFunction1 output: ${result}`);
  return result;
}

function transferFunction2(x) {
  console.log(`transferFunction2 input: ${x}`);
  const result = (Math.pow(1.5, 0.29 * x) - 1) / 10;
  console.log(`transferFunction2 output: ${result}`);
  return result;
}

function calculateLineSkillScores(summoners) {
  return summoners.map(summoner => {
    const { skillScore, sortedLanes } = summoner;
    console.log(`Calculating line skill scores for summoner ${summoner.gameName} with skillScore ${skillScore} and sortedLanes ${sortedLanes}`);
    if (!sortedLanes || !Array.isArray(sortedLanes)) {
      console.error(`Invalid sortedLanes for summoner ${summoner.gameName}: ${sortedLanes}`);
      return { ...summoner, lineSkillScores: [], lineWeights: [] };
    }
    const lineSkillScores = sortedLanes.map(line => {
      const score = transferFunction1(line) * skillScore;
      console.log(`Line skill score for ${summoner.gameName}: ${score}`);
      return score;
    });
    const lineWeights = lineSkillScores.map(score => {
      const weight = transferFunction2(score);
      console.log(`Line weight for score ${score} of ${summoner.gameName}: ${weight}`);
      return weight;
    });
    return { ...summoner, lineSkillScores, lineWeights };
  });
}

function weightedRandomSelection(weights) {
  console.log(`Selecting with weights: ${weights}`);
  const totalWeight = weights.reduce((acc, weight) => acc + Math.max(0, weight || 0), 0);
  console.log(`Total weight: ${totalWeight}`);
  if (totalWeight === 0) {
    console.error(`Invalid total weight: ${totalWeight}`);
    return Math.floor(Math.random() * weights.length); // Fallback selection
  }
  const random = Math.random() * totalWeight;
  let accumulatedWeight = 0;

  for (let i = 0; i < weights.length; i++) {
    accumulatedWeight += Math.max(0, weights[i] || 0);
    if (random <= accumulatedWeight) {
      console.log(`Selected index ${i} with random ${random} and accumulatedWeight ${accumulatedWeight}`);
      return i;
    }
  }

  return weights.length - 1;
}

function convertToPlainObject(summoner) {
  if (typeof summoner.toObject === 'function') {
    return summoner.toObject();
  }
  return summoner;
}

function matchmaking(summoners) {
  if (summoners.length !== 10) {
    throw new Error('The list of summoners must have a length of 10.');
  }

  // Convert all summoners to plain objects
  const plainSummoners = summoners.map(convertToPlainObject);

  // Calculate line skill scores and line weights for each summoner
  const summonersWithScoresAndWeights = calculateLineSkillScores(plainSummoners);

  console.log('Summoners with Scores and Weights:', JSON.stringify(summonersWithScoresAndWeights, null, 2));

  // Initialize teams
  const team1 = [];
  const team2 = [];
  let team1TotalScore = 100;
  let team2TotalScore = 100;
  let attempts = 0;
  const maxAttempts = 100; // Safeguard to prevent infinite loop

  // For each index in the list, consider the weights on each summoner
  while (team1TotalScore > 50 && team2TotalScore > 50 && Math.abs(team2TotalScore - team1TotalScore) < 25 && attempts < maxAttempts) {
    team1TotalScore = 0;
    team2TotalScore = 0;
    attempts++;
    for (let i = 0; i < 5; i++) {
      const weights = summonersWithScoresAndWeights.map(summoner => Math.max(0, summoner.lineWeights[i] || 0));
      console.log(`Weights for index ${i}: ${weights}`);

      // Randomly choose two summoners based on these weights
      const index1 = weightedRandomSelection(weights);
      if(i%2==0){
      team1.push(summonersWithScoresAndWeights.splice(index1, 1)[0]);
      team1TotalScore += transferFunction1(team1[team1.length -1].sortedLanes[i]) * team1[team1.length - 1].skillScore;
      }
      else{
        team2.push(summonersWithScoresAndWeights.splice(index1, 1)[0]);
        team2TotalScore += transferFunction1(team2[team2.length -1].sortedLanes[i]) * team2[team2.length - 1].skillScore;
        }
      const newWeights = summonersWithScoresAndWeights.map(summoner => Math.max(0, summoner.lineWeights[i] || 0));
      console.log(`New Weights for index ${i} after selecting index1: ${newWeights}`);
      const index2 = weightedRandomSelection(newWeights);
      if(i%2==0){
      team2.push(summonersWithScoresAndWeights.splice(index2, 1)[0]);
      team2TotalScore += transferFunction1(team2[team2.length -1].sortedLanes[i]) * team2[team2.length - 1].skillScore;
      }
      else{
        team1.push(summonersWithScoresAndWeights.splice(index2, 1)[0]);
        team1TotalScore += transferFunction1(team1[team1.length -1].sortedLanes[i]) * team1[team1.length - 1].skillScore;
      }
    }
  }

  if (attempts >= maxAttempts) {
    console.error('Max attempts reached, exiting loop to prevent infinite execution.');
  }

  // Print detailed team information
  console.log('Final Teams:', JSON.stringify({ team1, team2, team1TotalScore, team2TotalScore }, null, 2));
  return { team1, team2, team1TotalScore, team2TotalScore };
}

module.exports = {
  matchmaking
};
