# SMS Broadcast — Especificación de integración con la app Móvil

Documento de contrato entre la **app Desktop (Tauri + React)** y la **app Móvil (React Native Android)**.
La app móvil expone un servidor HTTP local en la red WiFi/hotspot. La Desktop le manda peticiones para enviar SMS.

> **Origen:** este spec refleja el estado real implementado en la app móvil al cierre del 2026-06-29.
> Si algo de aquí contradice una sección antigua del `CLAUDE.md` de Desktop, **manda este documento**.

---

## 1. Cambios clave respecto a la primera versión

1. **Autenticación obligatoria.** `POST /send-sms` ahora exige header `Authorization: Bearer <token>`.
   - Si falta o es inválido → **401 UNAUTHORIZED**.
   - El token se genera en el celular (hex de 32 caracteres) y se puede rotar desde Settings.
2. **Pareo por QR.** La móvil muestra un QR cuando el servidor está corriendo. Codifica URL y token.
3. **Persistencia de logs** y **detección IPv4 robusta** son cambios internos de la móvil — no afectan la API pero sí la UX de configuración.

---

## 2. Endpoints

### `GET /health`

Sin autenticación. Sirve para verificar conectividad y latencia desde la Desktop antes de enviar.

```json
{
  "status": "ok",
  "uptime_seconds": 3600,
  "sms_sent": 47,
  "sms_errors": 2,
  "timestamp": "2026-06-29T10:30:00Z"
}
```

### `POST /send-sms`

**Headers obligatorios:**

| Header | Valor |
| --- | --- |
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Request body:**

```json
{ "to": "+521234567890", "message": "Hola Juan, tu pedido está listo" }
```

**Respuestas:**

| Status | error code | Cuándo |
| --- | --- | --- |
| `200` | — | SMS entregado al `SmsManager` nativo. `success: true`. |
| `400` | `INVALID_NUMBER` | Número inválido o body malformado. |
| `401` | `UNAUTHORIZED` | Token ausente o no coincide con el actual de la móvil. |
| `500` | `SEND_FAILED` | El módulo nativo Kotlin rechazó el envío. |
| `503` | `PERMISSION_DENIED` | La móvil no tiene permiso `SEND_SMS`. |

**Ejemplo 200:**

```json
{ "success": true, "message_id": "msg_001", "to": "+521234567890", "timestamp": "2026-06-29T10:30:00Z" }
```

**Ejemplo 401:**

```json
{ "success": false, "error": "UNAUTHORIZED", "message": "Token inválido o ausente" }
```

---

## 3. Pareo por QR

Cuando el usuario abre el modal "Mostrar QR" en la app móvil (Home → ConnectionInfoCard), el QR codifica este payload:

```json
{
  "type": "sms-broadcast-config",
  "url": "http://192.168.43.1:8080",
  "token": "a1b2c3d4e5f60718293a4b5c6d7e8f90"
}
```

**Reglas para la Desktop al escanear:**

1. Validar `type === "sms-broadcast-config"` antes de aplicar cualquier valor — si no, descartar.
2. Validar que `url` matchea `^https?://[^/]+:\d+$` y que `token` matchea `^[0-9a-f]{32}$`.
3. Persistir `url` y `token` en config local (preferentemente en el backend Rust, vía Tauri command, no en `localStorage`).
4. Hacer una llamada inmediata a `GET <url>/health` para confirmar conectividad antes de declarar el pareo exitoso al usuario.
5. Si el `GET /health` falla, mostrar el error con guía: "Verificá que el celular esté en la misma WiFi y el servidor activo".

**Rotación de token:** si el usuario rota el token en la móvil, la Desktop empezará a recibir `401`. La Desktop debe detectar `401` y pedirle al usuario rescanear el QR.

---

## 4. Flujo recomendado de la Desktop

```
Inicio app Desktop
   │
   ├─► ¿Hay URL y token guardados?
   │        ├── No → mostrar pantalla "Pareá tu celular" con instrucciones + escáner QR
   │        └── Sí → GET /health
   │                   ├── 200 → seguir al flujo principal
   │                   ├── timeout/refused → mostrar reconectar + opción re-pareo
   │                   └── otro error → mostrar diagnóstico
   │
   └─► Envío de campaña
           ├── POST /send-sms con Authorization: Bearer <token>
           ├── 200 → marcar enviado en BD local
           ├── 400 → marcar inválido (no reintentar)
           ├── 401 → STOP campaña, alertar al usuario, pedir re-pareo
           ├── 500 → reintentar con backoff (máx 3)
           └── 503 → STOP campaña, alertar "permiso SMS revocado en el celular"
```

---

## 5. Notas de red y operación

- **IP del celular:** suele ser `192.168.43.1` cuando el celular es hotspot; si está conectado a WiFi, será la IP local que asigna el router. La móvil la detecta automáticamente con `react-native-network-info` y la muestra en la pantalla Home.
- **Puerto por defecto:** `8080`. Configurable desde la móvil. La Desktop NO debe hardcodear el puerto.
- **HTTPS:** No, el servidor HTTP de la móvil es plano. El token Bearer es el único control de acceso. Por eso ambos extremos deberían estar en la misma red local de confianza.
- **Mensajes > 160 caracteres:** la móvil los divide automáticamente con `divideMessage`. El operador móvil cobra por cada parte. Si la Desktop quiere mostrar al usuario el costo estimado, calcular en cliente: `Math.ceil(message.length / 153)` para texto GSM-7 multi-parte (153 chars por parte concatenada, no 160).

---

## 6. Almacenamiento sensible en Desktop

- El **token** es secreto compartido. Guardarlo en el backend Rust (por ejemplo, con `keyring` crate o en SQLite con permisos restrictivos), **no** en `localStorage` ni en archivos planos del frontend.
- Exponer comandos Tauri `set_mobile_config(url, token)` y `get_mobile_config()` y mantener el token fuera del estado React si es posible (que el comando de envío lo lea desde Rust y agregue el header).

---

## 7. Estado de la integración (2026-06-29)

- **Móvil:** APK de release firmado generado (`android/app/build/outputs/apk/release/app-release.apk`, 31 MB, `arm64-v8a`).
- **Móvil ↔ Desktop:** Falta implementar en Desktop el lector de QR y el cliente HTTP autenticado. Esa es la próxima tarea.
