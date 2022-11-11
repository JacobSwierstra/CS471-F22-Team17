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

// Queue for songs
const queue = new Map();
var connection;
var playing;

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
        if (!voiceChannel && (message.content.startsWith(prefix))) {
            message.channel.send("You need to be in a voice channel to play music!");
            return;
        }
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            message.channel.send("I need the permissions to join and speak in your voice channel!");
            return;
        }
        try {
            connection = await voiceChannel.join();
            return;
        } catch (err) {
            console.log(err);
            return message.channel.send(err);
        }
    }

    //pause command
    if (message.content.startsWith(`${prefix}pause`)) {
        const voiceChannel = message.member.voice.channel;
        // test if user is in voice channel
        if (!voiceChannel && (message.content.startsWith(prefix))) {
            message.channel.send("You need to be in a voice channel to play/pause music!");
            return;
        } else if (!connection) { // test if bot is in voice channel
            message.channel.send("I need to be in a voice channel to play/pause music!");
            return;
        } else {
            pause(message.guild, message);
            return;
        }
    }


    //skip command
    if (message.content.startsWith(`${prefix}skip`)) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel && (message.content.startsWith(prefix))) {
            message.channel.send("You need to be in a voice channel to play/pause music!");
            return;
        } else if (!connection) {
            message.channel.send("I need to be in a voice channel to skip music!");
            return;
        } else {
            const serverQueue = queue.get(message.guild.id);
            if (!serverQueue) {
                message.channel.send("There is no song playing!");
                return;
            } else if (!serverQueue.songs[1]) {
                message.channel.send("There are no more songs in the queue please use leave command");
                return;
            } else {
                try {
                    skip(serverQueue);
                    message.channel.send("current song skipped!");
                    return;
                } catch (err) {
                    console.log(err);
                    return message.channel.send(err);
                }
            }
        }
    }

    // play command
    const serverQueue = queue.get(message.guild.id);
    if (message.content.startsWith(`${prefix}play`)) {
        // checks to see if bot has joined the messenger's voice channel
        if (!client.voice.connections.find(i => i.channel.id === message.member.voice.channel.id)) {
            if (playing) {
                message.channel.send("I can only play music in one channel at a time!")
            } else {
                message.channel.send("Please run !join to allow me in your voice channel.");
            }
            return;
        }
        addSongs(message, serverQueue);
        return;
    }


    //leave command
    if (message.content.startsWith(`${prefix}leave`)) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel && (message.content.startsWith(prefix))) {
            message.channel.send("You need to be in a voice channel to give me commands!");
            return;
        }
        try {
            if (connection) {
                leaving(serverQueue);
                message.channel.send("Okay! See you later");
                connection = voiceChannel.leave();
                return;
            } else {
                message.channel.send("I am not currently in a voice channel");
            }
        } catch (err) {
            message.channel.send("ERROR: Please try again");
            console.log(err);
            return message.channel.send(err);
        }
    }

    // clear command
    if (message.content.startsWith(`${prefix}clear`)) {
        if (!serverQueue || !serverQueue.songs || serverQueue.songs.length < 2) {
            message.channel.send("Queue is already empty!");
        } else {
            serverQueue.songs = [];
            message.channel.send("Queue cleared!");
        }
    }

    // queue command
    if (message.content.startsWith(`${prefix}queue`)) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel && (message.content.startsWith(prefix))) {
            message.channel.send("You need to be in a voice channel to give me commands!");
            return;
        // } else if (!connection) {
        //     message.channel.send("I need to be in a voice channel to show you the queue!");
        //     return;
        } else if (serverQueue == null || serverQueue.songs == null || serverQueue.songs.length < 2) {
            /* prints if any elements of the serverQueue are null or songs only contains the current playing song */
            message.channel.send("Queue is empty! Add more songs!");
        }
    }

});


function leaving(serverQueue) {
    if (serverQueue) {
        serverQueue.songs = null;
        let dispatcher = serverQueue.connection.dispatcher;
        dispatcher.end();
        playing = false;
    }
}

async function addSongs(message, serverQueue) {
    const voiceChannel = message.member.voice.channel;
    const args = message.content.split(" ");
    const songInfo = await ytdl.getInfo(args[1]);
    // creates song object with title and url
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url
    };

    // creates queue
    if (!serverQueue || serverQueue.songs == null) {
        const queueContract = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueContract);

        queueContract.songs.push(song);

        try {
            // attempts to play song
            queueContract.connection = connection;
            play(message.guild, queueContract.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    // checks if song is empty
    if (!song) {
        //serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        playing = false;
        return;
    }

    // Plays song specified by url
    const dispatcher = serverQueue.connection
        .play(ytdl(song.url), { filter: "audioonly" })
        .on("finish", () => {
            if (serverQueue.songs != null) {
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            }
        })
        .on("error", error => console.error(error));
    playing = true;
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

//skip command
function skip(serverQueue) {
    const dispatcher = serverQueue.connection.dispatcher;
    if (!serverQueue || serverQueue.songs == null) {
        return;
    } else {
        dispatcher.end();
        return;
    }
}

//pause function
function pause(guild, message) {
    const serverQueue = queue.get(guild.id);
    //empty queue
    if (!serverQueue) {
        return message.channel.send("There is no song playing!");
    } else {
        const dispatcher = serverQueue.connection.dispatcher;
        if (!dispatcher.paused) {
            dispatcher.pause();
            playing = false;
            return message.channel.send("Music paused!");
        }
    }
}