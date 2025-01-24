import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Collection,
} from "discord.js";

export interface ClientWithCommands extends Client {
  commands: Collection<string, any>;
}
