import { z } from "zod";

export const settingsSchema = z.object({
  delay_entre_sms: z
    .number({ error: "Ingresá un delay válido" })
    .int()
    .min(500, "Mínimo 500 ms")
    .max(10000, "Máximo 10000 ms"),
});

export type SettingsFormValues = z.input<typeof settingsSchema>;
export type SettingsFormOutput = z.output<typeof settingsSchema>;
