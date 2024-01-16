const { Client, GatewayIntentBits, PermissionFlagsBits, Partials } = require('discord.js');
const client = new Client({ intents: [
  GatewayIntentBits.Guilds, 
  GatewayIntentBits.GuildMessages, 
  GatewayIntentBits.MessageContent, 
  GatewayIntentBits.GuildMessageReactions
],
partials: [
  Partials.Message,
  Partials.Channel,
  Partials.User,
  Partials.Reaction
]
});
const { getOrCreateDiscordUser, getOrCreateDiscordChannel } = require('./discord');
const { createShare } = require('./share');
const { getSequelize } = require('./db');
const { scoreReactionAdd, scoreReactionRemove, scoreShare } = require('./score');
const { CreateLinkOpts, getOrCreateLink, getLink } = require('./link');
const axios = require('axios');
require('dotenv').config({ path: '.env' });

const TOKEN = process.env.DISCORD_BOT_TOKEN; // Ensure this is loaded securely

async function getTitleFromURL(url) {
  try {
    const response = await axios.get(url);
    const data = await response.data;

     // Find the <title> tag
     const titleStart = data.indexOf('<title');
     const titleEnd = data.indexOf('</title');

     if (titleStart !== -1 && titleEnd !== -1) {
        // Extract the title content
        const title = data.substring(titleStart + 7, titleEnd);
        return title;
     } else {
        console.log(data);
        throw new Error('Title tag not found');
     }
  } catch (error) {
      console.error(`Error fetching metadata for URL ${url}:`, error);
      throw error;
  }
}

// A utility function to check if a message contains a URL
function containsLink(message) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return urlRegex.test(message);
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) =>
{
  console.log("Message created")
  const sequelize = await getSequelize();
  // Ignore messages from the bot itself
  if (message.author.bot) return;

  // Check if the message contains a link
  if (containsLink(message.content))
  {

    // After link is found, try to add it to the db if it isnt already there, 
    // if it is there then increase the points by one and check if its already beren posted in a public channel

    // Parses the link, domain, icon, and title of the website from the message's link
    const url = message.content.match(/https?:\/\/[^\s]+/g)[0];
    const domain = url.match(/https?:\/\/([^\s]+)/g)[0].replace('https://', '').replace('http://', '');
    const title = await getTitleFromURL(url);
    const icon = `https://www.google.com/s2/favicons?domain=${url}`;
    console.log(`Title: ${title}`);

    // Get the channel name the message was sent in, whether or not the channel is private, the message timestamp, and the message link
    const channel = message.channel.name;
    const channelID = message.channel.id;
    const messageLink = message.url;
    const isPrivate = (message.channel.guild && !message.channel.permissionsFor(message.channel.guild.roles.everyone).has(PermissionFlagsBits.ViewChannel));
    const messageTS = message.createdTimestamp.toString();
    const readableTS = new Date(message.createdTimestamp);

    // Get the username and id of the user who sent the message
    const user = message.author.username;
    const userId = message.author.id;

    // Get the discord user and channel
    const discordUser = await getOrCreateDiscordUser(user, userId);
    const discordChannel = await getOrCreateDiscordChannel(channel, channelID, isPrivate);

    // If a link exists in the db already, add a share score, otherwise make a new link and add a share score
    try {
      const link = await getLink(url);
      console.log(`Link already shared before`);
      const share = await createShare(url, messageLink, discordUser.id, discordChannel.id, messageTS, readableTS);
      await scoreShare(url, readableTS);
    } catch (error) {
      console.log(`Link not shared before`);

      // Creates a share object and updates the score
      const share = await createShare(url, messageLink, discordUser.id, discordChannel.id, messageTS, readableTS);

      const messageLinkOpts = {
        url: url,
        domain: domain,
        title: title,
        icon: icon,
        isDM: false,
        isPrivate: isPrivate,
        isHidden: isPrivate,
        isPublicShared: !isPrivate,
        firstSharedBy: userId,
        firstSharedIn: channelID,
        firstSharedMessageTs: messageTS,
    }

    const link = await getOrCreateLink(messageLinkOpts);
    await scoreShare(url, readableTS);
    }
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message:', error);
      return;
    }
  }

  // If the message that got a reaction has a link, add a reaction score boost
  if (containsLink(reaction.message.content)) {
    console.log("Reacted to a message with a link")
    const url = reaction.message.content.match(/https?:\/\/[^\s]+/g)[0];
    const readableTS = new Date(reaction.message.createdTimestamp);
    await scoreReactionAdd(url, readableTS);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message:', error);
      return;
    }
  }

  // If the message that lost a reaction has a link, remove a reaction score boost
  if (containsLink(reaction.message.content)) {
    const url = reaction.message.content.match(/https?:\/\/[^\s]+/g)[0];
    const readableTS = new Date(reaction.message.createdTimestamp);
    await scoreReactionRemove(url, readableTS);
  }
});

client.login(TOKEN);