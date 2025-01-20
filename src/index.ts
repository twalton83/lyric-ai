require("dotenv").config();
import { Client, GatewayIntentBits, Events, Message } from "discord.js";
import { Client as NotionClient } from "@notionhq/client";
import OpenAI from "openai";
import cron from "node-cron";
import { progressResponse } from "./modules/xp";
// import { storeChatMemory, retrieveChatMemory } from "./modules/relevance";
require("source-map-support").install();

const NOTION_XP_DATABASE_ID = process.env.NOTION_XP_DATABASE_ID;
const NOTION_DAILY_QUESTS_DATABASE_ID =
  process.env.NOTION_DAILY_QUESTS_DATABASE_ID;
const NOTION_GOALS_DATABASE_ID = process.env.NOTION_GOALS_DATABASE_ID;
const NOTION_USERS_DATABASE_ID = process.env.NOTION_USERS_DATABASE_ID;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const notion = new NotionClient({ auth: process.env.NOTION_API_KEY });
const validCommands = ["!progress"];

discordClient.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

async function generateChatResponse(userId, message) {
  // const memory = await retrieveChatMemory(userId);

  const prompt = `
        User's message: "${message}"
        Generate a response that feels natural, remembers past conversations, and stays engaging  and true to your personality as Lyric.AI.
    `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Lyric, an AI assistant who is friendly, engaging, and supportive. You use emojis frequently.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

const lyricResponse = async (message) => {
  const userMessage = message.content.replace("lyric", "").trim();
  if (!userMessage) return message.reply("Hey! What’s up? 😊");

  const aiResponse = await generateChatResponse(message.author.id, userMessage);
  message.reply(aiResponse);
};

discordClient.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const lowerCaseMessage = message.content.toLowerCase();
  const lyricName = "lyric";
  const validCommands = ["!progress", "!xp", "!quest"];

  if (validCommands.some((cmd) => lowerCaseMessage.startsWith(cmd))) {
    let userMessage = message.content.trim();

    if (userMessage.startsWith("!progress")) {
      progressResponse(message);
    }
  } else if (lowerCaseMessage.includes(lyricName)) {
    lyricResponse(message);
  }

  // await storeChatMemory(message.author.id, userMessage, aiResponse);
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);

export default discordClient;
