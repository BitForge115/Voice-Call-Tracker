# Voice Call Tracker Bot

A simple Discord bot that tracks when members join or leave voice channels and logs the events in a text channel. It uses [discord.js](https://discord.js.org/) v14 and stores join timestamps in memory.

## Quick start

1. Ensure you have **Node.js 18** or later installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your bot token and log channel ID.
4. Start the bot:
   ```bash
   npm start
   ```

The bot needs the `View Channels` and `Send Messages` permissions in the log channel, plus `View Channels` and `Connect` server-wide.

## Configuration

- `BOT_TOKEN` – your Discord bot token
- `LOG_CHANNEL_ID` – the text channel ID where join/leave messages will be posted
- `LOG_EMBEDS` – set to `false` to disable embed messages and use plain text

Join timestamps are kept in memory. If you want persistence across restarts you can replace the `Map` with a database of your choice.
