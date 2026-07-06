import { AlertCircle, CheckCircle2, FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContactsStore } from "@/store/contacts.store";
import type { ImportResult } from "@/types";

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PreviewRow {
  nombre: string;
  numero: string;
  notas: string;
}

function parsePreview(csv: string, maxRows = 10): PreviewRow[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const rows: PreviewRow[] = [];
  for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    rows.push({
      nombre: cols[0] ?? "",
      numero: cols[1] ?? "",
      notas: cols[2] ?? "",
    });
  }
  return rows;
}

export function ImportCSVDialog({ open, onOpenChange }: ImportCSVDialogProps) {
  const importCsv = useContactsStore((s) => s.importCsv);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setFileName(null);
    setCsvContent("");
    setPreview([]);
    setTotalRows(0);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    setFileName(file.name);
    setCsvContent(text);
    setPreview(parsePreview(text));
    setTotalRows(Math.max(0, lines.length - 1));
    setResult(null);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const handleImport = async () => {
    if (!csvContent) return;
    setImporting(true);
    try {
      const res = await importCsv(csvContent);
      setResult(res);
      if (res.imported > 0) {
        toast.success(
          `${res.imported} contacto${res.imported === 1 ? "" : "s"} importado${res.imported === 1 ? "" : "s"}`,
        );
      }
    } catch (e) {
      toast.error("Error al importar", { description: String(e) });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Importar CSV</DialogTitle>
          <DialogDescription>
            Formato:{" "}
            <span className="font-mono text-xs">nombre,numero,notas</span> (con
            encabezado en la primera fila). Los duplicados se ignoran.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-2" />
                {fileName ? "Cambiar archivo" : "Elegir archivo CSV"}
              </Button>
              {fileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs">{fileName}</span>
                  <span className="label-eq text-[0.625rem]">
                    {totalRows} filas
                  </span>
                </div>
              )}
            </div>
          </div>

          {preview.length > 0 && !result && (
            <div>
              <p className="label-eq mb-2 text-[0.625rem]">
                Vista previa (primeras {preview.length}
                {totalRows > preview.length ? ` de ${totalRows}` : ""})
              </p>
              <ScrollArea className="h-56 border border-border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="label-eq text-[0.625rem]">
                        Nombre
                      </TableHead>
                      <TableHead className="label-eq text-[0.625rem]">
                        Número
                      </TableHead>
                      <TableHead className="label-eq text-[0.625rem]">
                        Notas
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.nombre}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.numero}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.notas || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Importación completada</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="label-eq text-[0.625rem]">Importados</p>
                      <p className="font-mono text-lg">{result.imported}</p>
                    </div>
                    <div>
                      <p className="label-eq text-[0.625rem]">Duplicados</p>
                      <p className="font-mono text-lg text-muted-foreground">
                        {result.duplicated}
                      </p>
                    </div>
                    <div>
                      <p className="label-eq text-[0.625rem]">Errores</p>
                      <p className="font-mono text-lg text-destructive">
                        {result.errors.length}
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Filas con error</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="h-32 mt-2">
                      <ul className="space-y-1 font-mono text-xs">
                        {result.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!csvContent || importing}
            >
              {importing ? "Importando..." : "Importar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
