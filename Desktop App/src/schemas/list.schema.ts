import { z } from "zod";

export const listSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresá un nombre")
    .max(80, "Máximo 80 caracteres"),
  descripcion: z
    .string()
    .trim()
    .max(300, "Máximo 300 caracteres")
    .optional(),
});

export type ListFormValues = z.output<typeof listSchema>;
