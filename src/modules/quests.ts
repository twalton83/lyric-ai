import { getUserByDiscordID } from "./notion.ts";
import { generateAIQuest } from "./aiResponses.ts";
import {
  Message,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
} from "discord.js";
import { Client } from "@notionhq/client";

interface ParsedQuest {
  title: string;
  description: string;
  url?: string;
  dueDate: string;
  xp: number;
  status: boolean;
}

export async function generateIndividualQuest(
  notion: any,
  interaction: ChatInputCommandInteraction
) {
  // TODO: Accept a parameter so they can influence the quest
  const user = await getUserByDiscordID(interaction.user.id);
  if (!user) return;

  const userNotionPageId = user.id;

  const notionUserData = await notion.pages.retrieve({
    page_id: userNotionPageId,
  });

  if (!notionUserData) {
    return await interaction.reply(
      "❌ Unable to retrieve Notion user information."
    );
  }

  const questData: any = await notion.databases.query({
    database_id: process.env.NOTION_DAILY_QUESTS_DATABASE_ID,
    filter: {
      and: [
        { property: "Assigned To", relation: { contains: userNotionPageId } },
        { property: "Completion Status", checkbox: { equals: false } },
      ],
    },
  });

  if (questData.results.length > 0) {
    return await interaction.reply(
      "You already have a quest in progress! Use /quest to see it."
    );
  }

  await interaction.reply("Working on it, give me a second to think ✨");

  const notionUserId = notionUserData.created_by.id;
  const goalsData: any = await notion.databases.query({
    database_id: process.env.NOTION_GOALS_DATABASE_ID,
    filter: { property: "Created By", created_by: { contains: notionUserId } },
  });
  if (goalsData.results.length === 0) {
    return await interaction.reply("❌ No goals found for you in Notion.");
  }

  const randomGoal =
    goalsData.results[Math.floor(Math.random() * goalsData.results.length)];

  const userId = randomGoal.properties["Created By"].created_by.id;
  if (!userId) return;

  const questDescription = await generateAIQuest(
    randomGoal.properties["Title"].title[0].text.content
  );

  const quest: ParsedQuest = {
    title: randomGoal.properties["Title"].title[0].text.content,
    description: questDescription,
    xp: 50,
    status: false,
    dueDate: new Date().toISOString().split("T")[0],
  };

  const page = await notion.pages.create({
    parent: { database_id: process.env.NOTION_DAILY_QUESTS_DATABASE_ID },
    properties: {
      Title: { title: [{ text: { content: quest.title } }] },
      Description: { rich_text: [{ text: { content: questDescription } }] },
      "Generated From Goal": { relation: [{ id: randomGoal.id }] },
      "Assigned To": { relation: [{ id: notionUserData.id }] },
      "Completion Status": { checkbox: quest.status },
      "XP Value": { number: quest.xp },
      "Due Date": { date: { start: quest.dueDate } },
    },
  });

  const response: Message = await interaction.followUp({
    embeds: [generateQuestEmbed(quest, page.url)],
    components: [generateQuestButtons(true, true)],
    withResponse: true,
  });

  const collectorFilter = (i) => i.user.id === interaction.user.id;

  try {
    const confirmation = await response.awaitMessageComponent({
      filter: collectorFilter,
      time: 60_000,
    });

    if (confirmation.customId === "accept") {
      await confirmation.update({
        content: `Quest accepted!`,
        components: [],
      });
    } else if (confirmation.customId === "reject") {
      await confirmation.update({
        content: "Quest rejected! Use /givequest if you want another quest.",
        components: [],
      });

      await notion.pages.update({
        page_id: page.id,
        archived: true,
      });
    }
  } catch {
    await interaction.editReply({
      content:
        "Confirmation not received within 1 minute, quest has automatically been deleted.",
      components: [],
    });
    await notion.pages.update({
      page_id: page.id,
      archived: true,
    });
  }
}

