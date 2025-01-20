require('dotenv').config();
import { Client, GatewayIntentBits, Events, Message } from 'discord.js';
import { Client as NotionClient } from '@notionhq/client';
import OpenAI from "openai";
import cron from 'node-cron';

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const openai = new OpenAI();
const notion = new NotionClient({ auth: process.env.NOTION_API_KEY });

const NOTION_XP_DATABASE_ID = process.env.NOTION_XP_DATABASE_ID;
const NOTION_DAILY_QUESTS_DATABASE_ID = process.env.NOTION_DAILY_QUESTS_DATABASE_ID;
const NOTION_GOALS_DATABASE_ID = process.env.NOTION_GOALS_DATABASE_ID;
const NOTION_USERS_DATABASE_ID = process.env.NOTION_USERS_DATABASE_ID;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


discordClient.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

});


async function generateChatResponse(userId, message) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "system", content: "You are Lyric, an AI assistant who is friendly, engaging, and supportive." },
      { role: "user", content: message }]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

discordClient.on('messageCreate', async message => {
  if (message.author.bot) return;
  const parsedMessage = message.content.toLowerCase()
  if (!parsedMessage.includes("lyric")) return;

  const userMessage = message.content.replace("lyric", "").trim();
  if (!userMessage) return message.reply("Hey! What’s up? 😊");

  const aiResponse = await generateChatResponse(message.author.id, userMessage);
  message.reply(aiResponse);
});


discordClient.login(process.env.DISCORD_BOT_TOKEN);
