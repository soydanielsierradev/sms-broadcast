# SMS Broadcast

Sistema de envío masivo de SMS compuesto por dos apps que trabajan en conjunto: una **app de escritorio para Windows** (donde gestionás tus campañas y contactos) y una **app móvil para Android** (que actúa como servidor SMS usando la SIM de tu celular).

---

## ¿Cómo funciona?

```
┌─────────────────────┐        WiFi / Hotspot        ┌──────────────────────┐
│   Desktop (Windows) │ ◄──────────────────────────► │   Mobile (Android)   │
│                     │   HTTP + Bearer Token Auth    │                      │
│  • Gestión de       │                               │  • Servidor HTTP     │
│    contactos        │   POST /send-sms              │  • SIM del celular   │
│  • Campañas SMS     │ ──────────────────────────►   │  • Foreground Service│
│  • Historial        │                               │  • Envío nativo SMS  │
│  • Pareo QR         │   QR pairing (primera vez)    │  • QR de pareo       │
└─────────────────────┘ ◄──────────────────────────── └──────────────────────┘
```

1. Instalás la app móvil en tu Android y la dejás corriendo (foreground service).
2. La app móvil genera un QR con su IP local y un token de autenticación.
3. La app de escritorio escanea el QR y queda pareada automáticamente.
4. Desde el escritorio creás una campaña, elegís una lista de contactos y disparás el envío.
5. El escritorio envía cada SMS a la app móvil vía HTTP; el celular los envía usando la SIM.

---

## Stack Tecnológico

### Desktop
- **Tauri 2.0** (Rust) + **React 19** + Vite + TypeScript
- Tailwind CSS v3 + shadcn/ui + next-themes (dark/light mode)
- Zustand · Zod · React Hook Form · React Router v7 · Sonner
- SQLite (rusqlite) para persistencia local
- Token Bearer almacenado en keyring del SO (nunca en base de datos)

### Mobile
- **React Native 0.86** + TypeScript (Android únicamente)
- NativeWind v4 (Tailwind para React Native) + componentes estilo shadcn
- Zustand · i18next (español/inglés) · React Navigation (bottom tabs)
- Servidor HTTP/TCP nativo via `react-native-tcp-socket`
- Foreground Service nativo en Kotlin (Android 14+ compatible)
- Módulo SMS nativo en Kotlin via `SmsManager`

---

## Descarga e Instalación

### App Móvil (Android)

> Requiere Android con permiso de envío de SMS.

1. Descargá el APK desde [Releases → mobile-v1.0.0](../../releases/tag/mobile-v1.0.0).
2. En tu Android, habilitá **"Instalar apps de fuentes desconocidas"** (Ajustes → Seguridad).
3. Abrí el APK descargado e instalalo.
4. Al abrir la app, concedé el permiso de **Enviar SMS** cuando te lo solicite.
5. En la pestaña **Inicio**, tocá **Iniciar servidor**.
6. La app queda corriendo en segundo plano — no la cerrés.

### App de Escritorio (Windows)

> Requiere Windows 10 o superior. No necesita instalación.

1. Descargá el ZIP desde [Releases → desktop-v1.0.0](../../releases/tag/desktop-v1.0.0).
2. Descomprimí el ZIP en cualquier carpeta.
3. Ejecutá `SMS Broadcast.exe`.

---

## Pareo (primera vez)

1. Con el servidor móvil corriendo, tocá el botón **Mostrar QR** en la app móvil.
2. En la app de escritorio, al iniciar por primera vez se abrirá la pantalla de pareo.
3. Hacé clic en **Escanear QR** y apuntá la cámara al QR del celular.
4. La conexión queda configurada automáticamente — no hace falta volver a parear salvo que rotas el token.

> Ambos dispositivos deben estar en la **misma red WiFi** o el celular debe compartir **hotspot** al que se conecta la PC.

---

## Funcionalidades

- **Contactos**: alta, baja, modificación e importación desde CSV.
- **Listas**: agrupá contactos en listas reutilizables.
- **Campañas**: creá un mensaje con variables `{{nombre}}` y `{{numero}}`, elegí una lista y enviá.
- **Progreso en tiempo real**: barra de avance, estado por contacto (enviado ✅ / error ❌).
- **Historial**: revisá todas las campañas anteriores con log detallado.
- **Seguridad**: autenticación Bearer con token de 32 caracteres hex, renovable desde la app móvil.
- **Dark/Light mode**: en ambas apps.
- **Internacionalización**: español e inglés en la app móvil.

---

## Desarrollo

### Requisitos

- Node.js ≥ 22
- Rust (toolchain stable)
- Android Studio + SDK (para la app móvil)
- Arch Linux / macOS para desarrollo (la app desktop compila para Windows vía `cargo-xwin`)

### Desktop (desarrollo)

```bash
cd "Desktop App"
npm install
npm run tauri dev
```

### Mobile (desarrollo)

```bash
cd "Mobile App/SmsBroadcast"
npm install
npx react-native run-android
```

### Build de producción — Desktop (Windows)

```bash
cd "Desktop App"
rustup target add x86_64-pc-windows-msvc
cargo install cargo-xwin
npm run tauri build -- --target x86_64-pc-windows-msvc
```

### Build de producción — Mobile (APK release)

Requiere keystore de firma y credenciales en `~/.gradle/gradle.properties`:
```
SMS_RELEASE_STORE_FILE=sms-broadcast-release.keystore
SMS_RELEASE_STORE_PASSWORD=...
SMS_RELEASE_KEY_ALIAS=...
SMS_RELEASE_KEY_PASSWORD=...
```

```bash
cd "Mobile App/SmsBroadcast/android"
./gradlew assembleRelease
# APK en: app/build/outputs/apk/release/app-release.apk
```

---

## Licencia

MIT
