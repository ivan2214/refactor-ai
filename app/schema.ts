import { z } from "zod";

export const fileSchema = z.array(
  z.object({
    name: z.string().describe("The filename of the refactored component"),
    content: z.string().describe("The complete code content of the file"),
  })
);

export const RefactorSchema = z.object({
  tree: z
    .array(
      z.union([
        z.string().describe("Nombre de un archivo individual"), // Para archivos individuales
        z
          .tuple([
            z.string().describe("Nombre del folder"), // Nombre del folder
            z
              .array(z.any())
              .describe("Subdirectorios o archivos dentro del folder"), // Subdirectorios o archivos dentro del folder
          ])
          .describe("Estructura de un folder con archivos y subdirectorios"),
      ])
    )
    .describe("Estructura del árbol de archivos refactorizados"),
});
