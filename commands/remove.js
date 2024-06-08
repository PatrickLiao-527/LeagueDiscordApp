const Summoner = require('../models/summoners');

module.exports = {
    name: 'remove',
    description: 'Remove your registration',
    async execute(interaction) {
        try {
            const existingSummoner = await Summoner.findOne({ discordId: interaction.user.id });
            if (!existingSummoner) {
                await interaction.reply('You are not registered. Use the /register command to sign up.');
                return;
            }

            await Summoner.deleteOne({ discordId: interaction.user.id });
            await interaction.reply('😢 Your data has been deleted. Hope to see you back soon!');
        } catch (error) {
            console.error('Error removing summoner data:', error.message);
            await interaction.reply('An error occurred while trying to delete your data. Please try again later.');
        }
    },
};
