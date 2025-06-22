export async function generateStory(prompt, maxTokens = 1000) {
  const result = {
    story: null,
    status: "Failed to generate story.",
  };

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    result.status = "Google API Key is missing or invalid.";
    return result;
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a creative storyteller. Write a complete, engaging story based on this prompt: ${prompt}. Ensure the story is family-friendly and has a clear beginning, middle, and end.`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
      },
    });

    const storyText = await response.response.text();
    if (!storyText) {
      throw new Error("No story content returned from API");
    }

    result.story = storyText;
    result.status = "Story generated successfully";
  } catch (e) {
    console.error("Story generation error:", e);
    result.status = `Failed to generate story: ${e.message || "Unknown error"}`;
  }

  return result;
}
