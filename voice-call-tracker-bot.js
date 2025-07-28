// Voice Call Tracker Bot – Node.js (discord.js v14)
// --------------------------------------------------
// Tracks when members join/leave voice channels, logs join time, leave time & duration
// and posts an embedded message in a specified log channel.
// --------------------------------------------------
// Quick-start:
//   1. npm init -y && npm install discord.js dotenv
//   2. Create a .env file next to this script with:
//        BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
//        LOG_CHANNEL_ID=VOICE_LOG_TEXT_CHANNEL_ID
//   3. node voice-call-tracker-bot.js
// --------------------------------------------------
// Notes:
//   • Requires Node.js v18 or later.
//   • Make sure the bot has the "View Channels" and "Send Messages" perms
//     in the log channel, and the "View Channels" & "Connect" perms server-wide.
//   • No database dependency – join timestamps are kept in-memory; you can
//     replace the Map with persistence (e.g. MongoDB) if desired.
// --------------------------------------------------

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');

// --- CONFIG ---------------------------------------------------------------
const {
  BOT_TOKEN,
  LOG_CHANNEL_ID,
  LOG_EMBEDS = 'true', // set false to use plain text logging
} = process.env;

if (!BOT_TOKEN || !LOG_CHANNEL_ID) {
  console.error('❌  BOT_TOKEN and LOG_CHANNEL_ID must be set in .env');
  process.exit(1);
}
// -------------------------------------------------------------------------

// Create client with the GUILD_VOICE_STATES intent so we receive voice events
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  partials: [Partials.GuildMember, Partials.User, Partials.Channel],
});

// In-memory store of join times: <userId, timestamp>
const joinTimes = new Map();

client.once('ready', () => {
  console.log(`✅  Logged in as ${client.user.tag}`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  // Ignore bot accounts
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;

  const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
  if (!logChannel || !logChannel.isTextBased()) return;

  // User JOINED a voice channel
  if (!oldState.channelId && newState.channelId) {
    const joinTimestamp = Date.now();
    joinTimes.set(member.id, joinTimestamp);

    const joinMessage =
      LOG_EMBEDS === 'true'
        ? new EmbedBuilder()
            .setAuthor({
              name: `${member.displayName} joined a voice channel`,
              iconURL: member.displayAvatarURL(),
            })
            .setDescription(
              `\u{1F4E5} **Channel:** <#${newState.channelId}>\n\n` +
                `\u23F0 Joined: <t:${Math.floor(joinTimestamp / 1000)}:t> ` +
                `(<t:${Math.floor(joinTimestamp / 1000)}:R>)`
            )
            .setColor(0x57f287)
        : `✅ ${member.displayName} joined <#${newState.channelId}> at <t:${Math.floor(
            joinTimestamp / 1000
          )}:t>`;

    logChannel.send({
      embeds: LOG_EMBEDS === 'true' ? [joinMessage] : undefined,
      content: LOG_EMBEDS !== 'true' ? joinMessage : undefined,
    });
  }
  // User LEFT a voice channel
  else if (oldState.channelId && !newState.channelId) {
    const leaveTimestamp = Date.now();
    const joinTimestamp = joinTimes.get(member.id);
    joinTimes.delete(member.id);

    const durationMs = joinTimestamp ? leaveTimestamp - joinTimestamp : 0;
    const durationString = formatDuration(durationMs);

    const leaveMessage =
      LOG_EMBEDS === 'true'
        ? new EmbedBuilder()
            .setAuthor({
              name: `${member.displayName} left voice`,
              iconURL: member.displayAvatarURL(),
            })
            .setDescription(
              `\u{1F4E4} **Duration:** ${durationString}\n\n` +
                `\u23F0 Left: <t:${Math.floor(leaveTimestamp / 1000)}:t> ` +
                `(<t:${Math.floor(leaveTimestamp / 1000)}:R>)`
            )
            .setColor(0xed4245)
        : `❌ ${member.displayName} left voice at <t:${Math.floor(
            leaveTimestamp / 1000
          )}:t> | \u{1F4CA} Duration: ${durationString}`;

    logChannel.send({
      embeds: LOG_EMBEDS === 'true' ? [leaveMessage] : undefined,
      content: LOG_EMBEDS !== 'true' ? leaveMessage : undefined,
    });
  }
});

function formatDuration(ms) {
  if (!ms || ms < 1000) return 'less than 1s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds && !hours) parts.push(`${seconds}s`); // seconds only if <1h
  return parts.join(' ');
}

client.login(BOT_TOKEN);
