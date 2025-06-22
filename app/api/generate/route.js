import { generateStory } from "../../lib/generateStory";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";

const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60, // 10 requests per minute
});

export async function POST(req) {
  try {
    await rateLimiter.consume(req.ip);
  } catch {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests, please try again later." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { storyPrompt } = await req.json();

  const result = {
    story: null,
    storyStatus: "Failed to generate story.",
    storyBaseName: "story.txt",
    imageData: null,
    imageStatus: "No image generation requested.",
    imageBaseName: "image.png",
    audioData: null,
    audioStatus: "Audio will be generated in the browser.",
    audioBaseName: "audio.mp3",
    error: null,
  };

  // Story generation
  try {
    const storyResult = await generateStory(storyPrompt, 1000);
    result.story = storyResult.story;
    result.storyStatus = storyResult.status;
  } catch (e) {
    console.error("Story generation error:", e);
    result.error = e.message;
  }

  // Generate a unique key and store results in a cookie
  const generationKey = Date.now().toString();
  const response = new NextResponse(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  response.cookies.set("generationKey", generationKey, {
    httpOnly: false,
    maxAge: 3600, // 1 hour
  });
  response.cookies.set("generatedContent", JSON.stringify(result), {
    httpOnly: false,
    maxAge: 3600, // 1 hour
  });

  return response;
}
