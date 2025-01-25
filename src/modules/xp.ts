import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { getUserByDiscordID, notion } from "./notion.ts";
import { Client } from "@notionhq/client";

const NOTION_XP_DATABASE_ID = process.env.NOTION_XP_DATABASE_ID;
const NOTION_DAILY_QUESTS_DATABASE_ID =
  process.env.NOTION_DAILY_QUESTS_DATABASE_ID;
const NOTION_GOALS_DATABASE_ID = process.env.NOTION_GOALS_DATABASE_ID;
const NOTION_USERS_DATABASE_ID = process.env.NOTION_USERS_DATABASE_ID;

export async function addXP(
  xpAmount: number,
  interaction: ChatInputCommandInteraction
) {
  const user = await getUserByDiscordID(interaction.user.id);
  if (!user) return interaction.reply("❌ User not found in Notion database.");

  const notionData: any = await notion.databases.query({
    database_id: NOTION_XP_DATABASE_ID,
    filter: { property: "User", relation: { contains: user.id } },
  });

  if (notionData.results.length === 0) {
    return interaction.reply("❌ No XP entry found for this user.");
  }

  const xpEntry = notionData.results[0];
  console.log(xpEntry);
  const pageId = xpEntry.id;
  const currentXP = xpEntry.properties["Current XP"].number || 0;

  const newXP = currentXP + xpAmount;

  await notion.pages.update({
    page_id: pageId,
    properties: {
      "Current XP": { number: newXP },
    },
  });

  interaction.followUp(
    `✨ **XP Gained:** ${xpAmount} XP\n🏆 **Total XP:** ${newXP} XP`
  );
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
