// Checkout the wiki here: https://github.com/iGotYourBack/TimePlayed/wiki
const fs = require('fs');
const keys = require('./keys.json');
const key = keys.imageAPIKeys;
const token = keys.botToken;
const Discord = require("discord.js");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const client = new Discord.Client({disableEveryone: true, autoReconnect:true});
const DBL = require("dblapi.js");
const dbl = new DBL(keys.discordbotsToken, client);

// Convert functions

function sinceDate(since) {
  var d = new Date();
  var num = Number(since.substring(0, since.length - 1))

  if(since.endsWith("m")) {
    d.setMinutes(d.getMinutes() - num);
  }
  if(since.endsWith("h")) {
    d.setHours(d.getHours() - num);
  }
  if(since.endsWith("d")) {
    d.setDate(d.getDate() - num);
  }
  if(since.endsWith("w")) {
    d.setDate(d.getDate() - num * 7);
  }
  if(since == "today") {
    d.setHours(6);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0)
  }
  return d;
}
function timeConvert(n) {
  if(n < 0) {
    return n;
  }
  var num = n;
  var hours = (num / 60);
  var rhours = Math.floor(hours);
  var minutes = (hours - rhours) * 60;
  var rminutes = Math.round(minutes);
  if(rhours == 0 && minutes == 0) {
    return "no"
  }
  if(rhours > 0) {
    if(rminutes == 0) {
      if(rhours == 1) {
        return rhours + " hour";
      } else {
        return rhours + " hours";
      }
    }
    if(rminutes > 1) {
      if(rhours == 1) {
        return rhours + " hour and " + rminutes + " minutes";
      } else {
        return rhours + " hours and " + rminutes + " minutes";
      }
    }
    if(rminutes == 1) {
      if(rhours == 1) {
        return rhours + " hour en " + rminutes + " minutes";
      } else {
        return rhours + " hours and " + rminutes + " minutes";
      }
    }
  } else {
    if(rminutes == 1) {
      return rminutes + " minute";
    } else {
      return rminutes + " minutes";
    }
  }
}
function ordinalSuffix(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}
function convertSince(since) {
  var num = Number(since.substring(0, since.length - 1))
  if(num > 1) {
    suffix += "s"
  }

  var suffix;
  if(since.endsWith("m")) {
    suffix = "minute"
    prefix = "In"
  }
  if(since.endsWith("h")) {
    suffix = "hour"
    prefix = "In"
  }
  if(since.endsWith("d")) {
    suffix = "day"
    prefix = "In"
  }
  if(since.endsWith("w")) {
    suffix = "week"
    prefix = "In"
  }
  if(since == "today") {
    return `Today`
  }
  
  return `${prefix} the last ${num} ${suffix}`
  
}
function MSDays(t){
  var cd = 24 * 60 * 60 * 1000,
      ch = 60 * 60 * 1000,
      d = Math.floor(t / cd),
      h = Math.floor( (t - d * cd) / ch),
      m = Math.round( (t - d * cd - h * ch) / 60000),
      pad = function(n){ return n < 10 ? '0' + n : n; };
  if( m === 60 ){
    h++;
    m = 0;
  }
  if( h === 24 ){
    d++;
    h = 0;
  }
  return d;
}
// Functions about playtime
function timePlayed(id, game, since, overwriteFilter) {
  if(privateCheck(id) == true) {
    return -1;
  }
  if(fs.existsSync(`./data/userdata/${id}.csv`)) {
    var userObject = [];
    var logStart
    if(fs.existsSync(`./data/startDates/${id}.txt`)) {
      logStart = new Date(fs.readFileSync(`./data/startDates/${id}.txt`));
    } else {
      fs.appendFileSync(`./data/startDates/${id}.txt`, new Date())
      logStart = new Date();
    }

    // Push all the data to an array of objects
    fs.readFileSync(`./data/userdata/${id}.csv`).toString().split("\n").forEach(function(value) {
      userObject.push({date: value.split(" gamePlaying: ")[0], game: value.split(" gamePlaying: ")[1]})
    });

    // If a game is specified, filter the userObject's correct game out of the array
    if(game) {
      userObject = userObject.filter(function(currentValue) {
        if(currentValue.game != null || undefined && game != undefined || null) {
          return currentValue.game.toLowerCase() == game.toLowerCase();
        }
      });
    }
    
    // Filter the correct time out of the array
    if(since != undefined && since.length > 0) {
      userObject = userObject.filter(function(value) {
        return new Date(value.date) > sinceDate(since);
      });
    }
    // Return the length of the array (minutes of playtime)
    return userObject.length;
  } else {
    return 0;
  }
}
function privateCheck(id) {
  if(fs.existsSync(`./data/privateUsers/${id}.csv`)) {
    return true;
  } else {
    return false;
  }
}
function convertPresence(user, type) {
  var userStatus;
  var embedColor;
  const onlineEmoji = client.emojis.find("name", "online");
  const idleEmoji = client.emojis.find("name", "idle");
  if(user.presence.status == "dnd") {
    userStatus = "do not disturb :no_entry:";
    embedColor = "#db2525"
  }
  if(user.presence.status == "offline") {
    userStatus = "offline/invisible";
    embedColor = "#8c8c8c"
  }
  if(user.presence.status == "idle") {
    userStatus = `idle ${idleEmoji}`
    embedColor = "#e29b16"
  }
  if(user.presence.status == "online") {
    userStatus = `online ${onlineEmoji}`
    embedColor = "0x00AE86"
  }
  if(type == "game") {
    return userStatus;
  }
  if(type == "color" || type == "colour") {
    return embedColor;
  }
}
function checkUsers() {
  var usersPositive = 0;
  function fileUsers(user, id) {
    if(user.presence.game == null || user.bot) {
      if(fs.existsSync(`./data/startDates/${id}.txt`) == false) {
        return fs.appendFileSync(`./data/startDates/${id}.txt`, new Date())
      }
    } else {
      usersPositive += 1;
      fs.appendFileSync(`./data/userdata/${id}.csv`, `${Date()} gamePlaying: ${user.presence.game.name}\n`);
    }
  }
    client.users.forEach(fileUsers);
    console.log(`${Date()}: ${client.users.size} users checked, ${usersPositive} playing a game`);
}
// GuildConf function
function getGuildConfig(guildID, defaultValue) {
  if(fs.existsSync(`./data/guildSettings/${guildID}.json`) == false || defaultValue == true) {
    var defaultSettings = {
      prefix: "!!",
      rankingChannel: "none",
      enableRankingMentions: "true",
      defaultGame: "Fortnite",
      leaderboardAmount: "5"
    }
    fs.writeFileSync(`./data/guildSettings/${guildID}.json`, JSON.stringify(defaultSettings), 'utf8');
    console.log(`New settings file created for ${client.guilds.find("id", guildID).name} (ID: ${guildID})`)
    return defaultSettings;
  } else {
    var guildSettings = fs.readFileSync(`./data/guildSettings/${guildID}.json`)
    return JSON.parse(guildSettings);
  }

}
// Leaderboard functions
function getTopList(since, guildID, newBoolean) {
  // First check if the leaderboard is cached, if so it will return the cached leaderboard for faster replies
  if(fs.existsSync(`./data/cache/${guildID}/weekly.json`) && newBoolean != true && since == "7d") {
    return JSON.parse(fs.readFileSync(`./data/cache/${guildID}/weekly.json`))
  }
  if(fs.existsSync(`./data/cache/${guildID}/daily.json`) && newBoolean != true && since == "today") {
    return JSON.parse(fs.readFileSync(`./data/cache/${guildID}/daily.json`))
  }
  if(fs.existsSync(`./data/cache/${guildID}/always.json`) && newBoolean != true && since == undefined) {
    return JSON.parse(fs.readFileSync(`./data/cache/${guildID}/always.json`))
  }
  var guildConf = getGuildConfig(guildID);
  var guild = client.guilds.find("id", guildID);
  function topUsers(user, id) {
    if(user.bot) {return;}
    if(fs.existsSync(`./data/userdata/${id}.csv`) == true && privateCheck(id) == false) {
      return {id: id, minutes: timePlayed(id, guildConf.defaultGame, since)}
    } else {
      return undefined;
    }
  }
  var topList = guild.members.map(topUsers);
  var topList = topList.filter(value => value != undefined);
  return topList.sort(function(a,b) {return (b.minutes > a.minutes) ? 1 : ((a.minutes > b.minutes) ? -1 : 0);} );
}
function getLeaderboardString(guild, guildConf) {
  function leaderboardString(sinceString, since) {
    var string = `**----------------- ${sinceString} -----------------**\n`
    var topList;
    var emptyString;
    var noMoreString;
    if(since == "7d") {
      topList = topListWeek;
      emptyString = `No one played ${guildConf.defaultGame} this week!`
      noMoreString = `No more users played ${guildConf.defaultGame} this week!`
      var d = new Date();
      d.setDate(d.getDate()-7);
      if(guild.joinedAt > d) {
        return `${string}I joined this server less than a week ago, so this leaderboard would be the same as the "Always" leaderboard. Go check out that one!`;
      }
    }
    if(since == "today") {
      topList = topListDay;
      emptyString = `No one played ${guildConf.defaultGame} today!`
      noMoreString = `No more users played ${guildConf.defaultGame} today!`
      var vanochtend = new Date();
      vanochtend.setHours(6);
      vanochtend.setMinutes(0);
      vanochtend.setSeconds(0);
      vanochtend.setMilliseconds(0)
      if(guild.joinedAt > vanochtend) {
        return `${string}I joined this server today, so this leaderboard would be the same as the "Always" leaderboard. Go check out that one!`;
      }
    }
    if(since == undefined || since == "") {
      noMoreString = `No more users have ever played ${guildConf.defaultGame}!`
      emptyString = `No one has ever played ${guildConf.defaultGame}!`
      topList = topListAll;
    }
    var l = guildConf.leaderboardAmount;
    var amount = 0;
    var i;
    for (i = 0; i < l; i++) {
      if(topList == undefined) {
        break;
      }
      if(topList[i] == undefined) {
        break;
      }
      if(topList[i].minutes == 0) {
        break;
      }
      if(i == 0) {
        if(timePlayed(topList[i].id, guildConf.defaultGame, since, true) > 0) {
          if(guildConf.enableRankingMentions == "true") {
            string += `1. <@${guild.members.find("id", topList[i].id).user.id}> ðŸ‘‘ *- ${timeConvert(timePlayed(topList[i].id, guildConf.defaultGame, since, true))}*\n`;
            amount ++;
          } else {
            string += `1. **${guild.members.find("id", topList[i].id).user.tag}** ðŸ‘‘ *- ${timeConvert(timePlayed(topList[i].id, guildConf.defaultGame, since, true))}*\n`;
            amount ++;
          }
        }
      } else {
        if(timePlayed(topList[i].id, guildConf.defaultGame, since, true) > 0) {
          if(guildConf.enableRankingMentions == "true") {
            string += `${i + 1}. <@${guild.members.find("id", topList[i].id).user.id}> *- ${timeConvert(timePlayed(topList[i].id, guildConf.defaultGame, since, true))}*\n`;
            amount ++;
          } else {
            string += `${i + 1}. **${guild.members.find("id", topList[i].id).user.tag}** *- ${timeConvert(timePlayed(topList[i].id, guildConf.defaultGame, since, true))}*\n`;
            amount ++;
          }
        }
      }
    }
    if(amount < guildConf.leaderboardAmount) {
      if(amount == 0) {
        string += emptyString;
      } else {
        string += noMoreString;
      }
    }
    return string;
  }
  var topListWeek = getTopList("7d", guild.id, true);
  var topListDay = getTopList("today", guild.id, true);
  var topListAll = getTopList("", guild.id, true);
  if(!fs.existsSync(`./data/cache/${guild.id}`)) {
    fs.mkdirSync(`./data/cache/${guild.id}`)
  }
  fs.writeFileSync(`./data/cache/${guild.id}/weekly.json`, JSON.stringify(topListWeek))
  fs.writeFileSync(`./data/cache/${guild.id}/daily.json`, JSON.stringify(topListDay))
  fs.writeFileSync(`./data/cache/${guild.id}/always.json`, JSON.stringify(topListAll))
  fs.writeFileSync(`./data/cache/${guild.id}/date.txt`, Date())
  return `*${guild.name}'s* \`${guildConf.defaultGame}\` leaderboard:\n${leaderboardString("WEEKLY", "7d")}\n${leaderboardString("DAILY", "today")}\n${leaderboardString("ALL")}\n**------------------------------------------------**\nLast updated at: \`${Date().toString()}\`\nJoined guild at: \`${guild.joinedAt}\``
}
function updateRankingChannel() {
  client.guilds.forEach(function(guild) {
    var guildConf = getGuildConfig(guild.id);
    var rankingChannelID = guildConf.rankingChannel.replace("<#", "").replace(">", "");
    var rankingChannel = guild.channels.find("id", rankingChannelID);
    var premium = true;
    fs.readdirSync(`./data/premiumUsers/`).forEach(file => {
      if(fs.readFileSync(`./data/premiumUsers/${file}`) == guild.id) {
        premium = false;
      }
    })
    if(rankingChannel && premium == false) {
      // Permission check
      var botMember = guild.members.find("id", client.user.id);
      if(botMember.permissionsIn(rankingChannel).has("VIEW_CHANNEL") == false) {
        return console.log(`No permissions to read messages in ranking channel, aborting (server: ${guild.name})`);
      }
      if(botMember.permissionsIn(rankingChannel).has("SEND_MESSAGES") == false) {
        return console.log(`No permissions to send messages in ranking channel, aborting (server: ${guild.name})`);
      }
      if(botMember.permissionsIn(rankingChannel).has("MANAGE_MESSAGES") == false) {
        return console.log(`No permissions to manage messages in ranking channel, aborting (server: ${guild.name})`);
      }
      fetchBotMessages(20, rankingChannel)
        .then((message) => {
        if(message == undefined) {
          purge(50, rankingChannel).catch(err => {console.log("Error purging rankingChannel!\n" + err)})
          console.log(`${Date()}: Calculating ${guild.name} leaderboard...`)
          rankingChannel.send(getLeaderboardString(guild, guildConf))
          console.log(`${Date()}: ${guild.name}: Leaderboard sent!`)
        } else {
          console.log(`${Date()}: Calculating ${guild.name} leaderboard...`)
          message.edit(getLeaderboardString(guild, guildConf))
          purge(50, rankingChannel).catch(err => {console.log("Error purging rankingChannel!\n" + err)})
          console.log(`${Date()}: ${guild.name}: Leaderboard updated!`)
        }
      })
        .catch((err) => {
          console.log("Error calculating leaderboard: \n" + err)
        })
    }
    if(rankingChannel && premium == true) {
      console.log(`${Date()}: Premium gone in ${guild.name} guild, not sending/editing leaderboard.`)
    }
  })
}

