import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { AlertCircle, CameraOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { tryParsePairingQr, type PairingConfigParsed } from "@/schemas/pairing.schema";

interface QRScannerProps {
  onDetected: (config: PairingConfigParsed) => void;
  onCameraError?: (msg: string) => void;
}

type ScannerStatus =
  | { kind: "starting" }
  | { kind: "scanning" }
  | { kind: "invalid" }
  | { kind: "error"; message: string };

export function QRScanner({ onDetected, onCameraError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [status, setStatus] = useState<ScannerStatus>({ kind: "starting" });

  useEffect(() => {
    let cancelled = false;
    const reader = new BrowserQRCodeReader();

    const start = async () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result, _err, ctrl) => {
            if (cancelled) {
              ctrl.stop();
              return;
            }
            if (!result) return;
            const parsed = tryParsePairingQr(result.getText());
            if (parsed) {
              ctrl.stop();
              onDetected(parsed);
            } else {
              // Keep scanning — user might reposition the QR
              setStatus({ kind: "invalid" });
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus({ kind: "scanning" });
      } catch (e) {
        const message = String(e);
        setStatus({ kind: "error", message });
        onCameraError?.(message);
      }
    };

    void start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [onDetected, onCameraError]);

  if (status.kind === "error") {
    return (
      <div className="border border-border rounded-md p-6 bg-panel">
        <div className="flex items-start gap-3">
          <CameraOff className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="label-eq mb-1">Cámara no disponible</p>
            <p className="text-sm text-foreground mb-1">
              No se pudo acceder a la cámara.
            </p>
            <p className="text-xs text-muted-foreground font-mono break-words">
              {status.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full aspect-square object-cover rounded-md bg-black"
        muted
        playsInline
        autoPlay
      />
      <div className="pointer-events-none absolute inset-0 rounded-md">
        <div className="absolute inset-8 border border-primary/80 rounded" />
        <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
        <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
        <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
        <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        {status.kind === "starting" && (
          <>
            <span className="led led-pulse led-active" aria-hidden />
            <span className="label-eq">Iniciando cámara</span>
          </>
        )}
        {status.kind === "scanning" && (
          <>
            <span className="led led-active led-pulse" aria-hidden />
            <span className="label-eq">Escaneando</span>
          </>
        )}
        {status.kind === "invalid" && (
          <>
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            <span className="label-eq text-destructive">
              QR no reconocido — seguí probando
            </span>
          </>
        )}
      </div>
    </div>
  );
}
