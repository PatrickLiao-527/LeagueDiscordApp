const { registerQueue } = require('./register');

module.exports = async (client, message) => {
    if (registerQueue.length === 0) {
        message.channel.send('The registration queue is currently empty.');
    } else {
        const queueList = registerQueue.map((entry, index) => `${index + 1}. ${entry.message.author.username}`).join('\n');
        message.channel.send(`📋 **Current Registration Queue:**\n${queueList}`);
    }
};