async function fetchBotMessages(limit, channel) {
  var fetched = await channel.fetchMessages({limit: limit});
  if(fetched.first()) {
    var botFetched = fetched.filter(currentMSG => currentMSG.author.id == client.user.id);
    if(botFetched.first()) {
      return botFetched.first()
    } else {
      return undefined
    }
  } else {
    return undefined
  }
}
async function purge(purgeLimit, channel) {
  var weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate()-7);
  var fetched = await channel.fetchMessages({limit: purgeLimit});
  if(fetched.first()) {
    // Filteren
    fetched = fetched.filter(currentMSG => currentMSG.author.id != client.user.id);
    // Deleten als er een fetched is
    function deleteMessage(currentMessage) {
      return currentMessage.message.delete()
    }
    channel.bulkDelete(fetched)
  }
  fetched = fetched.filter(function (msg) {return msg.author.id == "423433861167579136"});
}

function getThumbnail(game) {
  var searchQuery = game.replace(/ /g,"+") + "+logo";
  searchQuery = searchQuery.toLowerCase();
  if(fs.existsSync(`./data/thumbnails/${searchQuery}.csv`)) {
    return fs.readFileSync(`./data/thumbnails/${searchQuery}.csv`).toString();
  } else {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", `https://www.googleapis.com/customsearch/v1?q=${searchQuery}&cx=017970009256719307042:tuvhnys75s0&filter=0&imgSize=icon&num=1&key=${key}`, false );
    xmlHttp.send( null );
    var searchThumbnail = xmlHttp.responseText;
    var searchObject = JSON.parse(searchThumbnail);
    console.log(`${Date()}: New search result for: ${searchQuery}, filed it.`);
    if(searchObject) {
      if(searchObject.items) {
        if(searchObject.items[0]) {
          if(searchObject.items[0].pagemap) {
            if(searchObject.items[0].pagemap.cse_image) {
              var thumbnailURL = searchObject.items[0].pagemap.cse_image[0].src
            }
          }
        }
      }
      
    }
    
    fs.appendFileSync(`./data/thumbnails/${searchQuery}.csv`, thumbnailURL);
    return thumbnailURL;
  }
}


