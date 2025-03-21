import { z } from "zod";

export const fileSchema = z.array(
  z.object({
    name: z.string().describe("The filename of the refactored component"),
    content: z.string().describe("The complete code content of the file"),
  })
);
