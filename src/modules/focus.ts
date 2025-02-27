import { discordClient } from "../index.ts";
import { getUserByDiscordID, notion } from "./notion.ts";

export async function getAvailableFocusOptions() {
  const focusCategories: any = await notion.databases.query({
    database_id: process.env.NOTION_GOALS_DATABASE_ID,
  });

  const uniqueCategories = new Set();

  focusCategories.results.forEach((goal) => {
    const category = goal.properties["Category"].select.name;
    if (category) uniqueCategories.add(category);
  });

  return Array.from(uniqueCategories);
}

import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ChatInputCommandInteraction,
  StringSelectMenuOptionBuilder,
} from "discord.js";

export async function showFocusDropdown(
  interaction: ChatInputCommandInteraction
) {
  const focusOptions = await getAvailableFocusOptions();
  if (focusOptions.length === 0) {
    return interaction.reply({
      content: "❌ No available focus areas found.",
      ephemeral: true,
    });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("set_focus")
    .setPlaceholder("Select your focus...")
    .addOptions(
      focusOptions.map((focus: any) =>
        new StringSelectMenuOptionBuilder().setLabel(focus).setValue(focus)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    selectMenu
  );

  await interaction.reply({
    content: "🎯 Choose your focus area:",
    components: [row],
    ephemeral: true,
  });
}

export async function handleFocusSelection(
  interaction: StringSelectMenuInteraction
) {
  const user = await getUserByDiscordID(interaction.user.id);
  if (!user)
    return interaction.reply({
      content: "❌ User not found in Notion database.",
      ephemeral: true,
    });

  const selectedFocus = interaction.values[0];

  const goalCategoryData: any = await notion.databases.query({
    database_id: process.env.NOTION_GOALS_DATABASE_ID,
    filter: { property: "Category", select: { equals: selectedFocus } },
  });

  if (goalCategoryData.results.length === 0) {
    return interaction.reply({
      content: `❌ No goals found for "${selectedFocus}".`,
      ephemeral: true,
    });
  }

  const userPageId = user.id;
  await notion.pages.update({
    page_id: userPageId,
    properties: {
      Focus: { select: { name: selectedFocus } }, // ✅ Now sets Focus as a dropdown value
    },
  });

  await interaction.reply({
    content: `✅ Focus updated to **${selectedFocus}**!`,
    ephemeral: true,
  });
}

export async function getUserFocus(interaction: ChatInputCommandInteraction) {
  const user = await getUserByDiscordID(interaction.user.id);
  if (!user)
    return interaction.reply({
      content: "❌ User not found in Notion database.",
      ephemeral: true,
    });

  const userData = await notion.pages.retrieve({ page_id: user.id });
  const userFocus = userData.properties.Focus.relation[0]?.id;

  if (!userFocus) {
    return interaction.reply({
      content: "❌ You have not set a focus yet!",
      ephemeral: true,
    });
  }

  return interaction.reply({
    content: `🎯 Your current focus is: **${userFocus}**`,
    ephemeral: false,
  });
}
