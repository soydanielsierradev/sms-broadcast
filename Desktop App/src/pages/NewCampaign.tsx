import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Loader2,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { StepIndicator } from "@/components/campaigns/StepIndicator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { campaignsApi, listsApi } from "@/lib/tauri";
import { cn } from "@/lib/utils";
import { calculateSmsParts } from "@/schemas/campaign.schema";
import { useCampaignStore } from "@/store/campaign.store";
import { useListsStore } from "@/store/lists.store";
import { useMobileStore } from "@/store/mobile.store";
import type { Contact, MessageLog } from "@/types";

type Step = 1 | 2 | 3 | 4;

function personalizeMessage(mensaje: string, contact: Contact | null): string {
  if (!contact) return mensaje;
  return mensaje
    .replace(/\{\{nombre\}\}/g, contact.nombre)
    .replace(/\{\{numero\}\}/g, contact.numero);
}

export default function NewCampaign() {
  const navigate = useNavigate();
  const lists = useListsStore((s) => s.lists);
  const fetchAllLists = useListsStore((s) => s.fetchAll);

  const isPairedFn = useMobileStore((s) => s.isPaired);
  const connection = useMobileStore((s) => s.connection);
  const testConnection = useMobileStore((s) => s.testConnection);
  const paired = isPairedFn();

  const createCampaign = useCampaignStore((s) => s.create);
  const startCampaign = useCampaignStore((s) => s.start);
  const cancelCampaign = useCampaignStore((s) => s.cancel);
  const subscribeEvents = useCampaignStore((s) => s.subscribeEvents);
  const resetSendingState = useCampaignStore((s) => s.resetSendingState);
  const progress = useCampaignStore((s) => s.progress);
  const isSending = useCampaignStore((s) => s.isSending);
  const lastStopReason = useCampaignStore((s) => s.lastStopReason);

  const [step, setStep] = useState<Step>(1);
  const [nombre, setNombre] = useState("");
  const [listaId, setListaId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [firstContact, setFirstContact] = useState<Contact | null>(null);
  const [listContacts, setListContacts] = useState<Contact[]>([]);
  const [campanaId, setCampanaId] = useState<number | null>(null);
  const [messageLog, setMessageLog] = useState<MessageLog[]>([]);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void fetchAllLists();
  }, [fetchAllLists]);

  useEffect(() => {
    if (!listaId) {
      setFirstContact(null);
      setListContacts([]);
      return;
    }
    listsApi
      .getContacts(listaId)
      .then((contacts) => {
        setListContacts(contacts);
        setFirstContact(contacts[0] ?? null);
      })
      .catch((e) =>
        toast.error("No se pudieron cargar los contactos de la lista", {
          description: String(e),
        }),
      );
  }, [listaId]);

  useEffect(() => {
    if (step !== 4) return;
    let unsub: (() => void) | undefined;
    subscribeEvents().then((u) => (unsub = u));
    return () => {
      if (unsub) unsub();
    };
  }, [step, subscribeEvents]);

  useEffect(() => {
    if (step !== 4 || !campanaId) return;
    let cancelled = false;
    const refresh = () => {
      campaignsApi
        .getLog(campanaId)
        .then((log) => !cancelled && setMessageLog(log))
        .catch(() => {});
    };
    refresh();
    const t = setInterval(refresh, 1200);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [step, campanaId, isSending]);

  const parts = calculateSmsParts(mensaje);
  const partsColor =
    parts === 0
      ? "secondary"
      : parts === 1
      ? "success"
      : parts === 2
      ? "warning"
      : "destructive";

  const selectedList = lists.find((l) => l.id === listaId) ?? null;
  const canContinueStep1 =
    paired && nombre.trim().length > 0 && listaId !== null;
  const canContinueStep2 =
    mensaje.trim().length > 0 && parts > 0 && parts <= 10;

  const insertVariable = (v: string) => {
    const el = textareaRef.current;
    if (!el) {
      setMensaje((m) => m + v);
      return;
    }
    const start = el.selectionStart ?? mensaje.length;
    const end = el.selectionEnd ?? mensaje.length;
    const next = mensaje.slice(0, start) + v + mensaje.slice(end);
    setMensaje(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + v.length, start + v.length);
    });
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await testConnection();
    } catch (e) {
      toast.error("Error al probar", { description: String(e) });
    } finally {
      setTesting(false);
    }
  };

  const handleSend = async () => {
    if (!listaId) return;
    setCreating(true);
    try {
      const campaign = await createCampaign(nombre.trim(), mensaje, listaId);
      setCampanaId(campaign.id);
      resetSendingState();
      setStep(4);
      await startCampaign(campaign.id);
    } catch (e) {
      toast.error("No se pudo iniciar la campaña", { description: String(e) });
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async () => {
    if (!campanaId) return;
    try {
      await cancelCampaign(campanaId);
      toast.info("Cancelación solicitada");
    } catch (e) {
      toast.error("No se pudo cancelar", { description: String(e) });
    }
  };

  const resetWizard = () => {
    setStep(1);
    setNombre("");
    setListaId(null);
    setMensaje("");
    setFirstContact(null);
    setListContacts([]);
    setCampanaId(null);
    setMessageLog([]);
    resetSendingState();
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="label-eq mb-2">Emisión</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Nueva campaña
        </h1>
      </div>

      <StepIndicator step={step} />

      {step === 1 && (
        <Step1
          paired={paired}
          nombre={nombre}
          onNombreChange={setNombre}
          listaId={listaId}
          onListaChange={setListaId}
          lists={lists}
          onContinue={() => setStep(2)}
          canContinue={canContinueStep1}
          onGoPairing={() => navigate("/pareo")}
        />
      )}

      {step === 2 && (
        <Step2
          mensaje={mensaje}
          onMensajeChange={setMensaje}
          textareaRef={textareaRef}
          onInsertVariable={insertVariable}
          parts={parts}
          partsColor={partsColor}
          firstContact={firstContact}
          selectedListCount={selectedList?.total_contactos ?? listContacts.length}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
          canContinue={canContinueStep2}
        />
      )}

      {step === 3 && (
        <Step3
          nombre={nombre}
          selectedList={selectedList}
          mensaje={mensaje}
          parts={parts}
          firstContact={firstContact}
          connection={connection}
          testing={testing}
          onTest={handleTest}
          onBack={() => setStep(2)}
          onSend={handleSend}
          sending={creating}
          onGoPairing={() => navigate("/pareo")}
        />
      )}

      {step === 4 && (
        <Step4
          campanaId={campanaId}
          progress={progress}
          isSending={isSending}
          lastStopReason={lastStopReason}
          messageLog={messageLog}
          totalContacts={listContacts.length}
          onCancel={handleCancel}
          onReset={resetWizard}
          onViewHistory={() => navigate("/historial")}
          onGoPairing={() => navigate("/pareo")}
        />
      )}
    </div>
  );
}

// ------------------------------ STEP 1 ------------------------------

interface Step1Props {
  paired: boolean;
  nombre: string;
  onNombreChange: (v: string) => void;
  listaId: number | null;
  onListaChange: (id: number | null) => void;
  lists: { id: number; nombre: string; total_contactos: number }[];
  onContinue: () => void;
  canContinue: boolean;
  onGoPairing: () => void;
}

function Step1({
  paired,
  nombre,
  onNombreChange,
  listaId,
  onListaChange,
  lists,
  onContinue,
  canContinue,
  onGoPairing,
}: Step1Props) {
  return (
    <div className="space-y-6">
      {!paired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Celular no vinculado</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>
              Antes de crear una campaña necesitás parear la app con el
              celular.
            </span>
            <Button variant="outline" size="sm" onClick={onGoPairing}>
              Ir al pareo
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="border border-border rounded-md p-6 bg-panel space-y-4">
        <div className="space-y-2">
          <Label htmlFor="campaign-name" className="label-eq">
            Nombre de la campaña
          </Label>
          <Input
            id="campaign-name"
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            placeholder="Promo octubre — clientes activos"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label className="label-eq">Lista destinataria</Label>
          <Select
            value={listaId ? String(listaId) : ""}
            onValueChange={(v) => onListaChange(v ? Number(v) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Elegí una lista" />
            </SelectTrigger>
            <SelectContent>
              {lists.length === 0 ? (
                <SelectItem value="__empty" disabled>
                  No hay listas — creá una primero
                </SelectItem>
              ) : (
                lists.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    <span className="flex items-center gap-2">
                      {l.nombre}
                      <span className="font-mono text-xs text-muted-foreground">
                        · {l.total_contactos}
                      </span>
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onContinue} disabled={!canContinue}>
          Continuar
          <ArrowRight className="h-3.5 w-3.5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ------------------------------ STEP 2 ------------------------------

interface Step2Props {
  mensaje: string;
  onMensajeChange: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsertVariable: (v: string) => void;
  parts: number;
  partsColor: "secondary" | "success" | "warning" | "destructive";
  firstContact: Contact | null;
  selectedListCount: number;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
}

function Step2({
  mensaje,
  onMensajeChange,
  textareaRef,
  onInsertVariable,
  parts,
  partsColor,
  firstContact,
  selectedListCount,
  onBack,
  onContinue,
  canContinue,
}: Step2Props) {
  const preview = personalizeMessage(mensaje || "…", firstContact);

  const partsBadgeClass = cn(
    "font-mono",
    partsColor === "success" &&
      "bg-success text-success-foreground hover:bg-success",
    partsColor === "warning" &&
      "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] hover:bg-[hsl(var(--warning))]",
    partsColor === "destructive" &&
      "bg-destructive text-destructive-foreground hover:bg-destructive",
  );

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-md p-6 bg-panel space-y-4">
        <div className="flex items-center justify-between">
          <Label className="label-eq">Mensaje</Label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {mensaje.length} chars
            </span>
            <Badge className={partsBadgeClass} variant="secondary">
              {parts} {parts === 1 ? "parte" : "partes"} SMS
            </Badge>
          </div>
        </div>

        <Textarea
          ref={textareaRef}
          value={mensaje}
          onChange={(e) => onMensajeChange(e.target.value)}
          placeholder="Hola {{nombre}}, tu pedido está listo para retirar."
          rows={6}
          className="font-mono text-sm"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="label-eq text-[0.625rem]">Insertar:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInsertVariable("{{nombre}}")}
          >
            {`{{nombre}}`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInsertVariable("{{numero}}")}
          >
            {`{{numero}}`}
          </Button>
          <span className="label-eq text-[0.625rem] text-muted-foreground ml-auto">
            {selectedListCount} destinatarios
          </span>
        </div>

        {parts > 3 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Mensaje largo</AlertTitle>
            <AlertDescription>
              Cada SMS extra se cobra por separado. Considerá acortar el
              mensaje si el costo importa.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="border border-border rounded-md p-6 bg-panel">
        <p className="label-eq mb-3">
          Vista previa {firstContact ? `— ${firstContact.nombre}` : ""}
        </p>
        <div className="border border-border rounded-md p-4 bg-background">
          <p className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
            {preview}
          </p>
        </div>
        {!firstContact && (
          <p className="text-xs text-muted-foreground mt-2">
            La lista está vacía. Asigná contactos antes de enviar.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5 mr-2" />
          Volver
        </Button>
        <Button onClick={onContinue} disabled={!canContinue}>
          Continuar
          <ArrowRight className="h-3.5 w-3.5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ------------------------------ STEP 3 ------------------------------

interface Step3Props {
  nombre: string;
  selectedList: { id: number; nombre: string; total_contactos: number } | null;
  mensaje: string;
  parts: number;
  firstContact: Contact | null;
  connection: ReturnType<typeof useMobileStore.getState>["connection"];
  testing: boolean;
  onTest: () => void;
  onBack: () => void;
  onSend: () => void;
  sending: boolean;
  onGoPairing: () => void;
}

function Step3({
  nombre,
  selectedList,
  mensaje,
  parts,
  firstContact,
  connection,
  testing,
  onTest,
  onBack,
  onSend,
  sending,
  onGoPairing,
}: Step3Props) {
  const canSend =
    connection.kind === "ok" && (selectedList?.total_contactos ?? 0) > 0;
  const ledClass =
    connection.kind === "ok"
      ? "led led-ok led-pulse"
      : connection.kind === "testing"
      ? "led led-testing led-pulse"
      : connection.kind === "error" || connection.kind === "unauthorized"
      ? "led led-error"
      : "led";

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-md p-6 bg-panel space-y-4">
        <p className="label-eq mb-2">Resumen</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="label-eq mb-1 text-[0.625rem]">Nombre</p>
            <p className="font-medium">{nombre}</p>
          </div>
          <div>
            <p className="label-eq mb-1 text-[0.625rem]">Lista</p>
            <p className="font-medium">
              {selectedList?.nombre}{" "}
              <span className="font-mono text-xs text-muted-foreground">
                · {selectedList?.total_contactos ?? 0}
              </span>
            </p>
          </div>
          <div>
            <p className="label-eq mb-1 text-[0.625rem]">Partes SMS por mensaje</p>
            <p className="font-mono">{parts}</p>
          </div>
          <div>
            <p className="label-eq mb-1 text-[0.625rem]">SMS totales estimados</p>
            <p className="font-mono">
              {parts * (selectedList?.total_contactos ?? 0)}
            </p>
          </div>
        </div>

        <div>
          <p className="label-eq mb-2 text-[0.625rem]">
            Mensaje {firstContact ? `— para ${firstContact.nombre}` : ""}
          </p>
          <div className="border border-border rounded-md p-3 bg-background">
            <p className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {personalizeMessage(mensaje, firstContact)}
            </p>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-md p-6 bg-panel">
        <div className="flex items-center justify-between mb-3">
          <p className="label-eq">Estado del celular</p>
          <div className="flex items-center gap-2">
            <span className={ledClass} aria-hidden />
            <span className="font-mono text-sm capitalize">
              {connection.kind}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={testing || connection.kind === "testing"}
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5 mr-2",
              (testing || connection.kind === "testing") && "animate-spin",
            )}
          />
          Probar conexión
        </Button>

        {connection.kind === "error" && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Conexión fallida</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="font-mono text-xs">{connection.message}</p>
              <Button variant="outline" size="sm" onClick={onGoPairing}>
                Re-parear
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {connection.kind === "unauthorized" && (
          <Alert variant="destructive" className="mt-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Token rechazado (401)</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="text-sm">
                Puede que el celular haya rotado el token. Re-parear con QR
                soluciona esto.
              </p>
              <Button variant="outline" size="sm" onClick={onGoPairing}>
                Re-parear
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} disabled={sending}>
          <ArrowLeft className="h-3.5 w-3.5 mr-2" />
          Volver
        </Button>
        <Button onClick={onSend} disabled={!canSend || sending} size="lg">
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Iniciando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar campaña
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ------------------------------ STEP 4 ------------------------------

interface Step4Props {
  campanaId: number | null;
  progress: ReturnType<typeof useCampaignStore.getState>["progress"];
  isSending: boolean;
  lastStopReason: ReturnType<typeof useCampaignStore.getState>["lastStopReason"];
  messageLog: MessageLog[];
  totalContacts: number;
  onCancel: () => void;
  onReset: () => void;
  onViewHistory: () => void;
  onGoPairing: () => void;
}

function Step4({
  campanaId,
  progress,
  isSending,
  lastStopReason,
  messageLog,
  totalContacts,
  onCancel,
  onReset,
  onViewHistory,
  onGoPairing,
}: Step4Props) {
  const enviados = progress?.enviados ?? 0;
  const errores = progress?.errores ?? 0;
  const total = progress?.total ?? totalContacts;
  const porcentaje = progress?.porcentaje ?? 0;

  const done = !isSending && lastStopReason !== null;
  const authError = lastStopReason === "auth_error";
  const permError = lastStopReason === "perm_error";
  const cancelled = lastStopReason === "cancelled";
  const completed = lastStopReason === "completed";

  const logSorted = useMemo(
    () =>
      [...messageLog].sort((a, b) => {
        const at = a.sent_at ?? "";
        const bt = b.sent_at ?? "";
        return bt.localeCompare(at);
      }),
    [messageLog],
  );

  return (
    <div className="space-y-6">
      {authError && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Celular rechazó el token (401)</AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="text-sm">
              Puede que haya rotado la clave. Re-escaneá el QR de la app
              móvil para continuar.
            </p>
            <Button variant="outline" size="sm" onClick={onGoPairing}>
              Re-parear ahora
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {permError && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Permiso SMS revocado (503)</AlertTitle>
          <AlertDescription>
            Abrí la app móvil y concedé el permiso SMS nuevamente. Después
            volvé a enviar la campaña.
          </AlertDescription>
        </Alert>
      )}

      <div className="border border-border rounded-md p-6 bg-panel space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "led !w-3 !h-3",
                isSending
                  ? "led-active led-pulse"
                  : completed
                  ? "led-ok"
                  : cancelled
                  ? ""
                  : "led-error",
              )}
              aria-hidden
            />
            <span className="label-eq">
              {isSending
                ? "Emitiendo"
                : completed
                ? "Finalizado"
                : cancelled
                ? "Cancelado"
                : "Interrumpido"}
            </span>
          </div>
          <span className="font-mono text-sm">
            {enviados + errores} / {total}
          </span>
        </div>

        <Progress value={porcentaje} className="h-2" />

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="label-eq text-[0.625rem] mb-1">Enviados</p>
            <p className="font-mono text-2xl text-success">{enviados}</p>
          </div>
          <div>
            <p className="label-eq text-[0.625rem] mb-1">Errores</p>
            <p className="font-mono text-2xl text-destructive">{errores}</p>
          </div>
          <div>
            <p className="label-eq text-[0.625rem] mb-1">Progreso</p>
            <p className="font-mono text-2xl">{porcentaje}%</p>
          </div>
        </div>

        {isSending && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <Ban className="h-3.5 w-3.5 mr-2" />
              Cancelar envío
            </Button>
          </div>
        )}
      </div>

      <div className="border border-border rounded-md bg-panel">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="label-eq">Registro</p>
          <span className="label-eq text-[0.625rem] text-muted-foreground">
            {logSorted.length} entrada{logSorted.length === 1 ? "" : "s"}
          </span>
        </div>
        <ScrollArea className="h-72">
          {logSorted.length === 0 && (
            <div className="text-center py-12 px-4">
              <Radio className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                Esperando la primera respuesta del móvil...
              </p>
            </div>
          )}
          {logSorted.map((entry) => {
            const badgeClass =
              entry.estado === "enviado"
                ? "bg-success text-success-foreground hover:bg-success"
                : entry.estado === "error" || entry.estado === "invalido"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive"
                : "";
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-2 border-b border-border last:border-b-0"
              >
                <Badge className={cn("font-mono uppercase text-[0.625rem]", badgeClass)} variant="secondary">
                  {entry.estado}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {entry.nombre || "—"}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {entry.numero}
                  </p>
                </div>
                {entry.error_detalle && (
                  <p className="font-mono text-xs text-destructive truncate max-w-[180px]">
                    {entry.error_detalle}
                  </p>
                )}
              </div>
            );
          })}
        </ScrollArea>
      </div>

      {done && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onReset}>
            <ArrowLeft className="h-3.5 w-3.5 mr-2" />
            Nueva campaña
          </Button>
          {campanaId && (
            <Button onClick={onViewHistory}>Ver en historial</Button>
          )}
        </div>
      )}
    </div>
  );
}
