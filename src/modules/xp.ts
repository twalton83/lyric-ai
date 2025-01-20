// async function addXP(discordId: number, xpAmount: number, message: Message) {
//   const user = await getUserByDiscordID(discordId);
//   if (!user) return message.reply("❌ User not found in Notion database.");

//   const notionData = await notion.databases.query({ database_id: NOTION_XP_DATABASE_ID });
//   let pageId = null, currentXP = 0, currentRank = "E-Rank", nextRankXP = 500;

//   notionData.results.forEach(entry => {
//     if (entry.properties.Name.title[0]?.plain_text === user.name) {
//       pageId = entry.id;
//       currentXP = entry.properties["Current XP"].number || 0;
//       currentRank = entry.properties["Rank"].select.name;
//       nextRankXP = entry.properties["Next Rank XP"].number;
//     }
//   });

//   let newXP = currentXP + xpAmount;
//   let rankUpMessage = "";

//   const ranks = [
//     { name: "E-Rank", xp: 0 },
//     { name: "D-Rank", xp: 500 },
//     { name: "C-Rank", xp: 1200 },
//     { name: "B-Rank", xp: 3000 },
//     { name: "A-Rank", xp: 6500 },
//     { name: "S-Rank", xp: 12000 }
//   ];

//   for (let i = 0; i < ranks.length; i++) {
//     if (newXP >= ranks[i].xp && currentRank !== ranks[i].name) {
//       currentRank = ranks[i].name;
//       nextRankXP = ranks[i + 1] ? ranks[i + 1].xp : null;
//       rankUpMessage = `🔥 **Rank Up!** 🔥\n🎖️ You are now **${currentRank}**!\nNew XP Goal: **${nextRankXP} XP**.`;
//     }
//   }

//   if (pageId) {
//     await notion.pages.update({
//       page_id: pageId,
//       properties: {
//         "Current XP": { number: newXP },
//         "Rank": { select: { name: currentRank } },
//         "Next Rank XP": { number: nextRankXP }
//       }
//     });
//   }

//   let xpMessage = `✨ **XP Gained:** ${xpAmount} XP\n🏆 **Total XP:** ${newXP} XP / ${nextRankXP} XP`;
//   if (rankUpMessage) xpMessage += `\n\n${rankUpMessage}`;

//   message.reply(xpMessage);
// }

// Command to check XP progress
// discordClient.on('messageCreate', async message => {
//   if (message.content.startsWith("!progress")) {
//     const user = await getUserByDiscordID(message.author.id);
//     if (!user) return message.reply("❌ No XP data found. Complete a quest to start tracking!");

//     const notionData = await notion.pages.retrieve({ page_id: user.id });
//     let currentXP = notionData.properties["Current XP"].number;
//     let nextRankXP = notionData.properties["Next Rank XP"].number;
//     let rank = notionData.properties["Rank"].select.name;

//     message.reply(`✨ **Your Progress:**\n🏆 Rank: **${rank}**\n🔢 XP: **${currentXP} / ${nextRankXP}**\n🔥 Keep going!`);
//   }
// });