import { ArrowLeft, Filter, Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useCampaignStore } from "@/store/campaign.store";
import type {
  Campaign,
  CampaignEstado,
  MessageEstado,
  MessageLog,
} from "@/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

function computeDurationMs(campaign: Campaign): number | null {
  if (!campaign.completed_at) return null;
  try {
    const start = new Date(campaign.created_at).getTime();
    const end = new Date(campaign.completed_at).getTime();
    return end - start;
  } catch {
    return null;
  }
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms < 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function estadoBadgeClass(estado: CampaignEstado): string {
  switch (estado) {
    case "enviando":
      return "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] hover:bg-[hsl(var(--warning))]";
    case "completado":
      return "bg-success text-success-foreground hover:bg-success";
    case "cancelado":
      return "bg-destructive/20 text-destructive hover:bg-destructive/20 border-destructive/30";
    default:
      return "";
  }
}

function messageBadgeClass(estado: MessageEstado): string {
  switch (estado) {
    case "enviado":
      return "bg-success text-success-foreground hover:bg-success";
    case "error":
    case "invalido":
      return "bg-destructive text-destructive-foreground hover:bg-destructive";
    default:
      return "";
  }
}

type LogFilter = "todos" | "enviados" | "errores" | "pendientes";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const activeDetail = useCampaignStore((s) => s.activeDetail);
  const fetchOne = useCampaignStore((s) => s.fetchOne);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LogFilter>("todos");

  useEffect(() => {
    if (!id) return;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return;
    setLoading(true);
    fetchOne(numericId)
      .catch((e) =>
        toast.error("No se pudo cargar la campaña", {
          description: String(e),
        }),
      )
      .finally(() => setLoading(false));
  }, [id, fetchOne]);

  const campaign = activeDetail?.campaign;
  const mensajes = activeDetail?.mensajes ?? [];

  const counts = useMemo(() => {
    const c = { todos: 0, enviados: 0, errores: 0, pendientes: 0 };
    for (const m of mensajes) {
      c.todos++;
      if (m.estado === "enviado") c.enviados++;
      else if (m.estado === "error" || m.estado === "invalido") c.errores++;
      else if (m.estado === "pendiente") c.pendientes++;
    }
    return c;
  }, [mensajes]);

  const filteredLog = useMemo(() => {
    if (filter === "todos") return mensajes;
    if (filter === "enviados")
      return mensajes.filter((m) => m.estado === "enviado");
    if (filter === "errores")
      return mensajes.filter(
        (m) => m.estado === "error" || m.estado === "invalido",
      );
    return mensajes.filter((m) => m.estado === "pendiente");
  }, [mensajes, filter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/historial")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-2" />
          Volver al historial
        </Button>
        <p className="text-muted-foreground">
          Campaña no encontrada.
        </p>
      </div>
    );
  }

  const duration = computeDurationMs(campaign);
  const percentComplete =
    campaign.total_contactos > 0
      ? Math.round(
          ((campaign.enviados + campaign.errores) / campaign.total_contactos) *
            100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/historial")}
        className="-ml-2"
      >
        <ArrowLeft className="h-3.5 w-3.5 mr-2" />
        Volver
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="label-eq mb-2">Campaña #{campaign.id}</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {campaign.nombre}
          </h1>
        </div>
        <Badge
          className={cn(
            "font-mono uppercase",
            estadoBadgeClass(campaign.estado),
          )}
          variant="secondary"
        >
          {campaign.estado}
        </Badge>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="log">
            Log detallado
            <span className="font-mono text-[0.625rem] text-muted-foreground ml-2">
              {mensajes.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6 mt-6">
          <div className="border border-border rounded-md p-6 bg-panel">
            <p className="label-eq mb-4">Métricas</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="label-eq text-[0.625rem] mb-1">Enviados</p>
                <p className="font-mono text-3xl text-success">
                  {campaign.enviados}
                </p>
              </div>
              <div>
                <p className="label-eq text-[0.625rem] mb-1">Errores</p>
                <p className="font-mono text-3xl text-destructive">
                  {campaign.errores}
                </p>
              </div>
              <div>
                <p className="label-eq text-[0.625rem] mb-1">Total</p>
                <p className="font-mono text-3xl">{campaign.total_contactos}</p>
              </div>
              <div>
                <p className="label-eq text-[0.625rem] mb-1">Progreso</p>
                <p className="font-mono text-3xl">{percentComplete}%</p>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-md p-6 bg-panel">
            <p className="label-eq mb-4">Cronología</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="label-eq text-[0.625rem] mb-1">Creada</p>
                <p className="font-mono text-sm">
                  {formatDate(campaign.created_at)}
                </p>
              </div>
              <div>
                <p className="label-eq text-[0.625rem] mb-1">Finalizada</p>
                <p className="font-mono text-sm">
                  {formatDate(campaign.completed_at)}
                </p>
              </div>
              <div>
                <p className="label-eq text-[0.625rem] mb-1">Duración</p>
                <p className="font-mono text-sm">
                  {formatDuration(duration)}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-md p-6 bg-panel">
            <p className="label-eq mb-3">Mensaje base</p>
            <div className="border border-border rounded-md p-3 bg-background">
              <p className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {campaign.mensaje}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="log" className="space-y-4 mt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="label-eq text-[0.625rem] mr-2">Filtrar</span>
            {(
              [
                { key: "todos", label: "Todos" },
                { key: "enviados", label: "Enviados" },
                { key: "errores", label: "Errores" },
                { key: "pendientes", label: "Pendientes" },
              ] as const
            ).map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span
                  className={cn(
                    "font-mono text-[0.625rem] ml-2",
                    filter === f.key
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {counts[f.key]}
                </span>
              </Button>
            ))}
          </div>

          <div className="border border-border rounded-md bg-panel">
            <ScrollArea className="h-[28rem]">
              {filteredLog.length === 0 && (
                <EmptyState
                  icon={Radio}
                  title="Sin entradas"
                  description="No hay mensajes que coincidan con este filtro"
                />
              )}
              {filteredLog.map((entry: MessageLog) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0"
                >
                  <Badge
                    className={cn(
                      "font-mono uppercase text-[0.625rem] shrink-0 mt-0.5",
                      messageBadgeClass(entry.estado),
                    )}
                    variant="secondary"
                  >
                    {entry.estado}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-medium truncate">
                        {entry.nombre || "—"}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {entry.numero}
                      </p>
                    </div>
                    {entry.error_detalle && (
                      <p className="font-mono text-xs text-destructive mt-1 break-words">
                        {entry.error_detalle}
                      </p>
                    )}
                    <p className="font-mono text-[0.625rem] text-muted-foreground/70 mt-1">
                      {formatDate(entry.sent_at)}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
