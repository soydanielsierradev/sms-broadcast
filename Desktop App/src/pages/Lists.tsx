import { FolderPlus, Layers, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AssignContactsDialog } from "@/components/lists/AssignContactsDialog";
import { ListFormDialog } from "@/components/lists/ListFormDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useListsStore } from "@/store/lists.store";
import type { List } from "@/types";

export default function Lists() {
  const lists = useListsStore((s) => s.lists);
  const loading = useListsStore((s) => s.loading);
  const fetchAll = useListsStore((s) => s.fetchAll);
  const remove = useListsStore((s) => s.remove);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<List | null>(null);
  const [assigning, setAssigning] = useState<List | null>(null);
  const [deleting, setDeleting] = useState<List | null>(null);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (l: List) => {
    setEditing(l);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove(deleting.id);
      toast.success("Lista eliminada");
      setDeleting(null);
    } catch (e) {
      toast.error("No se pudo eliminar", { description: String(e) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label-eq mb-2">Segmentos</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Listas
          </h1>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-3.5 w-3.5 mr-2" />
          Nueva lista
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-panel">
              <CardHeader>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!loading && lists.length === 0 && (
        <div className="border border-dashed border-border rounded-md">
          <EmptyState
            icon={Layers}
            title="Todavía no hay listas"
            description="Creá una para agrupar contactos por segmento y enviar campañas dirigidas."
            action={
              <Button onClick={openNew} variant="outline">
                <FolderPlus className="h-3.5 w-3.5 mr-2" />
                Crear primera lista
              </Button>
            }
            className="py-16"
          />
        </div>
      )}

      {!loading && lists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((l) => (
            <Card
              key={l.id}
              className="bg-panel flex flex-col hover:border-primary/40 transition-colors"
            >
              <CardHeader className="flex-row items-start justify-between space-y-0 gap-2 pb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-semibold text-lg leading-tight truncate">
                    {l.nombre}
                  </h3>
                </div>
                <Badge variant="secondary" className="font-mono shrink-0">
                  <Users className="h-3 w-3 mr-1" />
                  {l.total_contactos}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {l.descripcion || "Sin descripción"}
                </p>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setAssigning(l)}
                >
                  <Users className="h-3.5 w-3.5 mr-2" />
                  Asignar
                </Button>
                <TooltipProvider>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(l)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleting(l)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <ListFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        list={editing}
      />

      <AssignContactsDialog
        open={!!assigning}
        onOpenChange={(open) => !open && setAssigning(null)}
        list={assigning}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar lista"
        description={
          deleting
            ? `¿Seguro que querés eliminar la lista "${deleting.nombre}"? Los contactos NO se borran, solo se desvinculan.`
            : ""
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
