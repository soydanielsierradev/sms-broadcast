# SMS Broadcast Mobile App — CLAUDE.md

## Descripción del Proyecto

Aplicación Android que actúa como **servidor SMS**. Expone una API REST HTTP
local que recibe peticiones desde la App Desktop (Tauri) y envía los SMS
reales usando la SIM del dispositivo mediante la API nativa de Android (SmsManager).
El usuario la configura una vez y la deja corriendo en segundo plano.

Desarrollada con **React Native** (Android únicamente).

---

## Stack Tecnológico

- React Native 0.74+ con TypeScript (New Architecture habilitada)
- React Navigation v6 (navegación bottom tabs)
- NativeWind v4 (Tailwind CSS para React Native)
- **react-native-reusables** (componentes estilo shadcn para React Native)
- Zustand (estado global)
- react-native-tcp-socket (servidor HTTP/TCP)
- @react-native-async-storage/async-storage (persistencia)
- react-native-permissions (permisos SEND_SMS)
- lucide-react-native (iconos — mismos que shadcn desktop)
- notifee (foreground service + notificación persistente)
- react-native-network-info (obtener IP local)

---

## Sistema de Estilos — react-native-reusables + NativeWind

### Filosofía
`react-native-reusables` replica exactamente la filosofía de shadcn/ui:
- Los componentes se COPIAN al proyecto (no son dependencia externa)
- Usan NativeWind (Tailwind) para los estilos
- Soporte nativo para dark/light mode
- Mismos nombres que shadcn: Button, Card, Badge, Input, etc.
- Coherencia visual con la app Desktop

### Instalación y configuración

**1. Instalar NativeWind v4:**
```bash
npm install nativewind
npm install -D tailwindcss
npx tailwindcss init
```

**2. Configurar tailwind.config.js:**
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/react-native-reusables/src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
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
  plugins: [],
}
```

**3. Configurar babel.config.js:**
```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['nativewind/babel'],
}
```

**4. Configurar metro.config.js:**
```js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = mergeConfig(getDefaultConfig(__dirname), {})
module.exports = withNativeWind(config, { input: './src/global.css' })
```

**5. Variables CSS en src/global.css:**
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
```

**IMPORTANTE:** Las mismas variables CSS que la app Desktop. Esto garantiza
coherencia visual entre ambas apps.

**6. Importar global.css en index.js (entry point):**
```js
import './src/global.css'
```

**7. Instalar react-native-reusables:**
```bash
npm install react-native-reusables
```

Componentes a copiar al proyecto desde react-native-reusables:
```bash
# Usar el CLI de react-native-reusables para copiar componentes:
npx react-native-reusables@latest add button
npx react-native-reusables@latest add card
npx react-native-reusables@latest add badge
npx react-native-reusables@latest add input
npx react-native-reusables@latest add label
npx react-native-reusables@latest add separator
npx react-native-reusables@latest add switch
npx react-native-reusables@latest add text
npx react-native-reusables@latest add progress
npx react-native-reusables@latest add avatar
```

Los componentes se copian a `src/components/ui/` — igual que shadcn en Desktop.

**8. Configurar ThemeProvider en App.tsx:**
```tsx
import { useColorScheme } from 'nativewind'
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native'

export default function App() {
  const { colorScheme } = useColorScheme()
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* navegación y screens */}
    </ThemeProvider>
  )
}
```

**9. Toggle dark/light en SettingsScreen:**
```tsx
import { useColorScheme } from 'nativewind'
import { Switch } from '~/components/ui/switch'
import { Text } from '~/components/ui/text'

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme()
  return (
    <View className="flex-row items-center justify-between">
      <Text>Tema oscuro</Text>
      <Switch
        checked={colorScheme === 'dark'}
        onCheckedChange={(val) => setColorScheme(val ? 'dark' : 'light')}
      />
    </View>
  )
}
```

### Alias de importación
Configurar `~` como alias para `src/` en tsconfig y babel para importar
componentes como `~/components/ui/button` (misma convención que react-native-reusables).

