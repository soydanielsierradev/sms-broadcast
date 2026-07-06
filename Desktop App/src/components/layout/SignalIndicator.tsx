import { useMobileStore } from "@/store/mobile.store";

function truncateUrl(url: string): string {
  const stripped = url.replace(/^https?:\/\//, "");
  return stripped.length > 22 ? stripped.slice(0, 20) + "…" : stripped;
}

export function SignalIndicator() {
  const config = useMobileStore((s) => s.config);
  const connection = useMobileStore((s) => s.connection);

  const paired = !!config && config.token_set && config.url.length > 0;

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
      ? "checking"
      : connection.kind === "unauthorized"
      ? "unauth"
      : connection.kind === "error"
      ? "offline"
      : "—";

  return (
    <div className="border border-border rounded-md px-3 py-2.5 bg-background">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={ledClass} aria-hidden />
        <span className="label-eq text-[0.625rem]">SIGNAL</span>
      </div>
      <div className="font-mono text-[0.6875rem] leading-tight text-foreground">
        {paired && config ? truncateUrl(config.url) : "sin parear"}
      </div>
      <div className="font-mono text-[0.6875rem] leading-tight text-muted-foreground">
        {latency}
      </div>
    </div>
  );
}
