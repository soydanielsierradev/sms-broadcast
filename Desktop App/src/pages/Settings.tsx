import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw, Save, Unlink } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  settingsSchema,
  type SettingsFormValues,
} from "@/schemas/settings.schema";
import { useMobileStore } from "@/store/mobile.store";
import { useSettingsStore } from "@/store/settings.store";

export default function Settings() {
  const navigate = useNavigate();
  const config = useMobileStore((s) => s.config);
  const connection = useMobileStore((s) => s.connection);
  const clearConfig = useMobileStore((s) => s.clearConfig);
  const testConnection = useMobileStore((s) => s.testConnection);
  const [testing, setTesting] = useState(false);

  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetch);
  const updateSettings = useSettingsStore((s) => s.update);
  const settingsLoading = useSettingsStore((s) => s.loading);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      delay_entre_sms: 2000,
    },
  });

  useEffect(() => {
    fetchSettings().catch((e) =>
      toast.error("No se pudo leer la configuración", {
        description: String(e),
      }),
    );
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      form.reset({ delay_entre_sms: settings.delay_entre_sms });
    }
  }, [settings, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateSettings(values.delay_entre_sms);
      toast.success("Configuración guardada");
    } catch (e) {
      toast.error("No se pudo guardar", { description: String(e) });
    }
  });

  const handleUnlink = async () => {
    try {
      await clearConfig();
      toast.success("Dispositivo desvinculado");
      navigate("/pareo");
    } catch (e) {
      toast.error("No se pudo desvincular", { description: String(e) });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const status = await testConnection();
      if (status.connected) {
        toast.success(`Conexión OK — ${status.latency_ms}ms`);
      } else {
        toast.error("Conexión fallida", {
          description: status.error ?? "error desconocido",
        });
      }
    } catch (e) {
      toast.error("Error al probar", { description: String(e) });
    } finally {
      setTesting(false);
    }
  };

  const ledClass =
    connection.kind === "ok"
      ? "led led-ok led-pulse"
      : connection.kind === "testing"
      ? "led led-testing led-pulse"
      : connection.kind === "error" || connection.kind === "unauthorized"
      ? "led led-error"
      : "led";

  const latency =
    connection.kind === "ok" && connection.latencyMs !== null
      ? `${connection.latencyMs}ms`
      : connection.kind === "testing"
      ? "midiendo"
      : connection.kind === "error"
      ? "offline"
      : connection.kind === "unauthorized"
      ? "auth"
      : "—";

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <p className="label-eq mb-2">Parámetros</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Configuración
        </h1>
      </div>

      <section>
        <p className="label-eq mb-3">Dispositivo vinculado</p>
        <div className="border border-border rounded-md p-6 bg-panel space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="label-eq mb-1 text-[0.625rem]">Endpoint</p>
              <p className="font-mono text-sm">{config?.url || "—"}</p>
            </div>
            <div>
              <p className="label-eq mb-1 text-[0.625rem]">Latencia</p>
              <p className="font-mono text-sm">{latency}</p>
            </div>
            <div>
              <p className="label-eq mb-1 text-[0.625rem]">Estado</p>
              <div className="flex items-center gap-2">
                <span className={ledClass} aria-hidden />
                <span className="font-mono text-sm capitalize">
                  {connection.kind}
                </span>
              </div>
            </div>
          </div>

          {connection.kind === "error" && (
            <div className="border border-destructive/40 rounded-md p-3 bg-destructive/5">
              <p className="label-eq mb-1 text-[0.625rem] text-destructive">
                Último error
              </p>
              <p className="font-mono text-xs break-words leading-relaxed">
                {connection.message}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !config?.url}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-2 ${testing ? "animate-spin" : ""}`}
              />
              Probar conexión
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/pareo")}
            >
              Re-parear
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive ml-auto"
              onClick={handleUnlink}
            >
              <Unlink className="h-3.5 w-3.5 mr-2" />
              Desvincular
            </Button>
          </div>
        </div>
      </section>

      <section>
        <p className="label-eq mb-3">Envío SMS</p>
        <div className="border border-border rounded-md p-6 bg-panel">
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-6">
              <FormField
                control={form.control}
                name="delay_entre_sms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-eq">
                      Delay entre mensajes
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={500}
                          max={10000}
                          step={100}
                          className="font-mono text-sm w-40"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.valueAsNumber;
                            field.onChange(Number.isNaN(v) ? undefined : v);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                        <span className="font-mono text-sm text-muted-foreground">
                          ms
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Pausa entre cada SMS enviado. Mínimo recomendado 2000 ms
                      para no saturar la SIM del móvil. Rango 500 – 10000 ms.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={
                    form.formState.isSubmitting ||
                    settingsLoading ||
                    !form.formState.isDirty
                  }
                >
                  <Save className="h-3.5 w-3.5 mr-2" />
                  Guardar
                </Button>
                {form.formState.isDirty && (
                  <span className="label-eq text-[0.625rem] text-muted-foreground">
                    Cambios sin guardar
                  </span>
                )}
              </div>
            </form>
          </Form>
        </div>
      </section>
    </div>
  );
}