---

## Estructura del Proyecto

```
sms-broadcast-mobile/
├── android/
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── java/.../
│   │   │       ├── SmsModule.kt
│   │   │       └── SmsPackage.kt
│   │   └── build.gradle
│   └── build.gradle
├── src/
│   ├── global.css                  # Variables CSS + Tailwind
│   ├── index.tsx
│   ├── App.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── LogScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── ui/                     # Componentes react-native-reusables copiados
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── text.tsx
│   │   │   └── progress.tsx
│   │   ├── ServerStatusCard.tsx
│   │   ├── ConnectionInfoCard.tsx
│   │   ├── MetricsCard.tsx
│   │   ├── LogItem.tsx
│   │   └── PermissionBanner.tsx
│   ├── server/
│   │   ├── HttpServer.ts
│   │   ├── router.ts
│   │   └── handlers/
│   │       ├── sendSms.handler.ts
│   │       └── health.handler.ts
│   ├── native/
│   │   └── SmsManager.ts
│   ├── store/
│   │   ├── server.store.ts
│   │   └── log.store.ts
│   ├── hooks/
│   │   ├── useServer.ts
│   │   ├── usePermissions.ts
│   │   └── useNetworkInfo.ts
│   ├── utils/
│   │   ├── network.ts
│   │   ├── phone.ts
│   │   └── logger.ts
│   └── types/
│       └── index.ts
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── tailwind.config.js
```

---

## API REST que expone la app móvil

### GET /health
```json
{
  "status": "ok",
  "uptime_seconds": 3600,
  "sms_sent": 47,
  "sms_errors": 2,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /send-sms

**Headers obligatorios:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>` — token generado por la app móvil (ver `auth.store.ts`)

**Request:**
```json
{ "to": "+521234567890", "message": "Hola Juan, tu pedido está listo" }
```

**Response 200:**
```json
{ "success": true, "message_id": "msg_001", "to": "+521234567890", "timestamp": "..." }
```

**Response 400:**
```json
{ "success": false, "error": "INVALID_NUMBER", "message": "Número inválido" }
```

**Response 401:**
```json
{ "success": false, "error": "UNAUTHORIZED", "message": "Token inválido o ausente" }
```

**Response 500:**
```json
{ "success": false, "error": "SEND_FAILED", "message": "No se pudo enviar" }
```

**Response 503:**
```json
{ "success": false, "error": "PERMISSION_DENIED", "message": "Sin permiso SMS" }
```

---

## Módulo Nativo Android (Kotlin)

### SmsModule.kt
```kotlin
class SmsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SmsModule"

    @ReactMethod
    fun sendSms(phoneNumber: String, message: String, promise: Promise) {
        try {
            val smsManager = SmsManager.getDefault()
            if (message.length > 160) {
                val parts = smsManager.divideMessage(message)
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
            } else {
                smsManager.sendTextMessage(phoneNumber, null, message, null, null)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SEND_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        val permission = ContextCompat.checkSelfPermission(
            reactApplicationContext, Manifest.permission.SEND_SMS
        )
        promise.resolve(permission == PackageManager.PERMISSION_GRANTED)
    }
}
```

### AndroidManifest.xml — Permisos
```xml
<uses-permission android:name="android.permission.SEND_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
```

---

## Stores Zustand

### server.store.ts
```typescript
interface ServerState {
  isRunning: boolean
  port: number
  localIp: string | null
  startTime: Date | null
  hasPermission: boolean
  setRunning: (v: boolean) => void
  setPort: (v: number) => void
  setLocalIp: (v: string) => void
  setPermission: (v: boolean) => void
  startServer: () => Promise<void>
  stopServer: () => Promise<void>
}
```

### log.store.ts
```typescript
interface LogEntry {
  id: string
  timestamp: Date
  to: string
  message: string
  status: 'sent' | 'error'
  error?: string
}

interface LogState {
  entries: LogEntry[]   // max 100
  totalSent: number
  totalErrors: number
  addEntry: (entry: LogEntry) => void
  clearLog: () => void
}
```

