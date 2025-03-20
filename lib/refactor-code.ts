"use server";
import { generateText } from "ai";

import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const model = google("gemini-2.0-flash-001");

export async function refactorCode(
  code: string
): Promise<{ name: string; content: string }[]> {
  try {
    const prompt = `
      Refactor the following code into separate components with proper TypeScript typing and styling.
      The code should be split into logical components following best practices.
      Return the result as a JSON array of objects, where each object has:
      - name: the filename (e.g., "Button.tsx")
      - content: the complete code for that file

      Here's the code to refactor:
      ${code}
    `;

    const { text } = await generateText({
      model,
      prompt,
      system:
        "You are an expert React and TypeScript developer. Your task is to refactor code into well-structured, reusable components with proper typing and styling.",
    });

    // Parse the response as JSON
    try {
      // The AI might wrap the JSON in markdown code blocks, so we need to extract it
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
        text.match(/```\n([\s\S]*?)\n```/) || [null, text];

      const jsonContent = jsonMatch[1] || text;
      const files = JSON.parse(jsonContent);

      if (!Array.isArray(files)) {
        throw new Error("Response is not an array");
      }

      return files;
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);

      // Fallback: If we can't parse the JSON, return the raw text as a single file
      return [
        {
          name: "refactored-code.tsx",
          content: text,
        },
      ];
    }
  } catch (error) {
    console.error("Error in refactorCode:", error);
    throw error;
  }
}
