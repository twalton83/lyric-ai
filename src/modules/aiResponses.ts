const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function generateChatResponse(userId, message, memories) {
  let memoryContext =
    memories.length > 0
      ? memories
          .map(
            (m, index) =>
              `Memory ${index + 1}:\nUser: ${m.message}\nLyric: ${m.response}`
          )
          .join("\n\n")
      : "No relevant past conversations.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Lyric, an AI assistant who is friendly, engaging, and supportive. You use emojis frequently.

            Below is relevant context from past conversations.
            If relevant, use this information to guide your response.

            ${memoryContext}
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function generateAIQuest(goalText) {
  const prompt = `
        User's message: "${goalText}"
        Generate a quest-like task for this person to do that is related to their goal. If related to fitness, assume the user is fit and has access to a gym.  Generate a response that feels natural, remembers past conversations, and stays engaging  and true to your personality as Lyric.AI. Keep it succinct and general (ie, "go to the gym",  "read 10 pages of a book", "study for the exam for 30 minutes") The quest should ideally take no more than an hour and a half to complete..
    `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Lyric, an AI assistant who is friendly, engaging, and supportive. You use emojis frequently.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
