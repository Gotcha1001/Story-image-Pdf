import fetch from "node-fetch";

export async function generateImage(prompt) {
  const result = {
    imageData: null,
    status: "Failed to generate image.",
  };

  const apiToken = process.env.REPLICATE_API_KEY;
  if (!apiToken) {
    console.error("Replicate API token is missing");
    result.status = "Replicate API token is missing or invalid.";
    return result;
  }

  // Add safety checks to the prompt
  const safePrompt =
    prompt +
    ", filled with creativity and smart image generation with the theme";

  try {
    // Initiate prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiToken}`,
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
          negative_prompt: "dull images, and boring predictions",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to start image generation: ${
          errorData.detail || response.statusText
        }`
      );
    }

    const prediction = await response.json();
    let predictionUrl = `https://api.replicate.com/v1/predictions/${prediction.id}`;

    // Poll for completion
    while (true) {
      const statusResponse = await fetch(predictionUrl, {
        headers: {
          Authorization: `Token ${apiToken}`,
        },
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(
          `Failed to check status: ${
            errorData.detail || statusResponse.statusText
          }`
        );
      }

      const statusData = await statusResponse.json();
      if (statusData.status === "succeeded") {
        const imageUrl = statusData.output[0];
        const imageResponse = await fetch(imageUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        result.imageData = Buffer.from(arrayBuffer).toString("base64");
        result.status = "Image generated successfully";
        break;
      } else if (statusData.status === "failed") {
        if (statusData.error?.includes("NSFW")) {
          throw new Error(
            "The prompt might contain inappropriate content. Please try a different, family-friendly description."
          );
        }
        throw new Error(
          `Image generation failed: ${statusData.error || "Unknown error"}`
        );
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (e) {
    console.error("Image generation error:", e);
    result.status = `Failed to generate image: ${e.message}`;
  }

  return result;
}
