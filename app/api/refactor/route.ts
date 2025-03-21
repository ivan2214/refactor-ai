import { AI_CONFIG } from "@/lib/ai-config";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

export const RefactorSchema = z.object({
  files: z.array(
    z.object({
      name: z.string().describe("The name of the file"),
      path: z.string().describe("The path of the file"),
      content: z.string().describe("The content of the file"),
      changes: z
        .array(
          z.object({
            type: z
              .enum(["improvement", "suggestion", "warning"])
              .describe("The type of change"),
            description: z.string().describe("A description of the change"),
            line: z.number().describe("The line number of the change"),
          })
        )
        .describe("The changes made to the file"),
    })
  ),
  summary: z.string(),
  performanceImpact: z.string(),
});

/* 
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
 */

export async function POST(req: Request) {}
