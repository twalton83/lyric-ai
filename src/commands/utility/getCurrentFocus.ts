import { SlashCommandBuilder } from "discord.js";
import { getUserFocus } from "../../modules/focus.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("getfocus")
    .setDescription(
      "Displays your current area of focus which will be used to generate quests."
    ),
  async execute(interaction) {
    await getUserFocus(interaction);
  },
};
