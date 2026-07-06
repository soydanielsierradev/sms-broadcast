# SMS Broadcast

A two-app system for bulk SMS campaigns: a **Windows desktop app** to manage contacts and campaigns, and an **Android mobile app** that acts as an SMS server using your phone's SIM card.

---

## How It Works

```
┌─────────────────────┐        WiFi / Hotspot        ┌──────────────────────┐
│   Desktop (Windows) │ ◄──────────────────────────► │   Mobile (Android)   │
│                     │   HTTP + Bearer Token Auth    │                      │
│  • Contact manager  │                               │  • HTTP server       │
│  • SMS campaigns    │   POST /send-sms              │  • Native SIM access │
│  • History & logs   │ ──────────────────────────►   │  • Foreground service│
│  • QR pairing       │                               │  • Native SMS module │
└─────────────────────┘ ◄──────────────────────────── └──────────────────────┘
                               QR pairing (first run)
```

1. Install the mobile app on your Android and start the server.
2. The mobile app generates a QR code with its local IP and a Bearer auth token.
3. The desktop app scans the QR and pairs automatically — no manual config needed.
4. From the desktop, create a campaign, select a contact list, and send.
5. The desktop sends each SMS request to the mobile over HTTP; the phone delivers them via the SIM.

---

## Tech Stack

### Desktop
- **Tauri 2.0** (Rust) + **React 19** + Vite + TypeScript
- Tailwind CSS v3 + shadcn/ui + next-themes (dark/light mode)
- Zustand · Zod · React Hook Form · React Router v7 · Sonner
- SQLite (rusqlite) for local persistence
- Bearer token stored in the OS keyring (never in the database)

### Mobile
- **React Native 0.86** + TypeScript (Android only)
- NativeWind v4 (Tailwind for React Native) + shadcn-style components
- Zustand · i18next (Spanish / English) · React Navigation (bottom tabs)
- HTTP/TCP server via `react-native-tcp-socket`
- Native Kotlin Foreground Service (Android 14+ compatible)
- Native Kotlin SMS module via `SmsManager`

---

## Download & Installation

### Mobile App (Android)

> Requires an Android device with SMS sending capability.

1. Download `sms-broadcast-mobile.apk` from [Releases → mobile-v1.0.0](../../releases/tag/mobile-v1.0.0).
2. On your Android device, enable **Install from unknown sources** (Settings → Security).
3. Open and install the downloaded APK.
4. When prompted, grant the **Send SMS** permission.
5. On the **Home** tab, tap **Start server**.
6. Leave the app running in the background — do not close it.

### Desktop App (Windows)

> Requires Windows 10 or later. No installation needed.

1. Download `SMS-Broadcast-Portable-v1.0.0.zip` from [Releases → desktop-v1.0.0](../../releases/tag/desktop-v1.0.0).
2. Extract the ZIP to any folder.
3. Run `SMS Broadcast.exe`.

---

## Pairing (First Run)

1. With the mobile server running, tap **Show QR** on the mobile app's Home screen.
2. On the desktop app, the pairing screen opens automatically on first launch.
3. Click **Scan QR** and point your camera at the phone's QR code.
4. The connection is configured automatically. Re-pairing is only needed if the token is rotated.

> Both devices must be on the **same Wi-Fi network**, or the phone must share a **hotspot** that the PC connects to.

---

## Features

- **Contacts** — add, edit, delete, and import from CSV.
- **Lists** — group contacts into reusable lists.
- **Campaigns** — compose a message with `{{name}}` and `{{number}}` variables, pick a list, and send.
- **Real-time progress** — animated progress bar with per-contact status (sent ✅ / error ❌).
- **History** — review all past campaigns with detailed logs.
- **Security** — 32-character hex Bearer token, rotatable from the mobile app.
- **Dark / Light mode** — supported in both apps.
- **Internationalization** — Spanish and English in the mobile app.

---

## Development

### Requirements

- Node.js ≥ 22
- Rust (stable toolchain)
- Android Studio + SDK (for the mobile app)
- Arch Linux or macOS for development (desktop cross-compiles to Windows via `cargo-xwin`)

### Desktop (dev server)

```bash
cd "Desktop App"
npm install
npm run tauri dev
```

### Mobile (dev build)

```bash
cd "Mobile App/SmsBroadcast"
npm install
npx react-native run-android
```

### Production build — Desktop (Windows)

```bash
cd "Desktop App"
rustup target add x86_64-pc-windows-msvc
cargo install cargo-xwin
npm run tauri build -- --target x86_64-pc-windows-msvc
```

### Production build — Mobile (release APK)

Requires a signing keystore and credentials in `~/.gradle/gradle.properties`:

```
SMS_RELEASE_STORE_FILE=sms-broadcast-release.keystore
SMS_RELEASE_STORE_PASSWORD=...
SMS_RELEASE_KEY_ALIAS=...
SMS_RELEASE_KEY_PASSWORD=...
```

```bash
cd "Mobile App/SmsBroadcast/android"
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

---

## License

MIT
