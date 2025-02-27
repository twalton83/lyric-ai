import { SlashCommandBuilder } from "discord.js";
import {
  handleFocusSelection,
  showFocusDropdown,
} from "../../modules/focus.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("setfocus")
    .setDescription(
      "Sets area of focus which will be used to generate quests."
    ),
  async execute(interaction) {
    await showFocusDropdown(interaction);
  },
};
