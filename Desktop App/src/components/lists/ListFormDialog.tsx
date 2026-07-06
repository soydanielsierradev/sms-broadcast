import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  listSchema,
  type ListFormValues,
} from "@/schemas/list.schema";
import { useListsStore } from "@/store/lists.store";
import type { List } from "@/types";

interface ListFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: List | null;
}

export function ListFormDialog({
  open,
  onOpenChange,
  list,
}: ListFormDialogProps) {
  const create = useListsStore((s) => s.create);
  const update = useListsStore((s) => s.update);

  const form = useForm<ListFormValues>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nombre: list?.nombre ?? "",
        descripcion: list?.descripcion ?? "",
      });
    }
  }, [open, list, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const descripcion =
      values.descripcion && values.descripcion.length > 0
        ? values.descripcion
        : null;
    try {
      if (list) {
        await update(list.id, values.nombre, descripcion);
        toast.success("Lista actualizada");
      } else {
        await create(values.nombre, descripcion);
        toast.success("Lista creada");
      }
      onOpenChange(false);
    } catch (e) {
      const message = String(e);
      if (message.toLowerCase().includes("unique")) {
        form.setError("nombre", { message: "Ya existe una lista con ese nombre" });
      } else {
        toast.error("No se pudo guardar", { description: message });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {list ? "Editar lista" : "Nueva lista"}
          </DialogTitle>
          <DialogDescription>
            Agrupá contactos por segmento (clientes activos, VIP, etc).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="label-eq">Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="label-eq">Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={3}
                      placeholder="Opcional"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {list ? "Guardar cambios" : "Crear lista"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
