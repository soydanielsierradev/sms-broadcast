# SMS Broadcast Desktop App — CLAUDE.md

## Documentos de referencia

| Archivo | Propósito |
|---|---|
| `CLAUDE.md` | Este archivo — arquitectura, stack y tareas en orden |
| `SPEC.md` | Contrato de integración con la app móvil |

> **Regla de prioridad:** Si hay contradicción entre `CLAUDE.md` y `SPEC.md`,
> **`SPEC.md` tiene prioridad absoluta**. Leer ambos antes de empezar.

---

## Descripción del Proyecto

Aplicación de escritorio para gestión y envío de campañas SMS masivas.
Desarrollada con Tauri 2.0 (Rust) + React + Vite. Se comunica con una app
móvil Android (React Native) que actúa como servidor SMS usando la SIM del
dispositivo. La app de escritorio corre en **Windows** (cliente final), el
desarrollo se realiza en **Arch Linux**.

---

## Stack Tecnológico

### Frontend
- React 18 + Vite
- TypeScript
- Tailwind CSS v3
- shadcn/ui (componentes — instalados via `npx shadcn@latest add`)
- next-themes (soporte dark/light mode)
- Zustand (manejo de estado global)
- Zod (validación de formularios)
- React Hook Form + @hookform/resolvers/zod
- React Router v6 (navegación)
- Lucide React (iconos)
- Sonner (notificaciones/toasts)

### Backend (Rust)
- Tauri 2.0
- rusqlite + rusqlite_migration (SQLite)
- serde + serde_json (serialización)
- reqwest (HTTP client para comunicación con móvil — con Bearer token)
- tokio (async runtime)
- thiserror (manejo de errores)
- keyring (almacenamiento seguro del token de autenticación)

### Frontend — librerías adicionales para pareo QR
- @zxing/browser + @zxing/library (lector QR desde cámara o imagen)
- qrcode.react (mostrar QR — opcional, para debug)

---

## Sistema de Estilos — shadcn/ui + Tailwind + next-themes

### Filosofía
shadcn/ui NO es una dependencia instalada como paquete. Es una colección de
componentes que se COPIAN al proyecto con el CLI. Cada componente vive en
`src/components/ui/` y puede modificarse libremente.

### Configuración de temas (dark/light)

**1. Instalar next-themes:**
```bash
npm install next-themes
```

**2. Envolver la app en ThemeProvider (src/main.tsx o App.tsx):**
```tsx
import { ThemeProvider } from 'next-themes'

<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  <App />
</ThemeProvider>
```

**3. Variables CSS en src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 10% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**4. tailwind.config.ts:**
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

**5. components.json (config shadcn):**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Componentes shadcn a instalar
```bash
npx shadcn@latest init
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add progress
npx shadcn@latest add alert
npx shadcn@latest add separator
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tooltip
npx shadcn@latest add switch
npx shadcn@latest add tabs
npx shadcn@latest add scroll-area
npx shadcn@latest add skeleton
```

