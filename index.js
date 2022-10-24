// Import installed dependencies
const Discord = require("discord.js");
const {
	prefix,
	token,
} = require("./config.json");
const ytdl = require("ytdl-core");

// Create client and login with token
const client = new Discord.Client();
client.login(token);

// Basic listeners
client.once('ready', () => {
    console.log('Ready!');
    client.user.setActivity({
        name: "Your Commands",
        type: "LISTENING"
    });
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
        message.channel.send('Hello World!');//.reply if want to @ the user in message
        return;
    }
    // join command
    if (message.content.startsWith(`${prefix}join`)) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel && (message.content.startsWith(prefix))){
           message.channel.send("You need to be in a voice channel to play music!");
           return;
        }
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            message.channel.send("I need the permissions to join and speak in your voice channel!");
            return;
        }
        try {
            var connection = await voiceChannel.join();
            return;
        } catch (err) {
            console.log(err);
            return message.channel.send(err);
        }
    }

    // leave command
    if (message.content.startsWith(`${prefix}leave`)) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel && (message.content.startsWith(prefix))){
           message.channel.send("You need to be in a voice channel to give me commands!");
           return;
        }
    // const permissions = voiceChannel.permissionsFor(message.client.user);
    //     if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    //         message.channel.send("You need the permissions to send me commands!");
    //         return;
    //     }
        try {
            message.channel.send("Okay! See you later");
            var connection = voiceChannel.leave();
            return;
        } catch (err) {
            console.log(err);
            return message.channel.send(err);
        }
    }
});