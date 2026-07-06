import { Pencil, Plus, Search, Trash2, Upload, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ContactFormDialog } from "@/components/contacts/ContactFormDialog";
import { ImportCSVDialog } from "@/components/contacts/ImportCSVDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useContactsStore } from "@/store/contacts.store";
import type { Contact } from "@/types";

export default function Contacts() {
  const contacts = useContactsStore((s) => s.contacts);
  const loading = useContactsStore((s) => s.loading);
  const search = useContactsStore((s) => s.search);
  const fetchAll = useContactsStore((s) => s.fetchAll);
  const remove = useContactsStore((s) => s.remove);
  const removeBulk = useContactsStore((s) => s.removeBulk);

  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const t = setTimeout(() => {
      void search(query);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Drop IDs that are no longer in the visible list (e.g. after search filtered them out).
  useEffect(() => {
    setSelectedIds((prev) => {
      const visible = new Set(contacts.map((c) => c.id));
      const next = new Set<number>();
      for (const id of prev) if (visible.has(id)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }, [contacts]);

  const visibleIds = useMemo(() => contacts.map((c) => c.id), [contacts]);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (visibleIds.every((id) => prev.has(id))) return new Set();
      return new Set(visibleIds);
    });
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove(deleting.id);
      toast.success("Contacto eliminado");
      setDeleting(null);
    } catch (e) {
      toast.error("No se pudo eliminar", { description: String(e) });
    }
  };

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const deleted = await removeBulk(ids);
      toast.success(
        `${deleted} contacto${deleted === 1 ? "" : "s"} eliminado${deleted === 1 ? "" : "s"}`,
      );
      setSelectedIds(new Set());
      setBulkConfirmOpen(false);
    } catch (e) {
      toast.error("No se pudieron eliminar", { description: String(e) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label-eq mb-2">Directorio</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Contactos
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCsvOpen(true)}>
            <Upload className="h-3.5 w-3.5 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-2" />
            Nuevo contacto
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o número"
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="font-mono">
          {loading ? "…" : contacts.length} contactos
        </Badge>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 border border-primary/40 bg-primary/5 rounded-md px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="label-eq text-primary">
              {selectedIds.size} seleccionado{selectedIds.size === 1 ? "" : "s"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-muted-foreground"
              onClick={clearSelection}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpiar
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkConfirmOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Eliminar seleccionados
          </Button>
        </div>
      )}

      <div className="border border-border rounded-md bg-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    allSelected
                      ? true
                      : someSelected
                      ? "indeterminate"
                      : false
                  }
                  onCheckedChange={toggleAll}
                  disabled={contacts.length === 0 || loading}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead className="label-eq text-[0.625rem]">Nombre</TableHead>
              <TableHead className="label-eq text-[0.625rem]">Número</TableHead>
              <TableHead className="label-eq text-[0.625rem]">Notas</TableHead>
              <TableHead className="label-eq text-[0.625rem] text-center">
                Listas
              </TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}

            {!loading && contacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={UsersRound}
                    title={query ? "Sin resultados" : "Todavía no hay contactos"}
                    description={
                      query
                        ? "Probá con otro término"
                        : "Agregá uno nuevo o importá un CSV"
                    }
                  />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              contacts.map((c) => {
                const isSelected = selectedIds.has(c.id);
                return (
                  <TableRow
                    key={c.id}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(c.id)}
                        aria-label={`Seleccionar ${c.nombre}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{c.nombre}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {c.numero}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {c.notas || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-sm">{c.total_listas}</span>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(c)}
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
                                onClick={() => setDeleting(c)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      <ContactFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        contact={editing}
      />

      <ImportCSVDialog open={csvOpen} onOpenChange={setCsvOpen} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar contacto"
        description={
          deleting
            ? `¿Seguro que querés eliminar a ${deleting.nombre}? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title="Eliminar contactos seleccionados"
        description={`¿Seguro que querés eliminar ${selectedIds.size} contacto${selectedIds.size === 1 ? "" : "s"}? Esta acción no se puede deshacer.`}
        confirmLabel={`Eliminar ${selectedIds.size}`}
        destructive
        onConfirm={confirmBulkDelete}
      />
    </div>
  );
}