---

## Pantallas — Componentes a usar

### HomeScreen
Usa: Card, Badge, Button, Separator, Text de react-native-reusables

```
┌─────────────────────────────┐
│  SMS Broadcast              │
├─────────────────────────────┤
│  Card: Estado del servidor  │
│  Badge verde/rojo + estado  │
│  Button grande INICIAR/STOP │
├─────────────────────────────┤
│  Card: Conexión             │
│  IP: 192.168.43.1           │
│  Puerto: 8080               │
│  Button "Copiar URL"        │
├─────────────────────────────┤
│  Card: Métricas sesión      │
│  ✅ Enviados: 47            │
│  ❌ Errores: 2              │
│  ⏱ Uptime: 2h 15min        │
├─────────────────────────────┤
│  Banner permiso (si falta)  │
└─────────────────────────────┘
```

### LogScreen
Usa: Badge, Separator, Text, Button de react-native-reusables + FlatList nativa

- FlatList de LogItem components
- Cada ítem: Badge de estado + hora + número + preview mensaje
- Header con botón limpiar
- Filtros: todos / enviados / errores (Badge como toggle)
- Estado vacío con Text muted

### SettingsScreen
Usa: Input, Label, Switch, Card, Button, Separator, Text de react-native-reusables

- Input para puerto con Label
- Switch autoStart con Label
- Switch keepScreenOn con Label
- ThemeToggle (Switch dark/light)
- Card de permisos con estado + Button solicitar
- Separator entre secciones

---

## TAREAS EN ORDEN LÓGICO

### FASE 0 — Setup del proyecto

**Tarea 0.1 — Inicializar proyecto React Native**
```bash
npx @react-native-community/cli init SmsBroadcast --template react-native-template-typescript
cd SmsBroadcast
```

**Tarea 0.2 — Instalar dependencias**
```bash
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install zustand
npm install @react-native-async-storage/async-storage
npm install react-native-tcp-socket
npm install react-native-permissions
npm install react-native-network-info
npm install notifee
npm install lucide-react-native react-native-svg
npm install nativewind
npm install react-native-reusables
npm install -D tailwindcss
```

**Tarea 0.3 — Configurar NativeWind v4**
- Crear tailwind.config.js (definido arriba)
- Configurar babel.config.js con plugin nativewind/babel (definido arriba)
- Configurar metro.config.js con withNativeWind (definido arriba)
- Crear src/global.css con variables CSS completas (definidas arriba)
- Importar global.css en index.js

**Tarea 0.4 — Copiar componentes react-native-reusables**
```bash
npx react-native-reusables@latest add button card badge input
npx react-native-reusables@latest add label separator switch text progress
```
Verificar que quedaron en src/components/ui/

