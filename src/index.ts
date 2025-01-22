import "dotenv/config";
import { Client, GatewayIntentBits, Events, Message } from "discord.js";
import { Client as NotionClient } from "@notionhq/client";
import OpenAI from "openai";
import cron from "node-cron";
import { progressResponse } from "./modules/xp.ts";
import {
  generateDailyQuests,
  generateIndividualQuest,
} from "./modules/quests.ts";
import { generateChatResponse } from "./modules/aiResponses.ts";
import { retrieveChatMemory, storeChatMemory } from "./modules/memory.ts";
import "source-map-support/register";

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
  // generateDailyQuests(notion);
});

const lyricResponse = async (message, memories) => {
  const userMessage = message.content.replace("lyric", "").trim();
  if (!userMessage) return message.reply("Hey! What’s up? 😊");

  const aiResponse = await generateChatResponse(
    message.author.id,
    userMessage,
    memories
  );
  message.reply(aiResponse);
  return aiResponse;
};

discordClient.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const memories = await retrieveChatMemory(
    message.author.id,
    message.content,
    openai
  );

  const lowerCaseMessage = message.content.toLowerCase();
  const lyricName = "lyric";
  const validCommands = ["!progress", "!xp", "!givequest"];
  let lyricsResponse;

  if (validCommands.some((cmd) => lowerCaseMessage.startsWith(cmd))) {
    let userMessage = message.content.trim();

    if (userMessage.startsWith("!progress")) {
      progressResponse(message);
    }
    if (userMessage.startsWith("!givequest")) {
      generateIndividualQuest(notion, message);
    }
  } else if (lowerCaseMessage.includes(lyricName)) {
    lyricsResponse = await lyricResponse(message, memories);
  }

  await storeChatMemory(message, lyricsResponse, openai);
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);

export default discordClient;
