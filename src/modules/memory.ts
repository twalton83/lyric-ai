import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_KEY,
});

export const storeChatMemory = async (message, lyricResponse, openai) => {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: message + " " + lyricResponse,
  });

  const vector = embeddingResponse.data[0].embedding;

  await pc.index("lyric-memory").upsert([
    {
      id: `${message.author.id}-${Date.now()}`, // Unique identifier
      values: vector,
      metadata: {
        user_id: message.author.id,
        message: message.content,
        response: lyricResponse,
        timestamp: new Date().toISOString(),
      },
    },
  ]);

  console.log("✅ Memory Stored in Pinecone!");
};

export const retrieveChatMemory = async (userId, query, openai) => {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });

  const queryVector = embeddingResponse.data[0].embedding;

  const searchResults = await pc.index("lyric-memory").query({
    vector: queryVector,
    topK: 15, // Fetch the 3 most relevant past memories
    includeMetadata: true,
    filter: { user_id: userId },
  });

  return searchResults.matches.map((match) => match.metadata);
};
