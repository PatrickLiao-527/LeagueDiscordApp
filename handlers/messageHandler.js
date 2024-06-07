const registerCommand = require('../commands/register');
const memberCommand = require('../commands/members');
const matchCommand = require('../commands/match');
const removeCommand = require('../commands/remove');
const helpCommand = require('../commands/help');

module.exports = (client, message) => {
    if (message.content.startsWith('!register')) {
        registerCommand(client, message);
    } else if (message.content.startsWith('!members')) {
        memberCommand(client, message);
    } else if (message.content.startsWith('!match')) {
        matchCommand(client, message);
    } else if (message.content.startsWith('!remove')) {
        removeCommand(client, message);
    } else if (message.content.startsWith('!help')) {
        helpCommand(client, message);
    }
};