### Toggle de tema en el Sidebar
Agregar un botón de toggle dark/light en el sidebar usando `useTheme` de next-themes:
```tsx
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

---

## Estructura del Proyecto

```
sms-broadcast/
├── src-tauri/                  # Backend Rust
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   ├── migrations.rs
│   │   │   └── connection.rs
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   ├── contact.rs
│   │   │   ├── list.rs
│   │   │   ├── campaign.rs
│   │   │   └── message_log.rs
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── contacts.rs
│   │   │   ├── lists.rs
│   │   │   ├── campaigns.rs
│   │   │   ├── sms.rs              # Bearer token + reintentos backoff
│   │   │   ├── mobile_config.rs    # set/get_mobile_config via keyring
│   │   │   └── settings.rs
│   │   └── errors.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                        # Frontend React
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── components/
│   │   ├── ui/                 # Componentes shadcn (generados por CLI)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── pairing/                # ← NUEVO: flujo de pareo QR
│   │   │   ├── PairingScreen.tsx   # Pantalla si no hay config guardada
│   │   │   ├── QRScanner.tsx       # Lector QR con @zxing/browser
│   │   │   └── PairingSuccess.tsx  # Confirmación tras pareo exitoso
│   │   ├── contacts/
│   │   │   ├── ContactTable.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   └── ImportCSVModal.tsx
│   │   ├── lists/
│   │   │   ├── ListCard.tsx
│   │   │   ├── ListForm.tsx
│   │   │   └── AssignContactsModal.tsx
│   │   ├── campaigns/
│   │   │   ├── MessageComposer.tsx
│   │   │   ├── CampaignProgress.tsx
│   │   │   └── PreviewModal.tsx
│   │   └── shared/
│   │       ├── ConfirmDialog.tsx
│   │       ├── StatusBadge.tsx
│   │       └── EmptyState.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Contacts.tsx
│   │   ├── Lists.tsx
│   │   ├── NewCampaign.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   ├── store/
│   │   ├── contacts.store.ts
│   │   ├── lists.store.ts
│   │   ├── campaign.store.ts
│   │   ├── mobile.store.ts         # ← NUEVO: estado de pareo y conexión
│   │   └── settings.store.ts
│   ├── schemas/
│   │   ├── contact.schema.ts
│   │   ├── list.schema.ts
│   │   ├── campaign.schema.ts
│   │   └── settings.schema.ts
│   ├── lib/
│   │   ├── tauri.ts
│   │   ├── utils.ts            # cn() de shadcn aquí
│   │   └── csv.ts
│   └── types/
│       └── index.ts
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── components.json
```

---

## Base de Datos SQLite — Esquema Completo

```sql
CREATE TABLE IF NOT EXISTS contactos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT NOT NULL,
    numero      TEXT NOT NULL UNIQUE,
    notas       TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listas (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT NOT NULL UNIQUE,
    descripcion  TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lista_contactos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    lista_id     INTEGER NOT NULL REFERENCES listas(id) ON DELETE CASCADE,
    contacto_id  INTEGER NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
    UNIQUE(lista_id, contacto_id)
);

CREATE TABLE IF NOT EXISTS campanas (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre           TEXT NOT NULL,
    mensaje          TEXT NOT NULL,
    lista_id         INTEGER REFERENCES listas(id),
    total_contactos  INTEGER DEFAULT 0,
    enviados         INTEGER DEFAULT 0,
    errores          INTEGER DEFAULT 0,
    estado           TEXT DEFAULT 'pendiente',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at     DATETIME
);

CREATE TABLE IF NOT EXISTS mensajes_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    campana_id    INTEGER NOT NULL REFERENCES campanas(id) ON DELETE CASCADE,
    contacto_id   INTEGER REFERENCES contactos(id),
    numero        TEXT NOT NULL,
    nombre        TEXT,
    mensaje_final TEXT NOT NULL,
    estado        TEXT DEFAULT 'pendiente',
    error_detalle TEXT,
    sent_at       DATETIME
);

CREATE TABLE IF NOT EXISTS configuracion (
    clave  TEXT PRIMARY KEY,
    valor  TEXT NOT NULL
);

INSERT OR IGNORE INTO configuracion (clave, valor) VALUES
    ('movil_url', 'http://192.168.43.1:8080'),
    ('delay_entre_sms', '2000'),
    ('app_version', '1.0.0');