export async function getCurrentQuest(
  notion: Client,
  interaction: ChatInputCommandInteraction
) {
  const user = await getUserByDiscordID(interaction.user.id);
  if (!user) return;

  const userNotionPageId = user.id;

  const notionUserData = await notion.pages.retrieve({
    page_id: userNotionPageId,
  });

  if (!notionUserData) {
    return await interaction.reply(
      "❌ Unable to retrieve Notion user information."
    );
  }

  await interaction.reply("Working on it, give me a second to think ✨");

  const questData = await notion.databases.query({
    database_id: process.env.NOTION_DAILY_QUESTS_DATABASE_ID,
    filter: {
      and: [
        { property: "Assigned To", relation: { contains: userNotionPageId } },
        { property: "Completion Status", checkbox: { equals: false } },
      ],
    },
  });

  if (questData.results.length === 0) {
    return await interaction.reply(
      "You don't have a quest yet! Use /givequest to get one!"
    );
  } else {
    // TODO: fix typing
    const quest = <any>questData.results[0];

    const parsedQuest = {
      // TODO: Fix quest description in Notion for proper fetching and display
      title: "Current Quest",
      description: quest.properties["Description"].rich_text[0].text.content,
      xp: quest.properties["XP Value"].number,
      status: quest.properties["Completion Status"].checkbox,
      dueDate: quest.properties["Due Date"].date.start,
    };

    const response: Message = await interaction.followUp({
      embeds: [generateQuestEmbed(parsedQuest, quest.url)],
      components: [generateQuestButtons(false, true)],
      withResponse: true,
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;

    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000,
      });

      if (confirmation.customId === "reject") {
        await confirmation.update({
          content: "Quest rejected! Use /givequest if you want another quest.",
          components: [],
        });

        await notion.pages.update({
          page_id: quest.id,
          archived: true,
        });
      }
    } catch {
      console.error("Something went wrong.");
    }
  }
}

const generateQuestEmbed = (quest: ParsedQuest, url: string) => {
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(quest.title)
    .setDescription(quest.description)
    .setURL(url)
    .addFields(
      { name: "Due Date", value: String(quest.dueDate), inline: true },
      { name: "XP", value: String(quest.xp), inline: true }
    )
    .setTimestamp();
  console.log("Embed generated!");
  return embed;
};

export async function completeQuest(notion, questId, discordId) {
  const user = await getUserByDiscordID(discordId);
  if (!user) return;

  const questData = await notion.pages.retrieve({ page_id: questId });
  if (!questData) return;

  const xpAmount = questData.properties["XP Reward"].number || 50;

  await notion.pages.update({
    page_id: questId,
    properties: { "Completion Status": { checkbox: true } },
  });

  return `✅ Quest completed! You earned ${xpAmount} XP.`;
}

export async function generateAlternativeQuest(
  notion,
  userId,
  originalQuestId
) {
  const originalQuest = await notion.pages.retrieve({
    page_id: originalQuestId,
  });

  const easierQuestText = `Easier task for: ${originalQuest.properties.Name.title[0].plain_text}`;

  const newQuest = await notion.pages.create({
    parent: { database_id: process.env.NOTION_DAILY_QUESTS_DATABASE_ID },
    properties: {
      Name: { title: [{ text: { content: easierQuestText } }] },
      "Assigned To": { relation: [{ id: userId }] },
      "Completion Status": { checkbox: false },
      "XP Reward": {
        number: Math.round(originalQuest.properties["XP Reward"].number * 1.5),
      }, // 1.5x XP bonus
      "Due Date": { date: { start: new Date().toISOString().split("T")[0] } },
    },
  });

  return newQuest.id;
}

export async function generateDailyQuests(notion, agent) {
  const goalsData = await notion.databases.query({
    database_id: process.env.NOTION_GOALS_DATABASE_ID,
    filter: { property: "Status", select: { equals: "Active" } },
  });

  for (const goal of goalsData.results) {
    const userId = goal.properties["Assigned To"].relation[0]?.id;
    if (!userId) continue;

    const questDescription = `Progress on: ${goal.properties.Name.title[0].plain_text}`;

    // TODO: create a helper
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DAILY_QUESTS_DATABASE_ID },
      properties: {
        Name: { title: [{ text: { content: questDescription } }] },
        "Generated From Goal": { relation: [{ id: goal.id }] },
        "Assigned To": { relation: [{ id: userId }] },
        "Completion Status": { checkbox: false },
        "XP Reward": { number: 50 }, // Default XP for completing
        "Due Date": { date: { start: new Date().toISOString().split("T")[0] } },
      },
    });
  }
}

const generateQuestButtons = (
  hasAcceptButton: boolean,
  hasRejectButton: boolean
) => {
  let row: any = new ActionRowBuilder();
  if (hasAcceptButton) {
    const confirm = new ButtonBuilder()
      .setCustomId("accept")
      .setLabel("Accept Quest")
      .setStyle(ButtonStyle.Success);
    row.addComponents(confirm);
  }

  if (hasRejectButton) {
    const cancel = new ButtonBuilder()
      .setCustomId("reject")
      .setLabel("Reject Quest")
      .setStyle(ButtonStyle.Danger);
    row.addComponents(cancel);
  }

  return row;
};
