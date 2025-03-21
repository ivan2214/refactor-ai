"use server";

import { AI_CONFIG } from "@/lib/ai-config";
import { createStreamableValue } from "ai/rsc";
import { RefactorSchema } from "@/app/schema";
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";

export async function refactor(code: string) {
  "use server";

  const stream = createStreamableValue();
  const model = google("gemini-2.0-flash-001");

  (async () => {
    try {
      console.log("refactor");

      const { partialObjectStream } = streamObject({
        model,
        system:
          "You are an expert React and Nextjs developer. Your task is to refactor code into well-structured, reusable components with proper typing and styling.",
        prompt: `
      You are an expert code refactoring assistant. Your task is to analyze the provided code and refactor it into a well-structured, optimized, and modularized version while maintaining its functionality.

## **Guidelines:**
- **Refactor the code by creating independent, reusable, and well-typed components or modules** whenever possible.
- **Organize files following a hierarchical structure** (folders and subfolders).
- **Ensure compatibility with the following tree format:**
  - Each folder should be an array where the first element is its name and the following elements are files or subfolders.
  - Files should be strings.
- **TypeScript best practices**: Improve typings and use strict TypeScript rules.
- **Optimize performance**: Reduce unnecessary re-renders and improve state management if needed.
- **Improve readability and maintainability**: Make the code easier to understand and modify.

### **Code to Refactor:**
${code}
      `,
        temperature: AI_CONFIG.temperature,
        schema: RefactorSchema,
      });

      for await (const partialObject of partialObjectStream) {
        console.log("partialObject", partialObject);

        stream.update(partialObject);
      }

      stream.done();
    } catch (error) {
      console.error(error);
      stream.error(error);
    }
  })();

  console.log("returning");

  return {
    object: stream.value,
  };
}
