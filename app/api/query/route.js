import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Ensure Replicate API token is set
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_KEY;
    if (!REPLICATE_API_TOKEN) {
      console.error("Replicate API token is missing");
      return NextResponse.json(
        { error: "Server configuration error: Missing Replicate API token" },
        { status: 500 }
      );
    }

    // Add safety checks to the prompt
    const safePrompt =
      prompt +
      ", family friendly, safe for work, professional, appropriate, clean, wholesome";

    // Replicate API endpoint for Stable Diffusion
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
      },
      body: JSON.stringify({
        version:
          "db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        input: {
          prompt: safePrompt,
          num_outputs: 1,
          width: 768,
          height: 768,
          scheduler: "K_EULER",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          negative_prompt:
            "nsfw, inappropriate, adult content, explicit, nudity, violence, gore, disturbing, offensive, inappropriate, unsafe, not safe for work, adult, mature, 18+, explicit content, inappropriate content, adult material, mature content, explicit material, inappropriate material, adult themes, mature themes, explicit themes, inappropriate themes",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Replicate API error:", errorData);
      throw new Error(
        `Failed to start image generation: ${
          errorData.detail || response.statusText
        }`
      );
    }

    const prediction = await response.json();
    console.log("Prediction started:", prediction);

    // Poll for the result
    let result;
    while (true) {
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Token ${REPLICATE_API_TOKEN}`,
          },
        }
      );

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        console.error("Status check error:", errorData);
        throw new Error(
          `Failed to check status: ${
            errorData.detail || statusResponse.statusText
          }`
        );
      }

      result = await statusResponse.json();
      console.log("Current status:", result.status);

      if (result.status === "succeeded") {
        const imageUrl = result.output[0];
        const imageResponse = await fetch(imageUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        return NextResponse.json({ image: base64 }, { status: 200 });
      } else if (result.status === "failed") {
        console.error("Generation failed:", result);
        if (result.error?.includes("NSFW")) {
          throw new Error(
            "The prompt might contain inappropriate content. Please try a different, family-friendly description."
          );
        }
        throw new Error(
          "Image generation failed: " + (result.error || "Unknown error")
        );
      }

      // Wait for 1 second before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("Error in generate-image API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
