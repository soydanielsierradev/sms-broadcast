import { z } from "zod";

export const campaignSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresá un nombre")
    .max(120, "Máximo 120 caracteres"),
  mensaje: z
    .string()
    .trim()
    .min(1, "Escribí el mensaje")
    .max(1600, "Máximo 1600 caracteres (~10 partes SMS)"),
  lista_id: z
    .number({ error: "Seleccioná una lista" })
    .int()
    .positive("Seleccioná una lista"),
});

export type CampaignFormValues = z.input<typeof campaignSchema>;
export type CampaignFormOutput = z.output<typeof campaignSchema>;

// SMS part calculation per SPEC.md §5:
// 1 SMS = up to 160 chars; multi-part = 153 chars per part.
export function calculateSmsParts(message: string): number {
  const len = message.length;
  if (len === 0) return 0;
  if (len <= 160) return 1;
  return Math.ceil(len / 153);
}
