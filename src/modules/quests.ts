import { getUserByDiscordID } from "./notion";
import { generateAIQuest } from "./aiResponses";
import { Message, User, EmbedBuilder } from "discord.js";

export async function generateDailyQuests(notion, agent) {
  const goalsData = await notion.databases.query({
    database_id: process.env.NOTION_GOALS_DATABASE_ID,
    filter: { property: "Status", select: { equals: "Active" } },
  });

  for (const goal of goalsData.results) {
    const userId = goal.properties["Assigned To"].relation[0]?.id;
    if (!userId) continue;

    // Generate quest text
    const questDescription = `Progress on: ${goal.properties.Name.title[0].plain_text}`;

    // Create new quest in Notion
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

export async function generateIndividualQuest(notion: any, message: Message) {
  const user = await getUserByDiscordID(message.author.id);
  if (!user) return;

  const userNotionPageId = user.id; // This is the user's Notion Page ID, not their Notion user ID

  // Retrieve Notion User ID (who created the goal)
  const notionUserData = await notion.pages.retrieve({
    page_id: userNotionPageId,
  });

  if (!notionUserData) {
    return message.reply("❌ Unable to retrieve Notion user information.");
  }

  const notionUserId = notionUserData.created_by.id; // This is the Notion internal user ID

  const goalsData: any = await notion.databases.query({
    database_id: process.env.NOTION_GOALS_DATABASE_ID,
    filter: { property: "Created By", created_by: { contains: notionUserId } },
  });

  if (goalsData.results.length === 0) {
    return message.reply("❌ No goals found for you in Notion.");
  }

  const randomGoal =
    goalsData.results[Math.floor(Math.random() * goalsData.results.length)];

  const userId = randomGoal.properties["Created By"].created_by.id;
  if (!userId) return;

  const questDescription = await generateAIQuest(randomGoal.title);

  const quest = {
    title: randomGoal.properties.title,
    description: questDescription,
    xp: 50,
    status: false,
    dueDate: new Date().toISOString().split("T")[0],
  };

  const page = await notion.pages.create({
    parent: { database_id: process.env.NOTION_DAILY_QUESTS_DATABASE_ID },
    properties: {
      Title: { title: [{ text: { content: questDescription } }] },
      "Generated From Goal": { relation: [{ id: randomGoal.id }] },
      "Assigned To": { relation: [{ id: user.id }] },
      "Completion Status": { checkbox: quest.status },
      "XP Value": { number: quest.xp },
      "Due Date": { date: { start: quest.dueDate } },
    },
  });

  message.reply({ embeds: [generateQuestEmbed(quest, page.url)] });
}

const generateQuestEmbed = (quest: any, url: string) => {
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("New Quest!")
    .setDescription(quest.description)
    .setURL(url)
    .addFields(
      { name: "Due Date", value: String(quest.dueDate), inline: true },
      { name: "XP", value: String(quest.xp), inline: true }
    )
    .setTimestamp();
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
