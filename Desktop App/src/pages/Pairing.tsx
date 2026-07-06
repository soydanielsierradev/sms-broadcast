import { zodResolver } from "@hookform/resolvers/zod";
import { QrCode, Terminal } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PairingSuccess } from "@/components/pairing/PairingSuccess";
import { QRScanner } from "@/components/pairing/QRScanner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  manualPairingSchema,
  type ManualPairingValues,
  type PairingConfigParsed,
} from "@/schemas/pairing.schema";
import { useMobileStore } from "@/store/mobile.store";

type PairingPhase = "setup" | "scanning" | "success";

export default function Pairing() {
  const [phase, setPhase] = useState<PairingPhase>("setup");
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const saveConfig = useMobileStore((s) => s.saveConfig);

  const form = useForm<ManualPairingValues>({
    resolver: zodResolver(manualPairingSchema),
    defaultValues: { url: "", token: "" },
  });

  const applyConfig = async (url: string, token: string) => {
    try {
      await saveConfig(url, token);
      setPhase("success");
    } catch (e) {
      toast.error("No se pudo guardar la configuración", {
        description: String(e),
      });
    }
  };

  const handleQrDetected = (parsed: PairingConfigParsed) => {
    void applyConfig(parsed.url, parsed.token);
  };

  const onManualSubmit = form.handleSubmit(async (values) => {
    setManualSubmitting(true);
    await applyConfig(values.url, values.token);
    setManualSubmitting(false);
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          <span className="led led-active" aria-hidden />
          <span className="font-display text-sm font-semibold tracking-tight uppercase">
            SMS Broadcast
          </span>
        </div>

        {phase === "success" ? (
          <PairingSuccess />
        ) : (
          <>
            <p className="label-eq mb-2">Pareo inicial</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight mb-4">
              Conectá el celular
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Vinculá la app móvil que actúa como servidor SMS. Escaneá el QR
              que muestra la app móvil, o cargá los datos a mano.
            </p>

            <Tabs defaultValue="qr" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="qr" className="gap-2">
                  <QrCode className="h-3.5 w-3.5" /> QR
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <Terminal className="h-3.5 w-3.5" /> Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="space-y-4">
                {phase === "scanning" ? (
                  <QRScanner
                    onDetected={handleQrDetected}
                    onCameraError={() => {
                      toast.error("Cámara no disponible", {
                        description:
                          "Probá con la pestaña Manual o revisá los permisos del sistema.",
                      });
                    }}
                  />
                ) : (
                  <div className="border border-border rounded-md p-6 bg-panel">
                    <div className="flex items-center gap-2 mb-4">
                      <QrCode className="h-4 w-4 text-primary" />
                      <span className="label-eq">Escanear código</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Al abrir la cámara vas a ver el visor. Enfocá el QR que
                      muestra la app móvil.
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => setPhase("scanning")}
                    >
                      Abrir cámara
                    </Button>
                  </div>
                )}
                {phase === "scanning" && (
                  <Button
                    variant="ghost"
                    className="w-full label-eq"
                    onClick={() => setPhase("setup")}
                  >
                    Cancelar
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="border border-border rounded-md p-6 bg-panel">
                  <div className="flex items-center gap-2 mb-4">
                    <Terminal className="h-4 w-4 text-primary" />
                    <span className="label-eq">Configuración manual</span>
                  </div>
                  <Form {...form}>
                    <form onSubmit={onManualSubmit} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="label-eq">
                              URL del servidor
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="http://192.168.43.1:8080"
                                autoComplete="off"
                                spellCheck={false}
                                className="font-mono text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="label-eq">
                              Token (32 hex)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                autoComplete="off"
                                spellCheck={false}
                                className="font-mono text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={manualSubmitting}
                      >
                        {manualSubmitting ? "Guardando…" : "Vincular"}
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
