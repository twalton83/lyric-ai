// async function getUserByDiscordID(discordId: number) {
//   const notionData = await notion.databases.query({
//     database_id: NOTION_USERS_DATABASE_ID,
//     filter: { property: "Discord User", people: { contains: discordId } }
//   });

//   if (notionData.results.length === 0) {
//     return null;
//   }

//   const user = notionData.results[0];
//   return {
//     id: user.id,
//     name: user.properties.Name.title[0]?.plain_text,
//     discordId: discordId
//   };
// }

// async function getOtherUser(discordId: number) {
//   const user = await getUserByDiscordID(discordId);
//   if (!user) return null;

//   const notionData = await notion.pages.retrieve({ page_id: user.id });
//   const partnerRelation = notionData.properties["Accountability Partner"].relation;

//   if (partnerRelation.length > 0) {
//     const partnerPage = await notion.pages.retrieve({ page_id: partnerRelation[0].id });
//     return {
//       discordId: partnerPage.properties["Discord User"].people[0]?.id,
//       name: partnerPage.properties.Name.title[0]?.plain_text
//     };
//   }
//   return null;
// }