-- NOTA: el token Bearer NO se guarda en esta tabla.
-- Se almacena en el keyring del sistema operativo via crate `keyring`.
-- Clave del keyring: service="sms-broadcast", user="mobile-token"
```

---

## Tauri Commands — API Rust→Frontend

### Contactos
```
get_contacts() -> Vec<Contact>
get_contact(id: i64) -> Contact
create_contact(nombre, numero, notas) -> Contact
update_contact(id, nombre, numero, notas) -> Contact
delete_contact(id: i64) -> bool
import_contacts_csv(csv_content: String) -> ImportResult
search_contacts(query: String) -> Vec<Contact>
```

### Listas
```
get_lists() -> Vec<List>
get_list(id: i64) -> ListWithContacts
create_list(nombre, descripcion) -> List
update_list(id, nombre, descripcion) -> List
delete_list(id: i64) -> bool
add_contact_to_list(lista_id, contacto_id) -> bool
remove_contact_from_list(lista_id, contacto_id) -> bool
get_list_contacts(lista_id: i64) -> Vec<Contact>
```

### Campañas
```
get_campaigns() -> Vec<Campaign>
get_campaign(id: i64) -> CampaignDetail
create_campaign(nombre, mensaje, lista_id) -> Campaign
get_campaign_log(campana_id: i64) -> Vec<MessageLog>
```

### SMS
```
send_campaign(campana_id: i64) -> ()
test_mobile_connection() -> ConnectionStatus
cancel_campaign(campana_id: i64) -> bool
```

### Configuración y pareo QR
```
get_settings() -> Settings
update_settings(delay) -> Settings
set_mobile_config(url: String, token: String) -> bool
get_mobile_config() -> MobileConfig   -- { url, token_set: bool }
test_mobile_connection() -> ConnectionStatus
clear_mobile_config() -> bool
```

### SMS
```
send_campaign(campana_id: i64) -> ()   -- incluye Bearer token en cada POST
test_mobile_connection() -> ConnectionStatus
cancel_campaign(campana_id: i64) -> bool
```

> **El token nunca sale del backend Rust.** Los commands de envío lo leen
> directamente desde keyring y agregan el header `Authorization: Bearer <token>`.
> El frontend NUNCA recibe ni manipula el token.

---

## Eventos Tauri (Backend → Frontend en tiempo real)

```
"sms:progress"     -> { campana_id, enviados, total, porcentaje }
"sms:sent"         -> { contacto_id, numero, estado }
"sms:error"        -> { contacto_id, numero, error }
"sms:completed"    -> { campana_id, enviados, errores, duracion }
"sms:auth_error"   -> { campana_id }   -- 401 recibido, campaña detenida, pedir re-pareo
"sms:perm_error"   -> { campana_id }   -- 503 recibido, permiso SMS revocado en el móvil
```

---

## Comunicación con App Móvil (ver SPEC.md para detalle completo)

```
GET  http://{url}/health
-- Sin autenticación. Para verificar conectividad.

POST http://{url}/send-sms
Content-Type: application/json
Authorization: Bearer <token>   ← OBLIGATORIO según SPEC.md

{ "to": "+521234567890", "message": "Hola Juan, tu pedido está listo" }
```

### Manejo de respuestas en send_campaign (según SPEC.md §4)

| Status | Acción en Rust |
|---|---|
| `200` | Marcar enviado en BD, emitir `sms:sent`, continuar |
| `400` | Marcar inválido en BD, emitir `sms:error`, **no reintentar** |
| `401` | **STOP campaña**, emitir `sms:auth_error`, pedir re-pareo al usuario |
| `500` | Reintentar con backoff exponencial (máx 3 intentos), luego marcar error |
| `503` | **STOP campaña**, emitir `sms:perm_error`, alertar permiso revocado |

### Cálculo de partes SMS (según SPEC.md §5)
```rust
// Para mensajes multi-parte, calcular en cliente:
let partes = (mensaje.len() as f64 / 153.0).ceil() as u32;
// 153 chars por parte en mensajes concatenados GSM-7, no 160
```

---

## TAREAS EN ORDEN LÓGICO

### FASE 0 — Setup del proyecto

**Tarea 0.1 — Inicializar proyecto Tauri**
```bash
cargo install create-tauri-app
npm create tauri-app@latest sms-broadcast -- --template react-ts
cd sms-broadcast
```

**Tarea 0.2 — Instalar dependencias frontend**
```bash
npm install zustand zod react-hook-form @hookform/resolvers
npm install react-router-dom lucide-react sonner
npm install next-themes
npm install tailwindcss-animate
npm install @zxing/browser @zxing/library   # lector QR para pareo
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Tarea 0.3 — Configurar shadcn/ui**
```bash
npx shadcn@latest init
# Cuando pregunte: style=default, baseColor=slate, cssVariables=yes
npx shadcn@latest add button input label textarea
npx shadcn@latest add card table badge dialog
npx shadcn@latest add form select checkbox switch tabs
npx shadcn@latest add progress alert separator scroll-area skeleton
npx shadcn@latest add dropdown-menu tooltip
```

**Tarea 0.4 — Configurar variables CSS y tema**
- Implementar el bloque :root y .dark completo en src/index.css (definido arriba)
- Configurar tailwind.config.ts con darkMode: ['class'] (definido arriba)
- Crear components.json (definido arriba)
- Verificar que cn() existe en src/lib/utils.ts:
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
- Instalar dependencias de cn(): `npm install clsx tailwind-merge`

