import {
  ArrowRight,
  Layers,
  Radio,
  RefreshCw,
  Send,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCampaignStore } from "@/store/campaign.store";
import { useContactsStore } from "@/store/contacts.store";
import { useListsStore } from "@/store/lists.store";
import { useMobileStore } from "@/store/mobile.store";
import type { Campaign, CampaignEstado } from "@/types";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
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

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  loading?: boolean;
}

function MetricCard({ label, value, icon, loading }: MetricCardProps) {
  return (
    <div className="border border-border rounded-md p-5 bg-panel">
      <div className="flex items-start justify-between mb-3">
        <p className="label-eq text-[0.625rem]">{label}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      {loading ? (
        <Skeleton className="h-9 w-16" />
      ) : (
        <p className="font-mono text-4xl font-semibold tracking-tight">
          {value}
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const contacts = useContactsStore((s) => s.contacts);
  const contactsLoading = useContactsStore((s) => s.loading);
  const fetchContacts = useContactsStore((s) => s.fetchAll);

  const lists = useListsStore((s) => s.lists);
  const listsLoading = useListsStore((s) => s.loading);
  const fetchLists = useListsStore((s) => s.fetchAll);

  const campaigns = useCampaignStore((s) => s.campaigns);
  const campaignsLoading = useCampaignStore((s) => s.loading);
  const fetchCampaigns = useCampaignStore((s) => s.fetchAll);

  const config = useMobileStore((s) => s.config);
  const connection = useMobileStore((s) => s.connection);
  const testConnection = useMobileStore((s) => s.testConnection);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    void fetchContacts();
    void fetchLists();
    void fetchCampaigns();
  }, [fetchContacts, fetchLists, fetchCampaigns]);

  const totals = useMemo(() => {
    const smsSent = campaigns.reduce((acc, c) => acc + c.enviados, 0);
    const completed = campaigns.filter((c) => c.estado === "completado").length;
    return { smsSent, completed };
  }, [campaigns]);

  const lastCampaign: Campaign | null = campaigns[0] ?? null;
  const lastPercent = useMemo(() => {
    if (!lastCampaign || lastCampaign.total_contactos === 0) return 0;
    return Math.round(
      ((lastCampaign.enviados + lastCampaign.errores) /
        lastCampaign.total_contactos) *
        100,
    );
  }, [lastCampaign]);

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

  const connectionLabel =
    connection.kind === "ok"
      ? "Conectado"
      : connection.kind === "testing"
      ? "Probando"
      : connection.kind === "unauthorized"
      ? "Token inválido"
      : connection.kind === "error"
      ? "Sin conexión"
      : "Desconocido";

  return (
    <div className="space-y-8">
      <div>
        <p className="label-eq mb-2">Panel</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Contactos"
          value={contacts.length}
          icon={<UsersRound className="h-4 w-4" />}
          loading={contactsLoading}
        />
        <MetricCard
          label="Listas"
          value={lists.length}
          icon={<Layers className="h-4 w-4" />}
          loading={listsLoading}
        />
        <MetricCard
          label="Campañas completas"
          value={totals.completed}
          icon={<Radio className="h-4 w-4" />}
          loading={campaignsLoading}
        />
        <MetricCard
          label="SMS enviados"
          value={totals.smsSent}
          icon={<Send className="h-4 w-4" />}
          loading={campaignsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-border rounded-md p-6 bg-panel space-y-4">
          <div className="flex items-center justify-between">
            <p className="label-eq">Estado del celular</p>
            <div className="flex items-center gap-2">
              <span className={ledClass} aria-hidden />
              <span className="font-mono text-sm">{connectionLabel}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="label-eq text-[0.625rem] mb-1">Endpoint</p>
              <p className="font-mono text-xs truncate">
                {config?.url ?? "—"}
              </p>
            </div>
            <div>
              <p className="label-eq text-[0.625rem] mb-1">Latencia</p>
              <p className="font-mono text-xs">
                {connection.kind === "ok" && connection.latencyMs !== null
                  ? `${connection.latencyMs}ms`
                  : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing || !config?.url}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5 mr-2",
                  testing && "animate-spin",
                )}
              />
              Probar conexión
            </Button>
            {!config?.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/pareo")}
              >
                Parear celular
              </Button>
            )}
          </div>
        </div>

        <div className="border border-border rounded-md p-6 bg-panel space-y-4">
          <div className="flex items-center justify-between">
            <p className="label-eq">Última campaña</p>
            {lastCampaign && (
              <Badge
                className={cn(
                  "font-mono uppercase text-[0.625rem]",
                  estadoBadgeClass(lastCampaign.estado),
                )}
                variant="secondary"
              >
                {lastCampaign.estado}
              </Badge>
            )}
          </div>

          {campaignsLoading && (
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {!campaignsLoading && !lastCampaign && (
            <EmptyState
              icon={Radio}
              title="Todavía no enviaste campañas"
              description="Cuando envíes la primera aparece acá."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/campana/nueva")}
                >
                  Crear campaña
                </Button>
              }
              compact
            />
          )}

          {!campaignsLoading && lastCampaign && (
            <>
              <div>
                <p className="font-medium truncate">{lastCampaign.nombre}</p>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  {formatDate(lastCampaign.created_at)}
                </p>
              </div>

              <Progress value={lastPercent} className="h-2" />

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="label-eq text-[0.625rem] mb-1">Enviados</p>
                  <p className="font-mono text-lg text-success">
                    {lastCampaign.enviados}
                  </p>
                </div>
                <div>
                  <p className="label-eq text-[0.625rem] mb-1">Errores</p>
                  <p className="font-mono text-lg text-destructive">
                    {lastCampaign.errores}
                  </p>
                </div>
                <div>
                  <p className="label-eq text-[0.625rem] mb-1">Total</p>
                  <p className="font-mono text-lg">
                    {lastCampaign.total_contactos}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/historial/${lastCampaign.id}`)}
              >
                Ver detalle
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div>
        <p className="label-eq mb-3">Accesos rápidos</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            size="lg"
            className="justify-start h-auto py-4"
            onClick={() => navigate("/campana/nueva")}
          >
            <Send className="h-4 w-4 mr-3" />
            <div className="text-left">
              <p className="font-medium">Nueva campaña</p>
              <p className="text-xs text-muted-foreground font-normal">
                Componer y enviar
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="justify-start h-auto py-4"
            onClick={() => navigate("/contactos")}
          >
            <UsersRound className="h-4 w-4 mr-3" />
            <div className="text-left">
              <p className="font-medium">Contactos</p>
              <p className="text-xs text-muted-foreground font-normal">
                {contacts.length} en el directorio
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="justify-start h-auto py-4"
            onClick={() => navigate("/historial")}
          >
            <Radio className="h-4 w-4 mr-3" />
            <div className="text-left">
              <p className="font-medium">Historial</p>
              <p className="text-xs text-muted-foreground font-normal">
                {campaigns.length} campañas
              </p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
