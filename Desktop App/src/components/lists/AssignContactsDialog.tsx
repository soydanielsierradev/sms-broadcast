import { Search, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { contactsApi, listsApi } from "@/lib/tauri";
import { useListsStore } from "@/store/lists.store";
import type { Contact, List } from "@/types";

interface AssignContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: List | null;
}

export function AssignContactsDialog({
  open,
  onOpenChange,
  list,
}: AssignContactsDialogProps) {
  const addContact = useListsStore((s) => s.addContact);
  const removeContact = useListsStore((s) => s.removeContact);
  const fetchAllLists = useListsStore((s) => s.fetchAll);

  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [initial, setInitial] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !list) return;

    setLoading(true);
    Promise.all([contactsApi.list(), listsApi.getContacts(list.id)])
      .then(([all, assigned]) => {
        const assignedIds = new Set(assigned.map((c) => c.id));
        setAllContacts(all);
        setInitial(assignedIds);
        setCurrent(new Set(assignedIds));
        setQuery("");
      })
      .catch((e) =>
        toast.error("No se pudieron cargar los contactos", {
          description: String(e),
        }),
      )
      .finally(() => setLoading(false));
  }, [open, list]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allContacts;
    const q = query.trim().toLowerCase();
    return allContacts.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) || c.numero.includes(q),
    );
  }, [allContacts, query]);

  const toggle = (id: number) => {
    setCurrent((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    const allChecked = filtered.every((c) => current.has(c.id));
    setCurrent((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        for (const c of filtered) next.delete(c.id);
      } else {
        for (const c of filtered) next.add(c.id);
      }
      return next;
    });
  };

  const dirty = useMemo(() => {
    if (initial.size !== current.size) return true;
    for (const id of initial) if (!current.has(id)) return true;
    return false;
  }, [initial, current]);

  const toAdd = useMemo(
    () => [...current].filter((id) => !initial.has(id)),
    [current, initial],
  );
  const toRemove = useMemo(
    () => [...initial].filter((id) => !current.has(id)),
    [current, initial],
  );

  const handleSave = async () => {
    if (!list || !dirty) return;
    setSaving(true);
    try {
      for (const id of toAdd) await addContact(list.id, id);
      for (const id of toRemove) await removeContact(list.id, id);
      const added = toAdd.length;
      const removed = toRemove.length;
      toast.success(
        `Lista actualizada — ${added} agregado${added === 1 ? "" : "s"}, ${removed} removido${removed === 1 ? "" : "s"}`,
      );
      await fetchAllLists();
      onOpenChange(false);
    } catch (e) {
      toast.error("No se pudo guardar", { description: String(e) });
    } finally {
      setSaving(false);
    }
  };

  const filteredAllChecked =
    filtered.length > 0 && filtered.every((c) => current.has(c.id));
  const filteredSomeChecked =
    filtered.some((c) => current.has(c.id)) && !filteredAllChecked;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {list ? `Asignar contactos — ${list.nombre}` : "Asignar contactos"}
          </DialogTitle>
          <DialogDescription>
            Marcá los contactos que pertenecen a esta lista.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o número"
              className="pl-9"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={
                  filteredAllChecked
                    ? true
                    : filteredSomeChecked
                    ? "indeterminate"
                    : false
                }
                onCheckedChange={toggleAllFiltered}
                disabled={filtered.length === 0 || loading}
              />
              <span className="label-eq text-[0.625rem]">
                Seleccionar todos ({filtered.length})
              </span>
            </label>
            <span className="label-eq text-[0.625rem] text-primary">
              {current.size} asignado{current.size === 1 ? "" : "s"}
            </span>
          </div>

          <ScrollArea className="h-72 border border-border rounded-md bg-panel">
            {loading && (
              <div className="p-3 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <EmptyState
                icon={UsersRound}
                title={query ? "Sin resultados" : "No hay contactos"}
                description={
                  query
                    ? "Probá con otro término"
                    : "Creá contactos primero en la sección Contactos"
                }
              />
            )}

            {!loading &&
              filtered.map((c) => {
                const checked = current.has(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2 border-b border-border last:border-b-0 cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(c.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.nombre}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {c.numero}
                      </p>
                    </div>
                  </label>
                );
              })}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!dirty || saving || loading}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
