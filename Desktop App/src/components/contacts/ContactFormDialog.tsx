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
  contactSchema,
  type ContactFormValues,
} from "@/schemas/contact.schema";
import { useContactsStore } from "@/store/contacts.store";
import type { Contact } from "@/types";

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
}: ContactFormDialogProps) {
  const create = useContactsStore((s) => s.create);
  const update = useContactsStore((s) => s.update);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nombre: "",
      numero: "+53",
      notas: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nombre: contact?.nombre ?? "",
        numero: contact?.numero ?? "+53",
        notas: contact?.notas ?? "",
      });
    }
  }, [open, contact, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const notas = values.notas && values.notas.length > 0 ? values.notas : null;
    try {
      if (contact) {
        await update(contact.id, values.nombre, values.numero, notas);
        toast.success("Contacto actualizado");
      } else {
        await create(values.nombre, values.numero, notas);
        toast.success("Contacto creado");
      }
      onOpenChange(false);
    } catch (e) {
      const message = String(e);
      if (message.toLowerCase().includes("duplicate") || message.includes("UNIQUE")) {
        form.setError("numero", { message: "Ese número ya está registrado" });
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
            {contact ? "Editar contacto" : "Nuevo contacto"}
          </DialogTitle>
          <DialogDescription>
            El número debe incluir código de país. Ejemplo: +54911...
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
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="label-eq">Número</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="+54911..."
                      autoComplete="off"
                      spellCheck={false}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="label-eq">Notas</FormLabel>
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
                {contact ? "Guardar cambios" : "Crear contacto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
