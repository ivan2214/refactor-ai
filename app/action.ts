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
      const { partialObjectStream } = streamObject({
        model,
        system:
          "You are an expert React and Nextjs developer. Your task is to refactor code into well-structured, reusable components with proper typing and styling.",
        prompt: `
      You are an expert code refactoring assistant. Your task is to analyze the provided code and refactor it into a well-structured, optimized, and modularized version while maintaining its functionality.

      ## **Guidelines:**
      - **Refactor the code by creating independent, reusable, and well-typed components or modules** whenever possible.
      - **Separate concerns**: Ensure that each file has a **single responsibility** and follows best practices.
      - **TypeScript best practices**: Add or improve type safety, explicit typings, and strict TypeScript rules.
      - **Optimize performance**: Reduce unnecessary re-renders and improve state management if needed.
      - **Improve readability and maintainability**: Make the code easier to understand and modify.
      - **Remove redundant or unnecessary code** while preserving functionality.
      
      ## **Response Format:**
      Return a list of **independent files**, each containing the corresponding refactored code.
      Each file should have:
      1. A **name** (with a proper file extension based on its content).
      2. A **path** where it should be located.
      3. The **content** of the file (properly formatted, following best practices).
      
      ## **Example Output Format:**
      json
      {
        "files": [
          {
            "name": "Component1.tsx",
            "path": "./src/components/Component1.tsx",
            "content": "/* Refactored code here */"
          },
          {
            "name": "Component2.tsx",
            "path": "./src/components/Component2.tsx",
            "content": "/* Refactored code here */"
          }
        ],
        "summary": "Refactored the code by splitting it into multiple files, improving type safety and optimizing performance.",
        "performanceImpact": "Reduced re-renders and improved modularity."
      }
      
      ---
      ### **Code to Refactor:**
      ${code}
      `,
        temperature: AI_CONFIG.temperature,
        schema: RefactorSchema,
      });

      for await (const partialObject of partialObjectStream) {
        const { files, performanceImpact, summary } = partialObject;
        console.log("FILES: ", files);
        console.log("---------");
        console.log("SUMMARY: ", summary);
        console.log("---------");
        console.log("PERFORMANCE IMPACT: ", performanceImpact);
        console.log("---------");

        stream.update(partialObject);
      }

      stream.done();
    } catch (error) {
      console.error(error);
      stream.error(error);
    }
  })();
  return {
    object: stream.value,
  };
}
