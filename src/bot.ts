import { Client, GatewayIntentBits, Events } from "discord.js";
import { config } from "dotenv";

// load .env file with DISCORD_TOKEN and CLIENT_ID
config();

const discordToken = process.env["DISCORD_TOKEN"];
const clientId = process.env["CLIENT_ID"];

if (!discordToken || !clientId) {
  throw new Error("Missing DISCORD_TOKEN or CLIENT_ID in environment");
}

// gateway listens for slash commands
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Register event when bot comes online
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
});

// Handle interactions (slash commands)
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }

  if (interaction.commandName === "roll") {
    const roll = Math.floor(Math.random() * 6) + 1;
    await interaction.reply(`🎲 You rolled a **${roll}**`);
  }
});

// Login with token
client.login(discordToken);
