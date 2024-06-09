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

            await interaction.reply('Please enter your bias:');
            const biasCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

            await Summoner.deleteOne({ discordId: interaction.user.id });
            existingSummoner.bias = parseInt(biasCollector);

            await summoner.save();

        } catch (error) {
            console.error('Error removing summoner data:', error.message);
            await interaction.reply('An error occurred while trying to delete your data. Please try again later.');
        }
    },
};
