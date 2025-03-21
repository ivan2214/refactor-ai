import { z } from "zod";

export const fileSchema = z.array(
  z.object({
    name: z.string().describe("The filename of the refactored component"),
    content: z.string().describe("The complete code content of the file"),
  })
);

export const RefactorSchema = z.object({
  files: z
    .array(
      z
        .object({
          name: z
            .string()
            .describe(
              "El nombre del archivo con su extensión (.tsx, .jsx, .css, etc.) del archivo refactorizado"
            ),
          path: z.string().describe("El path del archivo refactorizado"),
          content: z.string().describe("El codigo del archivo refactorizado"),
        })
        .describe("Estructura del archivo refactorizado")
    )
    .min(2)
    .describe("Lista de archivos refactorizados"),
  summary: z.string().describe("Resumen de los cambios realizados"),
  performanceImpact: z
    .string()
    .describe("Impacto en el rendimiento de los cambios"),
});