**Tarea 0.5 — Configurar alias ~ en tsconfig.json y babel**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "~/*": ["src/*"] }
  }
}
```
```js
// babel.config.js — agregar plugin:
['module-resolver', { alias: { '~': './src' } }]
```
```bash
npm install -D babel-plugin-module-resolver
```

**Tarea 0.6 — Configurar permisos en AndroidManifest.xml**
Agregar todos los permisos listados en la sección AndroidManifest.

**Tarea 0.7 — Verificar que compila**
```bash
npx react-native run-android
```

---

### FASE 1 — Módulo nativo Android (Kotlin)

**Tarea 1.1** — Crear SmsModule.kt (código definido arriba)
**Tarea 1.2** — Crear SmsPackage.kt y registrar SmsModule
**Tarea 1.3** — Registrar SmsPackage en MainApplication.kt
**Tarea 1.4** — Bridge TypeScript en src/native/SmsManager.ts
```typescript
import { NativeModules } from 'react-native'
const { SmsModule } = NativeModules
export const SmsManager = {
  sendSms: (to: string, message: string): Promise<boolean> =>
    SmsModule.sendSms(to, message),
  checkPermission: (): Promise<boolean> =>
    SmsModule.checkPermission(),
}
```
**Tarea 1.5** — Probar con SMS real a número real antes de continuar

---

### FASE 2 — Servidor HTTP

**Tarea 2.1** — Parser/builder HTTP en server/HttpServer.ts
- parseHttpRequest(rawData): ParsedRequest
- buildHttpResponse(statusCode, body): string
- Manejar Content-Length, UTF-8, CORS header

**Tarea 2.2** — Handler GET /health
**Tarea 2.3** — Handler POST /send-sms
```
1. Parsear body JSON
2. Validar campos to y message
3. Verificar permiso SMS
4. Llamar SmsManager.sendSms()
5. Registrar en log store
6. Retornar respuesta apropiada
```

**Tarea 2.4** — Router en server/router.ts
**Tarea 2.5** — Servidor TCP en server/HttpServer.ts
- Escuchar en 0.0.0.0:{port}
- Por conexión: recibir → parsear → rutear → responder → cerrar
- Exponer: start(port), stop(), isRunning()

**Tarea 2.6** — Probar con curl desde PC
```bash
curl http://{ip_movil}:8080/health
curl -X POST http://{ip_movil}:8080/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"+521234567890","message":"Test"}'
```

---

### FASE 3 — Foreground Service y persistencia

**Tarea 3.1** — Configurar notifee
- Canal 'sms-server'
- startForegroundNotification() con botón Detener
- stopForegroundNotification()
- Actualizar contador SMS en notificación

**Tarea 3.2** — Integrar foreground con servidor
- Al iniciar servidor → crear notificación foreground
- Al detener → cancelar notificación

**Tarea 3.3** — Persistir configuración con AsyncStorage
- Puerto configurado
- Preferencia autoStart
- Tema (dark/light)
- Recuperar al iniciar la app

**Tarea 3.4** — Auto-start si está activado en settings

---

### FASE 4 — Stores Zustand

**Tarea 4.1** — server.store.ts
- startServer(): verificar permiso → obtener IP → iniciar TCP → foreground notification
- stopServer(): detener TCP → cancelar notificación

**Tarea 4.2** — log.store.ts
- Máximo 100 entradas, limpiar más antiguas automáticamente
- Persistir en AsyncStorage

---

### FASE 5 — Hooks

**Tarea 5.1** — usePermissions.ts (checkPermission, requestPermission)
**Tarea 5.2** — useNetworkInfo.ts (obtener IP WiFi/hotspot con react-native-network-info)
**Tarea 5.3** — useServer.ts (coordina store + TCP + permisos + notificación)

---

### FASE 6 — Navegación y Pantallas

**Tarea 6.1** — Configurar React Navigation bottom tabs
- 3 tabs: Inicio, Log, Configuración
- Iconos lucide-react-native
- Tema respeta dark/light mode via ThemeProvider

**Tarea 6.2** — HomeScreen
- ServerStatusCard con Button grande INICIAR/DETENER
- ConnectionInfoCard con IP, puerto y botón copiar
- MetricsCard con Badge para enviados/errores
- PermissionBanner visible solo si falta permiso
- Todos los componentes usan react-native-reusables

**Tarea 6.3** — LogScreen
- FlatList con LogItem
- LogItem usa Badge de react-native-reusables para el estado
- Header con filtros y botón limpiar
- Estado vacío con Text muted de react-native-reusables

**Tarea 6.4** — SettingsScreen
- Formulario con Input y Label de react-native-reusables
- Switches con Switch de react-native-reusables
- ThemeToggle (Switch dark/light) usando useColorScheme de NativeWind
- Card de permisos con Button
- Separadores con Separator de react-native-reusables

---

### FASE 7 — Pulido final

**Tarea 7.1** — Manejo de errores: puerto en uso, sin WiFi, permiso revocado
**Tarea 7.2** — Keep screen on con react-native-keep-awake
**Tarea 7.3** — Animación pulso en indicador de estado activo
**Tarea 7.4** — Feedback haptico al iniciar/detener servidor
**Tarea 7.5** — Generar APK release
```bash
cd android && ./gradlew assembleRelease
# APK en: android/app/build/outputs/apk/release/app-release.apk
```

---

## Mejoras post-Fase 7 (estado actual)

Estas mejoras ya están implementadas en el código. Si una tarea de Fases 0–7 contradice algo de esta sección, esta sección manda.

### 1. Foreground Service nativo (reemplaza notifee)

`notifee` v9.1.8 no setea `FOREGROUND_SERVICE_TYPE_DATA_SYNC` en `startForeground`, por lo que Android 14 mataba el servicio a los ~10 s. Se reemplazó por un FGS nativo en Kotlin.

- `android/app/src/main/java/com/smsbroadcast/ServerForegroundService.kt` — llama a `startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)` en API 29+. Maneja `ACTION_STOP` y `ACTION_UPDATE`. Usa `R.mipmap.ic_launcher` como ícono pequeño. Companion object expone `stopCallback: (() -> Unit)?` para puentear el stop hacia JS.
- `ServerServiceModule.kt` — módulo RN con `start(port)`, `stop()`, `updateCount(sent, errors, port)`. En `init` setea `ServerForegroundService.stopCallback` que emite `ServerStopRequested` por `DeviceEventManagerModule.RCTDeviceEventEmitter`. Define stubs `addListener` y `removeListeners`.
- `ServerServicePackage.kt` — sigue el patrón de `SmsPackage`, registrado en `MainApplication.kt`.
- `AndroidManifest.xml` — agrega `<service android:name=".ServerForegroundService" android:exported="false" android:foregroundServiceType="dataSync" />`.
- `src/services/ForegroundService.ts` — usa `NativeModules.ServerServiceModule` y `DeviceEventEmitter.addListener('ServerStopRequested', ...)`.

### 2. Autenticación con token Bearer

Toda petición a `POST /send-sms` debe llevar `Authorization: Bearer <token>`. Si no, responde **401**.

- `src/store/auth.store.ts` — Zustand store con `token` y `regenerate()`. Genera hex random de 32 caracteres. Persistido en AsyncStorage con clave `@app_auth_token`.
- `src/App.tsx` — al arrancar lee el token persistido y, si no existe, llama a `regenerate()` automáticamente.
- `src/server/router.ts` — `isAuthorized(req)` parsea el header `Authorization` con `/^Bearer\s+(.+)$/i` y compara contra `useAuthStore.getState().token`. Si el token guardado es vacío (estado imposible en runtime), no se exige auth (fallback defensivo).
- `src/screens/SettingsScreen.tsx` — card "Seguridad" con token enmascarado por defecto, toggle show/hide (`Eye`/`EyeOff`), botón copiar (`Copy`) y botón rotar (`RefreshCw`).

### 3. Persistencia de logs

Las 100 entradas del log se persisten en AsyncStorage (`@app_log_entries`).

- `src/store/log.store.ts` — `persist(entries)` y `hydrate(entries)`. Export adicional `loadPersistedLogs()` que parsea fechas y rehidrata el store.
- `src/App.tsx` — invoca `loadPersistedLogs()` en el arranque.
- `src/types/index.ts` — `LogStatus` extendido: `'sent' | 'error' | 'server_start' | 'server_stop'`. Para eventos de servidor, `to` es opcional.
- `src/components/LogItem.tsx` — tres variantes de Badge según `status`; oculta el número de teléfono en eventos de servidor.
- `src/hooks/useServer.ts` — agrega entries `server_start` / `server_stop` al iniciar/detener el servidor.

### 4. QR de pareo con Desktop

Pantalla Home muestra botón "Mostrar QR" cuando el servidor está corriendo. El QR codifica un JSON que la Desktop puede escanear para autoconfigurarse.

- `src/components/QrModal.tsx` — usa `react-native-qrcode-svg` (con `react-native-svg` de backend). Payload:
  ```json
  { "type": "sms-broadcast-config", "url": "http://192.168.43.1:8080", "token": "<32-hex>" }
  ```
- Debajo del QR muestra URL y token en texto plano por si el usuario prefiere copiar manualmente.

### 5. Detección de IPv4 y manejo de "sin red"

- `src/hooks/useNetworkInfo.ts` — usa `NetworkInfo.getIPV4Address()` y valida con regex `/^\d{1,3}(\.\d{1,3}){3}$/`. Si no es válida, devuelve `null`.
- `src/store/server.store.ts` — `setLocalIp` acepta `string | null`.
- `src/components/ConnectionInfoCard.tsx` — cuando no hay IP muestra hint, botón "Abrir ajustes de hotspot" (`Linking.sendIntent('android.settings.TETHER_SETTINGS')` con fallback a `WIRELESS_SETTINGS` y `openSettings()`) y botón "Reintentar".
- `src/screens/HomeScreen.tsx` — listener de `AppState` refresca IP y permisos cuando la app vuelve al foreground.

### 6. Internacionalización (es / en)

- `src/i18n/` con `react-i18next`. Locales en `src/i18n/locales/es.json` y `en.json`. Castellano (Argentina) por defecto.
- Selector de idioma en SettingsScreen.

### 7. Manejo de errores robusto en arranque del servidor

`src/hooks/useServer.ts` mapea errores comunes a mensajes claros:
- "No network connection" cuando `refreshIp()` devuelve `null`.
- `EADDRINUSE` se trata silenciosamente como "ya está corriendo".
- `EACCES` (puertos < 1024) → mensaje específico.
- Permiso SMS revocado → bloquea start y muestra banner.

### 8. Build de release firmado

- Keystore: `android/app/sms-broadcast-release.keystore`.
- Credenciales en `~/.gradle/gradle.properties` (NO en el repo): `SMS_RELEASE_STORE_FILE`, `SMS_RELEASE_STORE_PASSWORD`, `SMS_RELEASE_KEY_ALIAS`, `SMS_RELEASE_KEY_PASSWORD`.
- `android/app/build.gradle` — `signingConfigs.release` lee las properties; `buildTypes.release` usa la config de release si las properties existen, sino cae a debug.
- `android/gradle.properties` — `reactNativeArchitectures=arm64-v8a` (obligatorio: el resto rompe por bug de CMake con paths que contienen espacios — "Proyectos Personales", "Mobile App"). Timeouts de red elevados a 180000 ms.
- Parche manual en `node_modules/react-native-keep-awake/android/build.gradle`: `jcenter()` → `mavenCentral()` (jcenter está discontinuado).
- Comando: `cd android && ./gradlew assembleRelease` → `android/app/build/outputs/apk/release/app-release.apk` (~31 MB).

---

## Convenciones de Código

### TypeScript/React Native
- Componentes funcionales con TypeScript estricto
- No usar any
- Importar componentes UI siempre desde ~/components/ui/
- Estilos SOLO con clases NativeWind (Tailwind) — no StyleSheet.create()
- Usar cn() para clases condicionales si se necesita

### Kotlin (módulo nativo)
- Siempre try/catch en sendSms
- promise.reject() con código descriptivo
- No operar en hilo principal

---

## Notas Importantes

1. **IP del hotspot Android:** Suele ser 192.168.43.1. La app debe
   detectarla automáticamente con react-native-network-info.

2. **Puerto 8080:** Si está ocupado, mostrar error claro y permitir cambiar.

3. **Mensajes >160 chars:** Se dividen en múltiples SMS. El operador
   cobra por cada parte. Informar al usuario.

4. **Android 12+:** Foreground Service requiere tipo declarado en manifest:
   android:foregroundServiceType="dataSync"

5. **react-native-reusables:** Los componentes copiados a src/components/ui/
   pueden modificarse. NUNCA importar desde node_modules para componentes UI.

6. **Coherencia visual:** Las mismas variables CSS en global.css que en
   la app Desktop garantizan que ambas apps se vean idénticas en colores
   y tipografía cuando se use el mismo tema.

7. **Testing SMS:** Siempre probar con número real. Verificar que el SMS
   llega antes de integrar con la app Desktop.
