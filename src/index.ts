import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Collection,
  Interaction,
  MessageFlags,
} from "discord.js";
import { ClientWithCommands } from "./utils/Client.ts";
import { Client as NotionClient } from "@notionhq/client";
import OpenAI from "openai";
import cron from "node-cron";
import { progressResponse } from "./modules/xp.ts";
import { generateDailyQuests } from "./modules/quests.ts";
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

export const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
}) as ClientWithCommands;

discordClient.commands = new Collection();

const setCommands = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const foldersPath = path.join(__dirname, "commands");
  console.log(foldersPath, "foldersPath");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".ts"));

    for (const file of commandFiles) {
      const data = await import(`./commands/utility/${file}`);
      const command = data.default;

      if ("data" in command && "execute" in command) {
        discordClient.commands.set(command.data.name, command);
        console.log("command set");
      } else {
        console.log(
          `[WARNING] The command at ${data} is missing a required "data" or "execute" property.`
        );
      }
    }
  }
};

setCommands();

export const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
export const notion = new NotionClient({ auth: process.env.NOTION_API_KEY });
const validCommands = ["!progress", "!xp", "!givequest"];

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

  let lyricsResponse;

  // TODO: Use a different way to parse the command, key/value store

  if (validCommands.some((cmd) => lowerCaseMessage.startsWith(cmd))) {
    let userMessage = message.content.trim();

    if (userMessage.startsWith("!progress")) {
      progressResponse(message);
      await storeChatMemory(message, lyricsResponse, openai);
    }
    // if (userMessage.startsWith("!givequest")) {
    //   generateIndividualQuest(notion, message);
    //   await storeChatMemory(message, lyricsResponse, openai);
    // }
  } else if (lowerCaseMessage.includes(lyricName)) {
    lyricsResponse = await lyricResponse(message, memories);
    await storeChatMemory(message, lyricsResponse, openai);
  }
});

discordClient.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);
