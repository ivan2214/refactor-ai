"use server";

import { fileSchema } from "@/app/schema";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";

// Usar el modelo más confiable de Gemini
const model = google("gemini-1.5-pro-latest", {
  structuredOutputs: true,
});

// Definir el esquema para los archivos refactorizados

export async function refactorCodeAction(code: string) {
  console.log("Starting refactorCodeAction");

  try {
    const stream = createStreamableValue();
    const detectedFileNames = new Set<string>();
    let currentFiles = [];

    stream.update({
      type: "status",
      message: "Initializing refactoring process...",
    });

    console.log("Starting streamObject");

    // Iniciar la generación en un proceso asíncrono
    (async () => {
      try {
        const { partialObjectStream } = streamObject({
          model,
          schema: fileSchema,
          system:
            "You are an expert React and TypeScript developer. Your task is to refactor code into well-structured, reusable components with proper typing and styling.",
          prompt: `
            Refactor the following code into separate components with proper TypeScript typing and styling.
            The code should be split into logical components following best practices.
            Return an array where each item represents a file with:
            - name: the filename (e.g., "Button.tsx")
            - content: the complete code for that file
            
            Here's the code to refactor:
            ${code}
          `,
        });

        // Procesar los resultados en streaming
        for await (const partialObject of partialObjectStream) {
          if (Array.isArray(partialObject)) {
            for (const file of partialObject) {
              if (file?.name && !detectedFileNames.has(file.name)) {
                detectedFileNames.add(file.name);
                stream.update({
                  type: "file_created",
                  fileName: file.name,
                });
              }
            }
            currentFiles = partialObject; // Actualizar los archivos actuales en streaming
            stream.update({
              type: "content_update",
              files: currentFiles,
            });
          }
        }

        stream.update({
          type: "status",
          message: "Refactoring complete!",
        });

        stream.done();
      } catch (error) {
        console.error("Error in partialObjectStream:", error);
        stream.update({
          type: "error",
          message: `Error processing stream: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
        stream.done();
      }
    })();

    return {
      object: stream.value,
    };
  } catch (error) {
    console.error("Error in refactorCodeAction:", error);
    throw new Error(
      `Failed to refactor code: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
