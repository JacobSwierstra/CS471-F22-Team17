// Import installed dependencies
const Discord = require('discord.js');
const {
	prefix,
	token,
} = require('./config.json');
const ytdl = require('ytdl-core');

// Create client and login with token
const client = new Discord.Client();
client.login(token);

// Basic listeners
client.once('ready', () => {
    console.log('Ready!');
});
client.once('reconnecting', () => {
console.log('Reconnecting!');
});
client.once('disconnect', () => {
console.log('Disconnect!');
});

// Listen to messages
client.on('message', async message => {
    // Ignore messages from the bot
    if (message.author.bot) return;
    // Ignore messages that don't start with the prefix
    if (!message.content.startsWith(prefix)) return;

    // Hello world command
    if (message.content.startsWith(`${prefix}test`)) {
        message.channel.send('Hello World!');
    }
});