import { z } from "zod";

// E.164: +[country code][number], 8–16 digits including country code.
const phoneRegex = /^\+\d{7,15}$/;

export const contactSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresá un nombre")
    .max(120, "Máximo 120 caracteres"),
  numero: z
    .string()
    .trim()
    .regex(phoneRegex, "Formato esperado: +54911..., con código de país"),
  notas: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional(),
});

export type ContactFormValues = z.output<typeof contactSchema>;