**Tarea 0.5 — Configurar dependencias Rust en Cargo.toml**
```toml
[dependencies]
tauri = { version = "2", features = ["protocol-asset"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
rusqlite_migration = "1.2"
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["json"] }
thiserror = "1"
keyring = "2"    # almacenamiento seguro del token Bearer
```

**Tarea 0.6 — Verificar compilación**
```bash
npm run tauri dev
```
La ventana debe abrirse sin errores.

---

### FASE 1 — Base de datos y modelos Rust

**Tarea 1.1** — Módulo conexión SQLite (db/connection.rs)
- init_db(app_handle) → Mutex<Connection> como Tauri State
- Ruta: app_handle.path().app_data_dir()

**Tarea 1.2** — Migraciones (db/migrations.rs)
- Implementar esquema completo con rusqlite_migration
- Ejecutar al inicio en lib.rs

**Tarea 1.3** — Modelos con Serialize/Deserialize
- Contact, List, ListWithContacts
- Campaign, CampaignDetail, MessageLog
- Settings (ahora solo delay_entre_sms — url y token van separados)
- MobileConfig — { url: String, token_set: bool }  ← token_set indica si hay token guardado en keyring, nunca exponer el token al frontend
- ImportResult, ConnectionStatus

**Tarea 1.4** — Módulo de errores (errors.rs)
- Enum AppError: DbError, NetworkError, ValidationError, NotFound
- thiserror::Error + conversión serializable para Tauri

---

### FASE 2 — Commands Rust: Contactos

**Tarea 2.1** — get_contacts() con JOIN para contar listas
**Tarea 2.2** — search_contacts(query) con LIKE
**Tarea 2.3** — create_contact() con validación de duplicado
**Tarea 2.4** — update_contact() actualizando updated_at
**Tarea 2.5** — delete_contact()
**Tarea 2.6** — import_contacts_csv() con INSERT OR IGNORE → ImportResult

---

### FASE 3 — Commands Rust: Listas

**Tarea 3.1** — get_lists() con subquery conteo de contactos
**Tarea 3.2** — get_list_contacts(lista_id)
**Tarea 3.3** — create_list() / update_list()
**Tarea 3.4** — delete_list() con CASCADE
**Tarea 3.5** — add_contact_to_list() / remove_contact_from_list()

---

### FASE 4 — Commands Rust: Configuración y Pareo

**Tarea 4.1** — get_settings() — solo lee delay_entre_sms de la tabla configuracion

**Tarea 4.2** — update_settings(delay) con INSERT OR REPLACE

**Tarea 4.3** — test_mobile_connection()
- Leer URL desde tabla configuracion
- Leer token desde keyring
- GET {url}/health con header Authorization: Bearer {token}
- Timeout 5s, medir latencia
- Retornar ConnectionStatus

**Tarea 4.4** — Nuevo: commands/mobile_config.rs
```rust
// Guardar URL en SQLite y token en keyring del SO
#[tauri::command]
async fn set_mobile_config(url: String, token: String) -> Result<bool, String> {
    // 1. Validar url: regex ^https?://[^/]+:\d+$
    // 2. Validar token: regex ^[0-9a-f]{32}$
    // 3. Guardar url en tabla configuracion clave='movil_url'
    // 4. Guardar token en keyring: service="sms-broadcast", user="mobile-token"
    // 5. Retornar true
}

#[tauri::command]
async fn get_mobile_config() -> Result<MobileConfig, String> {
    // 1. Leer url de tabla configuracion
    // 2. Verificar si hay token en keyring (token_set: bool) — NO devolver el token
    // 3. Retornar MobileConfig { url, token_set }
}

#[tauri::command]
async fn clear_mobile_config() -> Result<bool, String> {
    // 1. Borrar url de tabla configuracion
    // 2. Borrar token de keyring
}
```

---

### FASE 5 — Commands Rust: Campañas y Envío SMS

**Tarea 5.1** — create_campaign()
- Insertar campaña, contar contactos, crear mensajes_log
- Personalizar mensaje con {{nombre}} y {{numero}}

