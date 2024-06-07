const Summoner = require('../models/summoners');

module.exports = async (client, message) => {
    const existingSummoner = await Summoner.findOne({ discordId: message.author.id });
    if (!existingSummoner) {
        message.channel.send('You are not registered. Use !register to sign up.');
        return;
    }

    await Summoner.deleteOne({ discordId: message.author.id });
    message.channel.send('😢 Your data has been deleted. Hope to see you back soon!');
};
