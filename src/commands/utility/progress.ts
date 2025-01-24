import { SlashCommandBuilder } from "discord.js";
import { storeChatMemory } from "../../modules/memory.ts";
import { progress } from "../../modules/xp.ts";
import { notion } from "../../index.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("progress")
    .setDescription("Shows the user their current leveling progress."),
  async execute(interaction) {
    await progress(notion, interaction);
  },
};
