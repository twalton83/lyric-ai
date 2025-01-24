import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { getUserByDiscordID, notion } from "./notion.ts";
import { Client } from "@notionhq/client";

const NOTION_XP_DATABASE_ID = process.env.NOTION_XP_DATABASE_ID;
const NOTION_DAILY_QUESTS_DATABASE_ID =
  process.env.NOTION_DAILY_QUESTS_DATABASE_ID;
const NOTION_GOALS_DATABASE_ID = process.env.NOTION_GOALS_DATABASE_ID;
const NOTION_USERS_DATABASE_ID = process.env.NOTION_USERS_DATABASE_ID;

async function addXP(discordId: string, xpAmount: number, message: Message) {
  const user = await getUserByDiscordID(discordId);
  if (!user) return message.reply("❌ User not found in Notion database.");

  const notionData: any = await notion.databases.query({
    database_id: NOTION_XP_DATABASE_ID,
  });
  let pageId = null,
    currentXP = 0,
    currentRank = "E-Rank",
    nextRankXP = 500;

  notionData.results.forEach((entry) => {
    if (entry.properties.Name.title[0]?.plain_text === user.name) {
      pageId = entry.id;
      currentXP = entry.properties["Current XP"].number || 0;
      currentRank = entry.properties["Rank"].select.name;
      nextRankXP = entry.properties["Next Rank XP"].number;
    }
  });

  let newXP = currentXP + xpAmount;
  let rankUpMessage = "";

  const ranks = [
    { name: "E-Rank", xp: 0 },
    { name: "D-Rank", xp: 500 },
    { name: "C-Rank", xp: 1200 },
    { name: "B-Rank", xp: 3000 },
    { name: "A-Rank", xp: 6500 },
    { name: "S-Rank", xp: 12000 },
  ];

  for (let i = 0; i < ranks.length; i++) {
    if (newXP >= ranks[i].xp && currentRank !== ranks[i].name) {
      currentRank = ranks[i].name;
      nextRankXP = ranks[i + 1] ? ranks[i + 1].xp : null;
      rankUpMessage = `🔥 **Rank Up!** 🔥\n🎖️ You are now **${currentRank}**!\nNew XP Goal: **${nextRankXP} XP**.`;
    }
  }

  if (pageId) {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        "Current XP": { number: newXP },
        Rank: { select: { name: currentRank } },
        "Next Rank XP": { number: nextRankXP },
      },
    });
  }

  let xpMessage = `✨ **XP Gained:** ${xpAmount} XP\n🏆 **Total XP:** ${newXP} XP / ${nextRankXP} XP`;
  if (rankUpMessage) xpMessage += `\n\n${rankUpMessage}`;

  message.reply(xpMessage);
}

export async function progress(
  notion: Client,
  interaction: ChatInputCommandInteraction
) {
  const user = await getUserByDiscordID(interaction.user.id);

  if (!user) {
    return interaction.reply(
      "❌ No XP data found. Please ensure you're registered in Notion."
    );
  }

  const userNotionPageId = user.id;

  const notionXPData = await notion.databases.query({
    database_id: process.env.NOTION_XP_DATABASE_ID,
    filter: {
      property: "Related User",
      relation: { contains: userNotionPageId },
    },
  });

  let xpEntry;
  if (notionXPData.results.length > 0) {
    xpEntry = notionXPData.results[0];
  } else {
    xpEntry = await notion.pages.create({
      parent: { database_id: process.env.NOTION_XP_DATABASE_ID },
      properties: {
        Name: { title: [{ text: { content: user.name } }] },
        "Current XP": { number: 0 },
        "Next Rank XP": { number: 500 },
        Rank: { select: { name: "E-Rank" } },
        "Total Quests Completed": { number: 0 },
        "Related User": { relation: [{ id: userNotionPageId }] },
      },
    });
  }

  let currentXP = xpEntry.properties["Current XP"].number || 0;
  let nextRankXP = xpEntry.properties["Next Rank XP"].number || 500;
  let rank = xpEntry.properties["Rank"].select?.name || "Unranked";

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("✨ **Your Progress:** ✨")
    .setDescription("Keep going!")
    .addFields(
      { name: "🔢 Rank 🔢", value: `**${rank}**` },
      {
        name: "💹 XP 💹",
        value: `**${currentXP} / ${nextRankXP}**`,
      }
    )
    .setTimestamp();

  interaction.reply({ embeds: [embed] });
}
