const NOTION_XP_DATABASE_ID = process.env.NOTION_XP_DATABASE_ID;
const NOTION_DAILY_QUESTS_DATABASE_ID =
  process.env.NOTION_DAILY_QUESTS_DATABASE_ID;
const NOTION_GOALS_DATABASE_ID = process.env.NOTION_GOALS_DATABASE_ID;
const NOTION_USERS_DATABASE_ID = process.env.NOTION_USERS_DATABASE_ID;

import { Client as NotionClient } from "@notionhq/client";
const notion = new NotionClient({ auth: process.env.NOTION_API_KEY });

export async function getUserByDiscordID(discordId: string) {
  const notionData: any = await notion.databases.query({
    database_id: NOTION_USERS_DATABASE_ID,
    filter: { property: "Discord ID", rich_text: { contains: discordId } },
  });

  if (notionData.results.length === 0) {
    return null;
  }

  const user = notionData.results[0];

  return {
    id: user.id,
    name: user.properties.Person.people[0].name,
    discordId: discordId,
  };
}

export async function getOtherUser(discordId: string) {
  const user = await getUserByDiscordID(discordId);
  if (!user) return null;

  const notionData: any = await notion.pages.retrieve({ page_id: user.id });
  const partnerRelation =
    notionData.properties["Accountability Partner"].relation;
  if (partnerRelation.length > 0) {
    const partnerPage: any = await notion.pages.retrieve({
      page_id: partnerRelation[0].id,
    });
    console.log(partnerPage);
    return {
      discordId: partnerPage.properties["Discord User"].people[0]?.id,
      name: partnerPage.properties.Person.name,
    };
  }
  return null;
}

export { notion };