var commands = [
  "help",
  "timeplayed",
  "top",
  "status",
  "playing",
  "private",
  "botinfo",
  "setconfig",
  "showconfig",
  "topplayed"
]
var privateCommands = [
  "timeplayed",
  "top",
  "topplayed"
]
var aliases = {
  timeplayed: [
    "tp",
    "playtime"
  ],
  top: [
    "servertop"
  ],
  topplayed: [
    "topp",
    "topgames",
    "gamestop"
  ],
  private: [
    "setprivate",
    "incognito"
  ],
  setconfig: [
    "sc",
    "config",
    "settings",
    "setconf"
  ],
  showconfig: [
    "viewconfig",
    "viewsettings",
    "showconf"
  ]
}

function postStats() {
  dbl.postStats(client.guilds.size);
  return console.log("Stats posted!")
}

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

client.on("disconnect", closeEvent => {
  console.log(`Disconnected! Reason: ${closeEvent}`);
});
client.on("guildCreate", guild => {
  client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  postStats()
  getGuildConfig(guild.id);
  var found = false;
  guild.channels.forEach(function(channel, id) {
      if(found == true || channel.type != "text") {
        return;
      }
      if(guild.me.permissionsIn(channel).has("SEND_MESSAGES") && guild.me.permissionsIn(channel).has("VIEW_CHANNEL")) {
        found = true;
        return channel.send("**Hello! Thanks for inviting me to your server!**\nThere are a few things you need to know about me:\n- Type `!!help` to get a list of my commands\n- My default prefix is `!!`, but it can be changed with `!!setConfig prefix (newPrefix)`\n- To get to know more about me, take a look at the wiki (<https://goo.gl/7Mx9dd>)\n- If you come across any trouble you can always join the support server (<https://discord.gg/3d8K6ak>)\n- Your playtime is **based on Discord presences**, so if your Discord is closed or your game status is disabled the data can be inaccurate\n- The bot starts measuring everyone in this server's playtime from now on, so please give give it some time and don't instantly kick it if it's not working as expected\n**Greetings!**")
      }
  })
  console.log(`${Date()}: Joined new guild: ${guild.name} Sent welcome message: ${found}`)
});
client.on("guildRemove", guild => {
  client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  postStats()
  console.log(`${Date()}: Left guild: ${guild.name}`)
})
client.on("guildMemberAdd", member => {
  client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  if(fs.existsSync(`./data/startDates/${member.id}.txt`) == false) {
    return fs.appendFileSync(`./data/startDates/${member.id}.txt`, new Date())
  }
})
client.on("guildMemberRemove", member => {
  client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
})

