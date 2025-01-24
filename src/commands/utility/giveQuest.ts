import { SlashCommandBuilder } from "discord.js";

import { generateIndividualQuest } from "../../modules/quests.ts";

import { storeChatMemory } from "../../modules/memory.ts";
import { notion } from "../../index.ts";
import { openai } from "../../index.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("givequest")
    .setDescription(
      "Gives the user a new quest which will populate in Notion upon acceptance."
    ),
  async execute(interaction) {
    await generateIndividualQuest(notion, interaction);
    // TODO: Consider if we need to actually store in memory, we will likely handle quest recall elsewhere
    // await storeChatMemory(message, lyricsResponse, openai);
  },
};
