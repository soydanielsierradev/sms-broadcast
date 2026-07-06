import { z } from "zod";

// SPEC.md §3: URL must be http(s)://<host>:<port>, token must be 32 lowercase hex chars.
const urlRegex = /^https?:\/\/[^/]+:\d+$/;
const tokenRegex = /^[0-9a-f]{32}$/;

export const pairingSchema = z.object({
  type: z.literal("sms-broadcast-config"),
  url: z.string().regex(urlRegex, "URL debe ser http(s)://host:puerto"),
  token: z.string().regex(tokenRegex, "Token debe ser 32 caracteres hex"),
});

export type PairingConfigParsed = z.output<typeof pairingSchema>;

export function tryParsePairingQr(raw: string): PairingConfigParsed | null {
  try {
    const parsed = JSON.parse(raw);
    const result = pairingSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// Manual pairing form (used from Settings screen — no QR scanner)
export const manualPairingSchema = z.object({
  url: z.string().trim().regex(urlRegex, "URL debe ser http(s)://host:puerto"),
  token: z.string().trim().regex(tokenRegex, "Token debe ser 32 caracteres hex"),
});

export type ManualPairingValues = z.input<typeof manualPairingSchema>;
export type ManualPairingOutput = z.output<typeof manualPairingSchema>;
