import { SlashCommandBuilder } from "discord.js";
import { getCurrentQuest } from "../../modules/quests.ts";
import { storeChatMemory } from "../../modules/memory.ts";
import { notion } from "../../index.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("quest")
    .setDescription("Gives the user their current quest."),
  async execute(interaction) {
    await getCurrentQuest(notion, interaction);
  },
};
