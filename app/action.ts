"use server";

import { AI_CONFIG } from "@/lib/ai-config";
import { createStreamableValue } from "ai/rsc";
import { RefactorSchema } from "./api/refactor/route";
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";

export async function refactor(code: string) {
  "use server";

  const stream = createStreamableValue();
  const model = google("gemini-2.0-flash-001");

  (async () => {
    const { partialObjectStream } = streamObject({
      model,
      system:
        "You are an expert React and Nextjs developer. Your task is to refactor code into well-structured, reusable components with proper typing and styling.",
      prompt: `
      You are an expert code refactoring assistant. Analyze the provided code and suggest improvements while maintaining its functionality.
  Focus on:
  1. Code organization and structure
  2. Performance optimizations
  3. Best practices and patterns
  4. Type safety and error handling
  5. Readability and maintainability
  
  Provide output in the following JSON format:
  {
    "files": [{
      "name": string,
      "path": string,
      "content": string,
      "changes": [{
        "type": "improvement" | "suggestion" | "warning",
        "description": string,
        "line": number
      }]
    }],
    "summary": string,
    "performanceImpact": string
  }
  
  Code:
  ${code}
  `,
      temperature: AI_CONFIG.temperature,
      maxTokens: AI_CONFIG.maxTokens,

      schema: RefactorSchema,
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();
  return {
    object: stream.value,
  };
}
