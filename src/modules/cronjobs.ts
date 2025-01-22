import cron from "node-cron";

// Weekly XP Report
// cron.schedule('0 18 * * 7', async () => {
//   const notionData = await notion.databases.query({ database_id: NOTION_XP_DATABASE_ID });
//   let report = "**📊 Weekly XP Report:**\n";

//   notionData.results.forEach(entry => {
//     let username = entry.properties.Name.title[0]?.plain_text;
//     let xp = entry.properties["Current XP"].number;
//     let rank = entry.properties["Rank"].select.name;
//     report += `- ** ${username} **: ${xp} XP(${rank}) \n`;
//   });

//   const channel = discordClient.channels.cache.get(DISCORD_CHANNEL_ID);
//   if (channel) channel.send(report);