**Tarea 5.2** — send_campaign() — EL MÁS IMPORTANTE
```
1. Leer URL desde configuracion y token desde keyring
2. Si no hay URL o token → error "Celular no pareado"
3. Obtener mensajes_log pendientes
4. Marcar campaña 'enviando'
5. Para cada mensaje:
   a. POST {url}/send-sms con headers:
      - Content-Type: application/json
      - Authorization: Bearer {token}
   b. Manejar respuesta según SPEC.md §4:
      - 200 → marcar enviado, emitir sms:sent, continuar
      - 400 → marcar inválido, emitir sms:error, NO reintentar, continuar
      - 401 → STOP campaña, marcar estado 'cancelado', emitir sms:auth_error
      - 500 → reintentar con backoff (espera: 1s, 3s, 9s), si falla 3 veces marcar error
      - 503 → STOP campaña, marcar estado 'cancelado', emitir sms:perm_error
   c. Actualizar mensajes_log con estado y sent_at
   d. Incrementar contadores enviados/errores en campanas
   e. Emitir evento sms:progress
   f. Esperar delay configurado (tokio::time::sleep)
6. Marcar campaña 'completado' y guardar completed_at
7. Emitir sms:completed
```
- Cancelación via AtomicBool en State
- El token NUNCA se loguea ni se incluye en eventos Tauri

**Tarea 5.3** — cancel_campaign()
**Tarea 5.4** — get_campaigns() por fecha DESC
**Tarea 5.5** — get_campaign() con detalle + log

---

### FASE 6 — Registro en Tauri

**Tarea 6.1** — Registrar todos los commands en lib.rs
- DB State con Mutex
- State cancelación AtomicBool
- Registrar: todos los commands anteriores + set_mobile_config, get_mobile_config, clear_mobile_config

**Tarea 6.2** — tauri.conf.json
- Filesystem permissions
- Tamaño ventana: 1200x800 mínimo
- Título: "SMS Broadcast"
- Habilitar acceso a cámara (para lector QR): agregar permiso `camera` en capabilities
- Metadata instalador Windows (MSI/NSIS)

---

### FASE 7 — Frontend: Setup base

**Tarea 7.1** — Tipos TypeScript en src/types/index.ts
(espejo de structs Rust: Contact, List, Campaign, etc.)

**Tarea 7.2** — Wrappers tipados invoke() en src/lib/tauri.ts
- Una función tipada por command
- Manejo de errores consistente

**Tarea 7.3** — Schemas Zod
- contactSchema: nombre requerido, número con código de país
- listSchema: nombre requerido
- campaignSchema: nombre, mensaje, lista_id
- settingsSchema: IP válida, puerto 1-65535, delay 500-10000

**Tarea 7.4** — Stores Zustand
- contacts.store.ts: contacts[], fetchContacts, createContact, updateContact, deleteContact, importCSV
- lists.store.ts: lists[], selectedList, fetchLists, fetchListContacts, createList, updateList, deleteList, addContact, removeContact
- campaign.store.ts: campaigns[], activeCampaign, progress, isSending, fetchCampaigns, createCampaign, startSending, cancelSending, listenToEvents
- settings.store.ts: settings, connectionStatus, fetchSettings, updateSettings, testConnection
- mobile.store.ts ← NUEVO:
```typescript
interface MobileStore {
  isPaired: boolean           // hay URL y token guardados
  url: string | null
  tokenSet: boolean           // token existe en keyring (no el token en sí)
  connectionStatus: 'unknown' | 'ok' | 'error' | 'unauthorized'
  checkPairing: () => Promise<void>  // llama get_mobile_config
  saveConfig: (url: string, token: string) => Promise<void>  // llama set_mobile_config + test
  clearConfig: () => Promise<void>
  testConnection: () => Promise<void>
}
```

