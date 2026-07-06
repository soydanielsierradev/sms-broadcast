import { Eye, Radio } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useCampaignStore } from "@/store/campaign.store";
import type { Campaign, CampaignEstado } from "@/types";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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

export default function History() {
  const navigate = useNavigate();
  const campaigns = useCampaignStore((s) => s.campaigns);
  const loading = useCampaignStore((s) => s.loading);
  const fetchAll = useCampaignStore((s) => s.fetchAll);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-eq mb-2">Registro</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Historial
        </h1>
      </div>

      <div className="border border-border rounded-md bg-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="label-eq text-[0.625rem]">Nombre</TableHead>
              <TableHead className="label-eq text-[0.625rem]">Estado</TableHead>
              <TableHead className="label-eq text-[0.625rem] text-center">
                Enviados
              </TableHead>
              <TableHead className="label-eq text-[0.625rem] text-center">
                Errores
              </TableHead>
              <TableHead className="label-eq text-[0.625rem] text-center">
                Total
              </TableHead>
              <TableHead className="label-eq text-[0.625rem]">Fecha</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}

            {!loading && campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={Radio}
                    title="Todavía no enviaste campañas"
                    description="Las campañas enviadas aparecen acá, con detalle por contacto."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/campana/nueva")}
                      >
                        Crear una campaña
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              campaigns.map((c: Campaign) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/historial/${c.id}`)}
                >
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "font-mono uppercase text-[0.625rem]",
                        estadoBadgeClass(c.estado),
                      )}
                      variant="secondary"
                    >
                      {c.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-success">
                    {c.enviados}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-destructive">
                    {c.errores}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {c.total_contactos}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatDate(c.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/historial/${c.id}`);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
