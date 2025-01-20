// require("dotenv").config();
// import { Client, QueryBuilder } from "@relevanceai/dataset";

// const client = new Client({
//   project: process.env.RELEVANCE_PROJECT_KEY,
//   api_key: process.env.RELEVANCE_API_KEY,
//   endpoint: "https://api-bcbe5a.stack.tryrelevance.com",
// });

// const dataset = client.dataset("lyric_chat_memory");
// console.log(dataset);

// export async function storeChatMemory(
//   userId: string,
//   userMessage: string,
//   lyricResponse: string
// ) {
//   const document = {
//     _id: `${userId}-${Date.now()}`,
//     user_id: userId,
//     message: userMessage,
//     lyric_response: lyricResponse,
//     timestamp: new Date().toISOString(),
//   };
//   console.log(document);

//   try {
//     const response = await dataset.insertDocuments([document]);
//     console.log(response);
//     console.log("Document inserted:", response);
//   } catch (error) {
//     console.error("Error inserting document:", error);
//   }
// }

// export async function retrieveChatMemory(userId, limit = 5) {
//   try {
//     const response = await dataset.search(
//       QueryBuilder()
//         .pageSize(limit)
//         .sort("timestamp", "desc")
//         .vector(`${userId}_vector_`)
//     );
//     return response.results;
//   } catch (error) {
//     console.error("Error retrieving chat memory:", error);
//     return [];
//   }
// }