**Tarea 7.5** — ThemeProvider en main.tsx
```tsx
import { ThemeProvider } from 'next-themes'
// Envolver <App /> con <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

**Tarea 7.6** — Layout principal (Sidebar + ThemeToggle + área de contenido)
- Sidebar fijo izquierda con logo, navegación y ThemeToggle al fondo
- Indicador de conexión móvil (punto verde/rojo) en el sidebar
- Área de contenido principal scrolleable

**Tarea 7.7** — React Router con todas las rutas
- / → Dashboard (o redirect a /pareo si no hay config)
- /pareo → PairingScreen (pantalla de pareo QR — sin Sidebar)
- /contactos → Contacts
- /listas → Lists
- /campana/nueva → NewCampaign
- /historial → History
- /historial/:id → CampaignDetail
- /configuracion → Settings

**Flujo de inicio según SPEC.md §4:**
En App.tsx, al montar, ejecutar `checkPairing()` del mobile.store:
- Si `isPaired === false` → redirigir a /pareo
- Si `isPaired === true` → `testConnection()`:
  - 200 → ir al flujo principal (/)
  - error/timeout → mostrar en Dashboard con opción de re-pareo

---

### FASE 7.5 — Pantalla de Pareo QR (nueva, antes de Fase 8)

Esta pantalla aparece cuando la app no tiene URL+token guardados. Es la
primera experiencia del usuario al instalar la app.

**Tarea 7.5.1** — PairingScreen.tsx
- Pantalla full sin Sidebar (layout propio)
- Instrucciones paso a paso:
  1. Abre la app móvil
  2. Asegúrate de estar en la misma WiFi o hotspot
  3. Toca "Mostrar QR" en la app móvil
  4. Escanea el QR con esta pantalla
- Botón "Escanear QR" que abre QRScanner
- Opción alternativa: "Configurar manualmente" (ir a /configuracion)

**Tarea 7.5.2** — QRScanner.tsx con @zxing/browser
```typescript
// Usar BrowserQRCodeReader de @zxing/browser
// Abrir cámara, escanear QR continuamente
// Al detectar un QR:
//   1. Parsear JSON
//   2. Validar type === "sms-broadcast-config"
//   3. Validar url con regex ^https?://[^/]+:\d+$
//   4. Validar token con regex ^[0-9a-f]{32}$
//   5. Si válido → llamar saveConfig(url, token)
//   6. Si inválido → mostrar error "QR no válido, intenta de nuevo"
// Detener cámara al desmontar el componente
```

**Tarea 7.5.3** — PairingSuccess.tsx
- Mostrar tras pareo exitoso: ✅ con URL conectada y latencia
- Botón "Comenzar" → navegar a /
- Si GET /health falla tras guardar config → mostrar error con guía de red

**Tarea 7.5.4** — Botón "Re-parear" en Configuración
- En /configuracion agregar sección "Dispositivo vinculado"
- Mostrar URL actual (si hay), indicador token_set
- Botón "Re-parear" → ir a /pareo
- Botón "Desvincular" → llamar clear_mobile_config, redirigir a /pareo

---

**Tarea 8.1** — Form con React Hook Form + Zod + shadcn Form/Input
- Campos: IP del móvil, Puerto, Delay entre SMS
- Botón "Guardar" con toast de confirmación
- Sección "Probar conexión" con indicador de latencia
- Usar componentes: Card, Form, Input, Button, Badge, Alert de shadcn

---

### FASE 9 — Página Contactos

**Tarea 9.1** — Tabla con shadcn Table
- Búsqueda con Input + debounce 300ms
- Paginación con Badge de conteo
- Skeleton mientras carga

**Tarea 9.2** — Modal Agregar/Editar con shadcn Dialog + Form
**Tarea 9.3** — ConfirmDialog reutilizable con shadcn AlertDialog
**Tarea 9.4** — Modal Importar CSV con shadcn Dialog + Table preview

---

### FASE 10 — Página Listas

**Tarea 10.1** — Grid de Cards con shadcn Card
**Tarea 10.2** — Modal Crear/Editar con shadcn Dialog + Form
**Tarea 10.3** — Modal Asignar Contactos con shadcn Dialog + Checkbox + ScrollArea

---

### FASE 11 — Nueva Campaña (flujo 4 pasos)

Usar shadcn Tabs o steps manuales con indicador de progreso visual.

**Tarea 11.1** — Step 1: Nombre + Select de lista (shadcn Select)
- Verificar que hay pareo activo antes de continuar; si no, mostrar Alert con link a /pareo

**Tarea 11.2** — Step 2: Compositor
- shadcn Textarea + Badge contador caracteres
- **Cálculo correcto de partes SMS según SPEC.md §5:**
  ```typescript
  // 1 SMS = hasta 160 chars
  // Multi-parte = 153 chars por parte (no 160)
  const partes = message.length <= 160 ? 1 : Math.ceil(message.length / 153)
  ```
- Badge de color: verde (1 parte), amarillo (2), rojo (3+)
- Botones insertar variables `{{nombre}}` `{{numero}}` con shadcn Button variant="outline"
- Card de vista previa en tiempo real con datos del primer contacto

**Tarea 11.3** — Step 3: Confirmación con shadcn Card + Alert
- Verificar conexión con móvil (GET /health) antes de mostrar botón Enviar
- Si falla conexión → Alert destructive con opción re-pareo

**Tarea 11.4** — Step 4: Progreso en tiempo real
- shadcn Progress animado
- shadcn ScrollArea con lista de estados por contacto
- Badge por estado (enviado ✅ / error ❌ / pendiente ⏳)
- **Manejo de paradas de emergencia:**
  - Evento `sms:auth_error` → detener UI, Alert destructive:
    "El celular rechazó el token (401). Puede que haya rotado la clave.
    Re-escanea el QR para continuar." + botón "Re-parear ahora" → /pareo
  - Evento `sms:perm_error` → detener UI, Alert destructive:
    "El permiso SMS fue revocado en el celular (503).
    Abre la app móvil y concede el permiso nuevamente."

---

### FASE 12 — Dashboard

**Tarea 12.1** — Cards métricas con shadcn Card
**Tarea 12.2** — Card estado conexión móvil con Badge verde/rojo
**Tarea 12.3** — Resumen última campaña con shadcn Progress
**Tarea 12.4** — Accesos rápidos con shadcn Button

---

### FASE 13 — Historial

**Tarea 13.1** — Tabla campañas con shadcn Table + Badge por estado
**Tarea 13.2** — Detalle campaña con shadcn Tabs (resumen / log detallado)

---

### FASE 14 — Pulido final

**Tarea 14.1** — Toasts con Sonner para errores y éxitos globales
**Tarea 14.2** — Skeleton loaders en todas las páginas
**Tarea 14.3** — Estados vacíos con EmptyState component
**Tarea 14.4** — Tooltips en acciones de tabla
**Tarea 14.5** — Build para Windows
```bash
rustup target add x86_64-pc-windows-msvc
cargo install cargo-xwin
npm run tauri build -- --target x86_64-pc-windows-msvc
```

---

## Convenciones de Código

### Rust
- Result<T, AppError> en todos los commands
- No usar .unwrap() en producción
- cargo fmt antes de cada fase

### TypeScript/React
- Componentes funcionales con TypeScript estricto
- No usar any
- Siempre usar componentes shadcn de src/components/ui/ para UI
- No mezclar estilos inline con Tailwind — solo clases Tailwind
- Usar cn() para combinar clases condicionales

---

## Notas Importantes

1. **Cross-compilation Windows desde Arch Linux:** Usar cargo-xwin.
2. **Ruta BD en Windows:** `C:\Users\{usuario}\AppData\Roaming\sms-broadcast\`
3. **Delay entre SMS:** Mínimo 2000ms para no bloquear la SIM.
4. **Formato números:** Siempre con código de país. Ej: +521234567890
5. **shadcn:** Los componentes se instalan con CLI y se copian a src/components/ui/.
   NUNCA importar desde node_modules para shadcn — siempre desde @/components/ui/
6. **Token Bearer (SPEC.md §6):** El token es secreto compartido. Vive SOLO en el
   keyring del SO via crate `keyring`. Nunca en SQLite en texto plano, nunca en
   localStorage, nunca en estado React, nunca en logs ni eventos Tauri.
7. **Pareo QR (SPEC.md §3):** Validar SIEMPRE `type === "sms-broadcast-config"` antes
   de aplicar url/token. Si el QR no tiene ese type, descartar silenciosamente.
8. **401 durante campaña (SPEC.md §4):** Indica rotación de token en el móvil.
   STOP inmediato de la campaña y forzar re-pareo. No reintentar el mensaje fallido.
9. **Cálculo de partes SMS (SPEC.md §5):** Usar 153 chars/parte para multi-parte,
   no 160. Impacta el costo estimado mostrado al usuario en el compositor.
