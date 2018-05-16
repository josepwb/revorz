const fs = require('fs');
const keys = require('./keys.json');
const key = keys.imageAPIKeys;
const token = keys.botToken;
const Discord = require("discord.js");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const client = new Discord.Client({disableEveryone: true, autoReconnect:true});
const DBL = require("dblapi.js");
const dbl = new DBL(keys.discordbotsToken, client);

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', message => {
    if (message.content === 'ping') {
    	message.channel.send('PONG!');
  	}
});

client.on('message', message => {
    if (message.content === 'bing') {
    	message.reply('BONG!');
  	}
});

// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);
