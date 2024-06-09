const Summoner = require('../models/summoners');
const {calculateSkillScore} = require('../utils/calculateSkillScore'); // Adjusted import
module.exports = {
    name: 'bias',
    description: 'Create a bias on your performance',
    async execute(interaction) {
        try {
            const existingSummoner = await Summoner.findOne({ discordId: interaction.user.id });
            if (!existingSummoner) {
                await interaction.reply('You are not registered. Use the /register command to sign up.');
                return;
            }

            await interaction.reply('Please enter your bias value:');
            
            const filter = response => response.author.id === interaction.user.id;
            const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

            collector.on('collect', async response => {
                const biasValue = parseInt(response.content, 10);
                if (isNaN(biasValue)) {
                    await interaction.followUp('Invalid bias value. Please enter a valid number.');
                } else {
                    existingSummoner.bias = biasValue;
                    existingSummoner.skillScore = calculateSkillScore(existingSummoner); // Recalculate skill score
                    await existingSummoner.save();
                    await interaction.followUp(`Your bias has been updated to ${biasValue} and your skill score recalculated.`);
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp('You did not enter a bias value in time.');
                }
            });

        } catch (error) {
            console.error('Error updating bias:', error.message);
            await interaction.reply('An error occurred while trying to update your bias. Please try again later.');
        }
    },
};
