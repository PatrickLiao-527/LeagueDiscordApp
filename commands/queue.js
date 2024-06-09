const { registerQueue } = require('./register');

module.exports = {
    name: 'queue',
    description: 'Displays the current registration queue',
    async execute(interaction) {
        if (registerQueue.length === 0) {
            await interaction.reply('The registration queue is currently empty.');
        } else {
            const queueList = registerQueue.map((entry, index) => `${index + 1}. ${entry.message.author.username}`).join('\n');
            await interaction.reply(`📋 **Current Registration Queue:**\n${queueList}`);
        }
    }
};