client.on("ready", () => {
  client.user.setActivity(`${client.users.size} users | !!help`, { type: 'WATCHING' });
  console.log(`Bot is ready!`);

  // Logging in how many/which guilds the bot is in
  var string = `Guilds: (${client.guilds.size})\n`
  function addLine(guild, id) {
    string += guild.name + "\n"
  }
  client.guilds.forEach(addLine)
  console.log(string)

  setInterval(checkUsers, 60000);
  setInterval(updateRankingChannel, 600000);
  updateRankingChannel();
  setInterval(postStats, 1800000)
});

client.on("message", message => {
  if(message.author.bot) {return;}

  // This is just for me, to check in which/how many guilds the bot is
  if(message.channel.type == "dm" && message.author.id == "112237401681727488" && message.content == "!!guilds") {
    var string = `I'm in ${client.guilds.size} guilds:\n`
    function addLine(guild) {
      string += `Name: ${guild.name}, members: ${guild.members.size}\n`
    }
    client.guilds.forEach(addLine)
    return message.channel.send(string)
  }


  if(message.channel.type == "dm" || message.channel.type == "group") {
    return message.reply("Sorry, I'm not available in PM channels, please run my commands in a server text channel.")
  }
  var guildConf = getGuildConfig(message.guild.id); 
  var contentCMD = message.content.replace(guildConf.prefix, "").split(" ")[0];
  var arg = message.content.replace(guildConf.prefix + contentCMD, "").split(" ").clean("");
  var mention = message.mentions.users.first();

  // Delete rankingChannel messages
  if(message.channel == guildConf.rankingChannel) {
    message.delete()
  }

  // Check if message is a command

  // Return if the command doesn't start with the guild prefix
  if(message.content.startsWith(guildConf.prefix) == false) {
    return;
  }
  // Convert aliases to a regular command
  var counter = 0;
  var found = false;
  var command;
  Object.values(aliases).forEach(value => {
    for(var i = 0; i < value.length; i++) {
      if(contentCMD.toLowerCase() == value[i]) {
        found = true;
        command = Object.keys(aliases)[counter]
      }
    }
    counter ++;
  })
  if(found == false) {
    command = contentCMD.toLowerCase();
  }

  // Return if the meant command (alias already converted) isn't a command in the list of commands
  if(commands.indexOf(command) == -1) {
    return;
  }

  // From this point, I assume the user is running a command

  // If command is ran but bot has no perms to speak, send the author an error PM
  if(commands.indexOf(command) != -1 && message.guild.me.permissionsIn(message.channel).has("SEND_MESSAGES") == false) {
    return message.author.send(`Hi there, I saw you were trying to run the \`${message.content}\` command in the \`${message.guild.name}\` server, but I don't have the permissions to speak there! Please ask a server admin to give me the Send Messages permission or try to run my commands in another channel.`).catch(err => console.log(`Error sending no permission message: ${err}`))
  }
  // Log the command
  fs.appendFileSync(`./logs/${message.guild.id}.txt`, `${Date()}: User: ${message.author.tag}, Channel: #${message.channel.name}, Command: ${message.content}\n`);

  // Check if the message guild is premium (will be used later)
  var premium = true;
  fs.readdirSync(`./data/premiumUsers/`).forEach(file => {
    if(fs.readFileSync(`./data/premiumUsers/${file}`) == message.guild.id) {
      premium = false;
    }
  })

  // Check for private commands, if user/mention is set to private return and send a message
  if(mention && privateCheck(mention) == true && privateCommands.indexOf(command) != -1) {
    return message.reply(`Error: ${mention.username} has set their playtime to private! Ask them to run the \`${guildConf.prefix}private off\` command to make their playtime public.`)
  }  
  if(privateCheck(message.author.id) == true && privateCommands.indexOf(command) != -1) {
   return message.reply(`Error: your playtime is set to private! Run the \`${guildConf.prefix}private off\` to make your playtime public.`)
  }

  // Local function to check if an argument is a time specified, e.a. 3w, 5m, 7h
  function checkTimeFormat(string) {
    if(string === "today") {
      return true;
    }
    if(string.length > 3 && Number(string.substring(0, string.length - 1)) > 0) {
      if(string.endsWith("m") || string.endsWith("h") || string.endsWith("d") || string.endsWith("w")) {
        return -1;
      }
    }
    if(string.endsWith("m") || string.endsWith("h") || string.endsWith("d") || string.endsWith("w")) {
      if(Number(string.substring(0, string.length - 1)) > 0) {
        return true;
      }
    }
    return false;
  }
  var game = guildConf.defaultGame;
  var timePlayedWeek
  var timePlayedDay
  var timePlayedAll
  var timePlayedCustom
  var since
  var sinceWarning;
  // Define the game, and all timeplayed variables with commands where game can be specified (where mentions don't matter)
  if(command === "playing") {
    if(arg[0]) {
      game = message.content.replace(`${guildConf.prefix}${contentCMD} `, ``);
    }
  }
  // Define the game, and all timeplayed variables with commands where game can be specified (where mentions do matter)
  if(mention) {
    if(command === "topplayed" && arg[1]) {
      if(checkTimeFormat(arg[1]) == true) {
        since = arg[1]
      } else {
        return message.reply(`The game cannot be specified with the topPlayed command, why would you want to do that?\nPlease just use \`${guildConf.prefix}topPlayed @${mention.username}\` without a game specified if that's what you want.\nIf you're trying to specify a since time, please read the docs carefully: <https://goo.gl/rCYiyi>`)
      }
    }
    if(command === "timeplayed" && arg[1]) {
      if(checkTimeFormat(arg[1]) == -1) {
        return message.reply(`Please don't make the custom date value more than a two digit number!`)
      }
      if(checkTimeFormat(arg[1]) == true) {
        if(arg[2]) {
          game = message.content.replace(`${guildConf.prefix}${contentCMD} <@${mention.id}> ${arg[1]} `, ``);
        }
        since = arg[1]
        timePlayedCustom = timePlayed(mention.id, game, arg[1])
      } else {
        game = message.content.replace(`${guildConf.prefix}${contentCMD} <@${mention.id}> `, ``);
      }
    }
    
    if(since && new Date(fs.readFileSync(`./data/startDates/${mention.id}.txt`)) > sinceDate(since)) {
      sinceWarning = true;
    }

    if(timePlayedCustom == undefined) {
      timePlayedWeek = timePlayed(mention.id, game, "7d")
      timePlayedDay = timePlayed(mention.id, game, "today")
      timePlayedAll = timePlayed(mention.id, game)
    }
    
  } else {
    if(command === "topplayed" && arg[0]) {
      if(checkTimeFormat(arg[0]) == true) {
        since = arg[0]
      } else {
        return message.reply(`The game cannot be specified with the topPlayed command, why would you want to do that?\nPlease just use \`${guildConf.prefix}topPlayed\` without a game specified if that's what you want.\nIf you're trying to specify a since time, please read the docs carefully: <https://goo.gl/rCYiyi>`)
      }
    }
    if(command === "timeplayed" && arg[0]) {
      console.log(checkTimeFormat(arg[0]))
      if(checkTimeFormat(arg[0]) == -1) {
        return message.reply(`Please don't make the custom date value more than a two digit number!`)
      }
      if(checkTimeFormat(arg[0]) == true) {
        if(arg[1]) {
          var game = message.content.replace(`${guildConf.prefix}${contentCMD} ${arg[0]} `, ``);
        }
        since = arg[0]
        timePlayedCustom = timePlayed(message.author.id, game, arg[0])
      } else {
        var game = message.content.replace(`${guildConf.prefix}${contentCMD} `, ``);
      }
    }
    if(since && new Date(fs.readFileSync(`./data/startDates/${message.author.id}.txt`)) > sinceDate(since)) {
      sinceWarning = true;   
    }
    
    if(timePlayedCustom == undefined) {
      timePlayedWeek = timePlayed(message.author.id, game, "7d")
      timePlayedDay = timePlayed(message.author.id, game, "today")
      timePlayedAll = timePlayed(message.author.id, game)
    }
    
  }

  if(game.startsWith(`${guildConf.prefix}${contentCMD}`)) {
    return message.reply(`It seems like you're using the syntax of this command wrong!\nPlease use: \`${guildConf.prefix}timePlayed [@user] [time] [game]\`\nNeed more help? Visit the wiki: <https://goo.gl/RD6gBE>`)
  }
  
  // REGULAR COMMANDS
  if(command === "help") {
    const embed = new Discord.RichEmbed()
    .setAuthor(`Command help!`, client.user.avatarURL)
    .setColor(0x00AE86)
    .setDescription(`Here you'll find a list of all of my commands!\n- () argument is necessary\n- [] argument is optional.\n- The [time] argument should be specified as a number with \`m/h/d/w\` behind it or as \`today\`, for example: \`${guildConf.prefix}topPlayed 5d\``)
    .addField("Commands:", `**${guildConf.prefix}timeplayed** [@user] [time] [game] - Check your (or someone's) playtime\n**${guildConf.prefix}serverTop** [@user] - Check your (of someone's) personal leaderboard stats\n**${guildConf.prefix}topGames** [@user] [time] - Get a list of games you play the most\n**${guildConf.prefix}status** [@user] - Get the full presence info of someone\n**${guildConf.prefix}playing** [game] - Get a list of people playing a game\n**${guildConf.prefix}setPrivate** (on/off) - Set your playtime to private/public, if you're private no one will be able to view your platime and you won't appear on the leaderboard when enabled.\n${guildConf.prefix}**botInfo** - Get some cool information about the bot\n**${guildConf.prefix}setConfig** (key) (value) - Admin only, change the server config\n**${guildConf.prefix}showConfig** - Admin only, view the server config\n\n***Checkout full command descriptions [here](https://github.com/iGotYourBack/TimePlayed/wiki/2.-Commands) on the wiki!***`)
    message.channel.send({embed});
  }

  if(command === "playing") {
    var userArray = [];
    var stringCount = 0;
    var realCount = 0;
    var string = "";
    var morePeople = false;

    message.guild.members.forEach(function(user, id) {
      if(user.presence.game == null) {
        return;
      }
      if(stringCount >= 20) {
        if(user.presence.game.name.toLowerCase() == game.toLowerCase()) {
          realCount ++;
        }
        morePeople = true;
        return;
      }
      if(user.presence.game.name.toLowerCase() == game.toLowerCase()) {
        string += `- ${user.user.tag}\n`
        realCount ++;
        stringCount ++;
        
      }
    })

    if(stringCount == 0) {
      string = `Nobody is playing ${game}, you'll have to play with yourself :rolling_eyes:\n` + string;
    }
    if(stringCount == 1) {
      string = `**${stringCount} person is playing ${game}:**\n` + string;
    }
    if(stringCount > 1) {
      string = `**${stringCount} people are playing ${game}:**\n` + string;
    }
    if(morePeople == true) {
      string += `**And ${realCount - stringCount} more people, but I can't send a longer message!**`
    }
    message.channel.send(string);
  }

  if(command === "top") {
    if(premium == true) {
      return message.reply("Error: the leaderboard function is premium-only! To use this function, become a patreon at https://www.patreon.com/TimePlayed")
    }
    if(message.mentions.users.first() == null || undefined) {
      if(arg[0]) {
        return message.reply("Please mention someone to view their personal leaderboard\n*e.a.: !top @xVaql*")
      }
      if(timePlayedAll == 0) {
        return message.reply(`You haven't (according to Discord) ever played ${game} since I measured your playtime, so there's nothing to show you!\n*(playtime measured since: \`${fs.readFileSync(`./data/startDates/${message.author.id}.txt`)}\`)*`)
      }
      var placeWeek = getTopList("7d", message.guild.id).map(topListWeek => topListWeek.id).indexOf(message.author.id) + 1;
      var placeDay = getTopList("today", message.guild.id).map(topListDay => topListDay.id).indexOf(message.author.id) + 1;
      var placeAll = getTopList("", message.guild.id).map(topListAll => topListAll.id).indexOf(message.author.id) + 1;
      const embed = new Discord.RichEmbed()
      .setAuthor(`Your personal leaderboard`, message.author.avatarURL)
      .setColor(0x00AE86)
      .setFooter(`Leaderboard updated at: ${fs.readFileSync(`./data/cache/${message.guild.id}/date.txt`)}`)
      .setThumbnail(getThumbnail(game))
      if(guildConf.rankingChannel != "none") {
        embed.setDescription(`Check the top ${guildConf.leaderboardAmount} users in the ${guildConf.rankingChannel} channel`)
      }
      if(timePlayed(message.author.id, game, "7d") == 0) {
        embed.addField(`Weekly`, `You haven't played ${game} this week!`)
      } else {
        embed.addField(`Weekly`, `In the week list you are ranked: **${ordinalSuffix(placeWeek)}** *(${timeConvert(timePlayedWeek)})*`)
      }
      if(timePlayed(message.author.id, game, "today") == 0) {
        embed.addField(`Daily`, `You haven't played ${game} today!`)
      } else {
        embed.addField(`Daily`, `In the day list you are ranked: **${ordinalSuffix(placeDay)}** *(${timeConvert(timePlayedDay)})*`)
      }
      embed.addField(`Total`, `In the total list you are ranked: **${ordinalSuffix(placeAll)}** *(${timeConvert(timePlayedAll)})*`)
      message.channel.send({embed});
    } else {
      if(mention.bot) {
        return message.reply(`Sorry, I don't log the playtime of bots!`)
      }
      if(timePlayed(message.author.id, game) == 0) {
        return message.reply(`${mention.username} hasn't (according to Discord) ever played ${game} since I measured his playtime!\n*(playtime measured since: \`${fs.readFileSync(`./data/startDates/${mention.id}.txt`)}\`)*`)
      }
      var placeWeek = getTopList("7d", message.guild.id).map(topListWeek => topListWeek.id).indexOf(mention.id) + 1;
      var placeDay = getTopList("today", message.guild.id).map(topListDay => topListDay.id).indexOf(mention.id) + 1;
      var placeAll = getTopList("", message.guild.id).map(topListAll => topListAll.id).indexOf(mention.id) + 1;
      const embed = new Discord.RichEmbed()
      .setAuthor(`${mention.username}'s personal leaderboard`, mention.avatarURL)
      .setColor(0x00AE86)
      .setFooter(`Leaderboard updated at: ${fs.readFileSync(`./data/cache/${message.guild.id}/date.txt`)}`)
      .setThumbnail(getThumbnail(game))
      if(guildConf.rankingChannel != "none") {
        embed.setDescription(`Check the top ${guildConf.leaderboardAmount} users in the ${guildConf.rankingChannel} channel`)
      }
      if(timePlayed(mention.id, game, "7d") == 0) {
        embed.addField(`Weekly`, `${mention.username} hasn't played ${game} this week!`)
      } else {
        embed.addField(`Weekly`, `In the week list ${mention.username} is ranked: **${ordinalSuffix(placeWeek)}** *(${timeConvert(timePlayedWeek)})*`)
      }
      if(timePlayed(mention.id, game, "today") == 0) {
        embed.addField(`Daily`, `${mention.username} hasn't played ${game} today!`)
      } else {
        embed.addField(`Daily`, `In the day list ${mention.username} is ranked: **${ordinalSuffix(placeDay)}** *(${timeConvert(timePlayedDay)})*`)
      }
      embed.addField(`Total`, `In the total list ${mention.username} is ranked: **${ordinalSuffix(placeAll)}** *(${timeConvert(timePlayedAll)})*`)
      message.channel.send({embed});
    }
  }

  if(command === "status") {
    if(message.mentions.users.first() == null || undefined) {
      if(arg[0]) {
        return message.reply("Please mention someone to view their status")
      }
      var gameOfNiet;
      if(message.author.presence.game == undefined) {
        gameOfNiet = `According to Discord you aren't playing a game.`
      } else {
        gameOfNiet = `You're currently playing: **${message.author.presence.game.name}**`
      }
      var userStatus = convertPresence(message.author, "game");;
      var embedColor = convertPresence(message.author, "color");
      const embed = new Discord.RichEmbed()
      .setAuthor(`${message.author.username}'s status`, client.user.avatarURL)
      .setColor(embedColor)
      .setThumbnail(message.author.avatarURL)
      .addField(`Presence`, `Your Discord profile status is set to: **${userStatus}**`)
      .addField(`Game`, `${gameOfNiet}`)
      message.channel.send({embed});
    } else {
      if(mention == message.author) {
        message.reply(`Please use \`${guildConf.prefix}status\` without a mention to view your own status.`)
      } else {
        var gameOfNiet;
        if(mention.presence.game == undefined) {
          gameOfNiet = `According to Discord *${mention.username}* isn't playing a game.`
        } else {
            gameOfNiet = `*${mention.username}* is currently playing: **${mention.presence.game.name}**`
        }
        var userStatus = convertPresence(mention, "game");
        var embedColor = convertPresence(mention, "color");

        const embed = new Discord.RichEmbed()
        .setAuthor(`${mention.username}'s status`, client.user.avatarURL)
        .setColor(embedColor)
        .setThumbnail(mention.avatarURL)
        .addField(`Presence`, `${mention.username}'s profile status is set to: **${userStatus}**`)
        .addField(`Game`, `${gameOfNiet}`)
        message.channel.send({embed});
      }
    }
  }

  if(command === "topplayed") {
    var user;
    var string;
    if(mention) {
      if(mention.bot) {
        return message.reply(`Sorry, I don't log the playtime of bots!`)
      }
      if(fs.existsSync(`./data/userdata/${mention.id}.csv`) == false) {
        return message.reply(`*${mention.username}* hasn't (according to Discord) ever played a game since I measured your playtime!\n*(playtime measured since: \`${fs.readFileSync(`./data/startDates/${mention.id}.txt`)}\`)*`)
      }
      user = mention;
      if(since) {
        string = `\n${convertSince(since)}, **${mention.username}'s most played games are:**\n`
      } else {
        string = `\n**${mention.username}'s most played games are:**\n`
      }
    } else {
      if(fs.existsSync(`./data/userdata/${message.author.id}.csv`) == false) {
        return message.reply(`You haven't (according to Discord) ever played a game since I measured your playtime!\n*(playtime measured since: \`${fs.readFileSync(`./data/startDates/${message.author.id}.txt`)}\`)*`)
      }
      user = message.author;
      if(since) {
        string = `\n**${convertSince(since)}, your most played games are:**\n`
      } else {
        string = `\n**Your most played games are:**\n`
      }
    }

    // Get an array of objects of the games the user was playing
    var games = [];
    function pushObject(value) {
      var found = false;
      var game = value.split(" gamePlaying: ")[1]
      var date = value.split(" gamePlaying: ")[0]
      if(game == undefined) {
        return;
      }
      if(since && sinceDate(since) > new Date(date)) {
        return;
      }
      for(var i = 0; i < games.length; i++) {
        if (games[i].game == game) {
          found = true;
          games[i].time += 1;
          break;
        }
      }
      if(found == false) {
        games.push({game: game, time: 1})
      }
    }
    fs.readFileSync(`./data/userdata/${user.id}.csv`).toString().split("\n").forEach(pushObject);
    // Sort the list by playtime
    games.sort(function(a, b){return b.time-a.time});
    // Make a string of it
    for(var i = 0; i < 10; i++) {
      if(i == 0 && games[i] === undefined) {
        string += `**You haven't played any game in that time period!**`
        break;
      }
      if(games[i]) {
        string += `**${i + 1}. ${games[i].game}**: *${timeConvert(games[i].time)}*\n`
      }
    }
    if(sinceWarning == true) {
      if(mention) {
        string += `\n**Warning**: this information is inaccurate, because I started measuring ${mention.username}'s playtime later than the time you specified.\n(measuring started ${MSDays(Math.abs(new Date() - new Date(fs.readFileSync(`./data/startDates/${mention.id}.txt`))))} days ago)`
      } else {
        string += `\n**Warning**: this information is inaccurate, because I started measuring your playtime later than the time you specified.\n(measuring started ${MSDays(Math.abs(new Date() - new Date(fs.readFileSync(`./data/startDates/${message.author.id}.txt`))))} days ago)`
      }
    }
    return message.reply(string)
  }

  if(command === "timeplayed") {
    if(message.mentions.users.first() == null || undefined) {
      if(timePlayedAll == 0) {
        return message.reply(`You haven't (according to Discord) ever played ${game} since I measured your playtime!\n*(playtime measured since: \`${fs.readFileSync(`./data/startDates/${message.author.id}.txt`)}\`)*`)
      }
      if(timePlayedCustom >= 0) {
        var string = `${convertSince(since)}, you've played \`${timeConvert(timePlayedCustom)}\` ${game}!`
        if(sinceWarning == true) {
          string += `\n**Warning**: this information is inaccurate, because I started measuring your playtime later than the time you specified.\n(measuring started ${MSDays(Math.abs(new Date() - new Date(fs.readFileSync(`./data/startDates/${message.author.id}.txt`))))} days ago)`
        }
        return message.reply(string)
      }
      const embed = new Discord.RichEmbed()
      .setAuthor(`${message.author.username}'s ${game} playtime`, message.author.avatarURL)
      .setColor(3447003)
      .setFooter(`\"Total\" measured from ${fs.readFileSync(`./data/startDates/${message.author.id}.txt`)}`)
      .setThumbnail(getThumbnail(game))
      if(timePlayedWeek == -2) {
        embed.addField(`Last week`, `Your data hasn't been logged for a week, so I can't show you this information!`)
      } else {
        embed.addField(`Last week`, `You've played \`${timeConvert(timePlayedWeek)}\` ${game} this week`)
      }
      if(timePlayedDay == -2) {
        embed.addField(`Today`, `Your data hasn't been logged for a day, so I can't show you this information!`)
      } else {
        embed.addField(`Today`, `You've played \`${timeConvert(timePlayedDay)}\` ${game} today`)
      }
      embed.addField(`Total`, `You've played \`${timeConvert(timePlayedAll)}\` ${game} in total (see footer)`)
      message.channel.send({embed});
    } else {
      if(mention.bot) {
        return message.reply(`Sorry, I don't log the playtime of bots!`)
      }
      if(timePlayedAll == 0) {
        return message.reply(`${mention.username} hasn't (according to Discord) ever played ${game} since I measured his playtime!\n*(playtime measured since: \`${fs.readFileSync(`./data/startDates/${mention.id}.txt`)}\`)*`)
      }
      if(timePlayedCustom >= 0) {
        var string = `${convertSince(since)}, ${mention.username} has played \`${timeConvert(timePlayedCustom)}\` ${game}!`
        if(sinceWarning == true) {
          string += `\n**Warning**: this information is inaccurate, because I started measuring ${mention.username}'s playtime later than the time you specified.\n(measuring started ${MSDays(Math.abs(new Date() - new Date(fs.readFileSync(`./data/startDates/${mention.id}.txt`))))} days ago)`
        }
        return message.reply(string)
      }
      const embed = new Discord.RichEmbed()
      .setAuthor(`${mention.username}'s ${game} playtime`, mention.avatarURL)
      .setColor(3447003)
      .setFooter(`\"Total\" measured from ${fs.readFileSync(`./data/startDates/${message.author.id}.txt`)}`)
      .setThumbnail(getThumbnail(game))
      if(timePlayedWeek == -2) {
        embed.addField(`Last week`, `${mention.username}'s data hasn't been logged for a week, so I can't show you this information!`)
      } else {
        embed.addField(`Last week`, `${mention.username} has played \`${timeConvert(timePlayedWeek)}\` ${game} this week`)
      }
      if(timePlayedDay == -2) {
        embed.addField(`Today`, `${mention.username}'s' data hasn't been logged for a day, so I can't show you this information!`)
      } else {
        embed.addField(`Today`, `${mention.username} has played \`${timeConvert(timePlayedDay)}\` ${game} today`)
      }
      embed.addField(`Total`, `${mention.username} has played \`${timeConvert(timePlayedAll)}\` ${game} in total (see footer)`)
      message.channel.send({embed});
    }
  }

  if(command === "private") {
    if(arg[0] == "on") {
      if(fs.existsSync(`./data/privateUsers/${message.author.id}.csv`)) {
        return message.reply(`Your playtime is already set to private! Use \`${guildConf.prefix}setPrivate off\` to turn off private mode.`)
      } else {
        fs.appendFileSync(`./data/privateUsers/${message.author.id}.csv`, "");
        return message.reply("Turned on private mode!ðŸ‘¤\nYou won't appear in the ranking channel and no one will be able to view your playtime.\n(this applies to all guilds you're in)")
      }
    }
    if(arg[0] == "off") {
      if(fs.existsSync(`./data/privateUsers/${message.author.id}.csv`)) {
        fs.unlinkSync(`./data/privateUsers/${message.author.id}.csv`);
      }
      return message.reply("Turned off private mode!\nYou will appear in the ranking channel again and everyone will be able to view your playtime.\n(this applies to all guilds you're in)");
    }
    if(arg[0] != "on" && arg[0] != "off") {
      return message.reply(`Please specify your playtime as \`on/off\`\nExample: \`${guildConf.prefix}setPrivate on\``)
    }
  }

  if(command === "botinfo") {
    const embed = new Discord.RichEmbed()
      .setAuthor(`Bot info`, ``)
      .setThumbnail(client.user.avatarURL)
      .addField(`Users`, `I'm currently handling \`${client.users.size}\` users`, true)
      .addField(`Guilds`, `I'm in \`${client.guilds.size}\` guilds`, true)
      .addField(`Joined at`, `I joined this guild at \`${message.guild.joinedAt}\``, true)
      .addField(`Last restart`, `My last restart was at \`${client.readyAt}\``, true)
      .addField(`Creator`, `I was created by <@112237401681727488> (@xVaql#4581)`, true)
      .addField(`Wiki`, `Check out my documentation [here](https://github.com/iGotYourBack/TimePlayed/wiki)`, true)
    return message.channel.send(embed)
  }


  // CONFIG COMMANDS
  if(command === "setconfig") {
    if(message.member.hasPermission("ADMINISTRATOR")) {
      if(!arg[0] || !arg[1]) {
        return message.reply(`Please provide a config key and value.\n\nExample: \`${guildConf.prefix}setConfig defaultGame Rocket League\`\nSee this page for more help: <https://goo.gl/q9voUa>`)
      }
      var guildSettings = fs.readFileSync(`./data/guildSettings/${message.guild.id}.json`)
      guildSettings = JSON.parse(guildSettings);
      if(guildSettings[arg[0]]) {
        if(arg[0] == "leaderboardAmount" && isNaN(arg[1])) {
          return message.reply("Error: the leaderboardAmount needs to be a number!")
        }
        if(arg[0] == "leaderboardAmount" && Number(arg[1]) > 10 || Number(arg[1] < 4)) {
          return message.reply("Error: the maximum leaderboard amount needs to be higher than 3 and lower than 10!")
        }
        if(arg[0] == "rankingChannel" || arg[0] == "enableRankingMentions" || arg[0] == "leaderboardAmount" && premium == true) {
          if(premium == true) {
            return message.reply("Error: the leaderboard function is premium-only! To use this function, become a patreon at https://www.patreon.com/TimePlayed")
          } else {
            if(arg[0] == "rankingChannel") {
              var channel;
              if(message.mentions.channels.first()) {
                channel = message.guild.channels.find("id", message.mentions.channels.first().id);
              }
              if(channel == undefined && arg[1] != "none") {
                return message.reply(`Mention a channel to set the ranking channel!\nUse \`${guildConf.prefix}setConfig rankingChannel none\` to remove the ranking channel.`);
              }
              if(channel) {
                if(message.guild.me.permissionsIn(channel).has("VIEW_CHANNEL") == false) {
                  return message.reply(`Error: I don't have the permission to read messages in the ${message.mentions.channels.first()} channel. \nPlease give me the \`Read Messages\` permission and run this command again.`)
                }
                if(message.guild.me.permissionsIn(channel).has("SEND_MESSAGES") == false) {
                  return message.reply(`Error: I don't have the permission to send messages in the ${message.mentions.channels.first()} channel. \nPlease give me the \`Send Messages\` permission and run this command again.`)
                }
                if(message.guild.me.permissionsIn(channel).has("MANAGE_MESSAGES") == false) {
                  return message.reply(`Error: I don't have the permission to manage messages in the ${message.mentions.channels.first()} channel. \nPlease give me the \`Manage Messages\` permission and run this command again.`)
                }
              }
            }
            if(arg[0] == "enableRankingMentions" && arg[1] != "true" && arg[1] != "false") {
              return message.reply("Error: the enableRankingMentions settings needs to be a boolean  (\`true\` or \`false\`), not something else!")
            }
          }
        }
        var value = message.content.replace(`${guildConf.prefix}${contentCMD} ${arg[0]} `, ``);
        guildSettings[arg[0]] = value
        fs.writeFileSync(`./data/guildSettings/${message.guild.id}.json`, JSON.stringify(guildSettings), 'utf8');
        return message.reply(`Success! I've set the setting ${arg[0]} to: \`${value}\` succesfully!`);
      } else {
        return message.reply(`I don't know that setting! Available settings are:\n \`${Object.keys(guildSettings).join("\`, \n\`")}\`\nSee this page for more help: <https://goo.gl/q9voUa>`)
      }
    } else {
     message.reply("You don't have the permission to do that! (You need the Administrator permission)")
    }
  }

  if(command === "showconfig") {
    if(message.member.hasPermission("ADMINISTRATOR")) {
      var string = "Server config:\n"
      var i;
      var l = Object.keys(guildConf).length;
      for (i = 0; i < l; i++) {
        if(Object.keys(guildConf)[i] == "rankingChannel") {
          string += `${Object.keys(guildConf)[i]}: ${Object.values(guildConf)[i]}\n`;
        } else {
          string += `${Object.keys(guildConf)[i]}: \`${Object.values(guildConf)[i]}\`\n`;
        }

      }
      return message.reply(string)
    } else {
      return message.reply("Sorry, you need the Administrator permission to do that!")
    }
  }

  if(command === "setdefault") {
    if(message.member.hasPermission("ADMINISTRATOR")) {
      getGuildConfig(message.guild.id, true);
      message.reply(`I've set the config back to default!`)
    } else {
      return message.reply("Error: you need the administrator permission to do that!")
    }
  }

})

client.login(tokenz);
