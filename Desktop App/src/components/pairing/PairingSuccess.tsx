import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useMobileStore } from "@/store/mobile.store";

export function PairingSuccess() {
  const navigate = useNavigate();
  const config = useMobileStore((s) => s.config);
  const connection = useMobileStore((s) => s.connection);
  const testConnection = useMobileStore((s) => s.testConnection);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (connection.kind === "unknown") {
      void testConnection();
    }
  }, [connection.kind, testConnection]);

  const isOk = connection.kind === "ok";
  const isTesting = connection.kind === "testing";
  const failed = connection.kind === "error" || connection.kind === "unauthorized";

  const latency =
    isOk && connection.latencyMs !== null
      ? `${connection.latencyMs}ms`
      : isTesting
      ? "midiendo…"
      : "—";

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await testConnection();
    } catch {
      /* store already stored the error */
    } finally {
      setRetrying(false);
    }
  };

  const errorMessage =
    connection.kind === "error"
      ? connection.message
      : connection.kind === "unauthorized"
      ? "El móvil rechazó el token (401). Revisá que el token coincida con el del celular."
      : null;

  return (
    <div className="text-center space-y-8">
      <div className="inline-flex flex-col items-center">
        <span
          className={
            isOk
              ? "led led-ok led-pulse !w-3 !h-3"
              : failed
              ? "led led-error !w-3 !h-3"
              : "led led-testing led-pulse !w-3 !h-3"
          }
          aria-hidden
        />
      </div>

      <div>
        <p className="label-eq mb-2">
          {isOk ? "Vinculado" : failed ? "Configuración guardada" : "Vinculando"}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {isOk
            ? "Celular conectado"
            : failed
            ? "Conexión fallida"
            : "Probando conexión"}
        </h1>
      </div>

      <div className="border border-border rounded-md p-6 bg-panel space-y-3 text-left">
        <div className="flex items-center justify-between">
          <span className="label-eq">Endpoint</span>
          <span className="font-mono text-sm">{config?.url ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="label-eq">Latencia</span>
          <span className="font-mono text-sm">{latency}</span>
        </div>
      </div>

      {failed && errorMessage && (
        <div className="border border-destructive/50 rounded-md p-4 text-left bg-destructive/5 space-y-3">
          <div>
            <p className="label-eq mb-1 text-destructive">Detalle del error</p>
            <p className="font-mono text-xs text-foreground break-words leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <div>
            <p className="label-eq mb-1 text-[0.625rem]">Causas comunes</p>
            <ul className="text-xs text-muted-foreground space-y-1 pl-3">
              <li>· El servidor del celular no está encendido (tocá "Start server" en la app móvil)</li>
              <li>· IP incorrecta — verificá la IP del celular en la app móvil</li>
              <li>· Escritorio y celular en redes distintas</li>
              <li>· Firewall bloqueando el puerto 8080</li>
            </ul>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRetry}
            disabled={retrying || isTesting}
          >
            {retrying || isTesting ? "Probando…" : "Reintentar test"}
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        {failed && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/pareo")}
          >
            Volver
          </Button>
        )}
        <Button
          onClick={() => navigate("/")}
          className="flex-1"
          size="lg"
          disabled={isTesting}
        >
          {isOk ? "Comenzar" : failed ? "Continuar igual" : "Un momento…"}
        </Button>
      </div>
    </div>
  );
}
