use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};

use rusqlite::{params, Connection, Row};
use serde_json::json;
use tauri::{AppHandle, Emitter, State};

use crate::commands::contacts::poisoned_lock;
use crate::commands::mobile_config::{get_mobile_token, get_mobile_url};
use crate::commands::settings::{read_config_string, DELAY_KEY};
use crate::db::DbState;
use crate::errors::{AppError, AppResult};
use crate::models::{Campaign, CampaignDetail, MessageLog};

pub struct CancelFlag(pub AtomicBool);

const DEFAULT_DELAY_MS: u64 = 2000;
const SEND_TIMEOUT_SECS: u64 = 15;
const RETRY_WAITS_MS: [u64; 2] = [1000, 3000];

const CAMPAIGN_COLUMNS: &str =
    "id, nombre, mensaje, lista_id, total_contactos, enviados, errores, estado, created_at, completed_at";
const MESSAGE_LOG_COLUMNS: &str =
    "id, campana_id, contacto_id, numero, nombre, mensaje_final, estado, error_detalle, sent_at";

fn map_campaign(row: &Row) -> rusqlite::Result<Campaign> {
    Ok(Campaign {
        id: row.get(0)?,
        nombre: row.get(1)?,
        mensaje: row.get(2)?,
        lista_id: row.get(3)?,
        total_contactos: row.get(4)?,
        enviados: row.get(5)?,
        errores: row.get(6)?,
        estado: row.get(7)?,
        created_at: row.get(8)?,
        completed_at: row.get(9)?,
    })
}

fn map_message_log(row: &Row) -> rusqlite::Result<MessageLog> {
    Ok(MessageLog {
        id: row.get(0)?,
        campana_id: row.get(1)?,
        contacto_id: row.get(2)?,
        numero: row.get(3)?,
        nombre: row.get(4)?,
        mensaje_final: row.get(5)?,
        estado: row.get(6)?,
        error_detalle: row.get(7)?,
        sent_at: row.get(8)?,
    })
}

fn personalize(template: &str, nombre: &str, numero: &str) -> String {
    template
        .replace("{{nombre}}", nombre)
        .replace("{{numero}}", numero)
}

fn fetch_campaign_by_id(conn: &Connection, id: i64) -> AppResult<Campaign> {
    let sql = format!("SELECT {} FROM campanas WHERE id = ?1", CAMPAIGN_COLUMNS);
    conn.query_row(&sql, [id], map_campaign).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("campaign {}", id)),
        other => AppError::from(other),
    })
}

fn fetch_campaign_messages(conn: &Connection, id: i64) -> AppResult<Vec<MessageLog>> {
    let sql = format!(
        "SELECT {} FROM mensajes_log WHERE campana_id = ?1 ORDER BY id",
        MESSAGE_LOG_COLUMNS
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([id], map_message_log)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(AppError::from)
}

#[tauri::command]
pub fn create_campaign(
    nombre: String,
    mensaje: String,
    lista_id: i64,
    state: State<'_, DbState>,
) -> AppResult<Campaign> {
    let nombre = nombre.trim().to_string();
    if nombre.is_empty() {
        return Err(AppError::ValidationError("nombre is required".into()));
    }
    if mensaje.trim().is_empty() {
        return Err(AppError::ValidationError("mensaje is required".into()));
    }

    let mut conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };

    let tx = conn.transaction()?;

    // Verify list exists
    let list_exists: i64 = tx
        .query_row("SELECT COUNT(*) FROM listas WHERE id = ?1", [lista_id], |row| row.get(0))?;
    if list_exists == 0 {
        return Err(AppError::NotFound(format!("list {}", lista_id)));
    }

    // Collect contacts belonging to the list before mutating campanas/mensajes_log
    let contactos: Vec<(i64, String, String)> = {
        let mut stmt = tx.prepare(
            "SELECT c.id, c.nombre, c.numero
             FROM contactos c
             INNER JOIN lista_contactos lc ON lc.contacto_id = c.id
             WHERE lc.lista_id = ?1
             ORDER BY c.id",
        )?;
        let rows: rusqlite::Result<Vec<_>> = stmt
            .query_map([lista_id], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                ))
            })?
            .collect();
        rows?
    };

    if contactos.is_empty() {
        return Err(AppError::ValidationError(
            "the selected list has no contacts".into(),
        ));
    }

    let total = contactos.len() as i64;

    tx.execute(
        "INSERT INTO campanas (nombre, mensaje, lista_id, total_contactos, estado)
         VALUES (?1, ?2, ?3, ?4, 'pendiente')",
        params![nombre, mensaje, lista_id, total],
    )?;
    let campana_id = tx.last_insert_rowid();

    {
        let mut stmt = tx.prepare(
            "INSERT INTO mensajes_log
             (campana_id, contacto_id, numero, nombre, mensaje_final, estado)
             VALUES (?1, ?2, ?3, ?4, ?5, 'pendiente')",
        )?;
        for (contacto_id, contacto_nombre, contacto_numero) in &contactos {
            let mensaje_final = personalize(&mensaje, contacto_nombre, contacto_numero);
            stmt.execute(params![
                campana_id,
                contacto_id,
                contacto_numero,
                contacto_nombre,
                mensaje_final,
            ])?;
        }
    }

    tx.commit()?;

    fetch_campaign_by_id(&conn, campana_id)
}

#[tauri::command]
pub fn get_campaigns(state: State<'_, DbState>) -> AppResult<Vec<Campaign>> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let sql = format!(
        "SELECT {} FROM campanas ORDER BY created_at DESC, id DESC",
        CAMPAIGN_COLUMNS
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], map_campaign)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(AppError::from)
}

#[tauri::command]
pub fn get_campaign(id: i64, state: State<'_, DbState>) -> AppResult<CampaignDetail> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let campaign = fetch_campaign_by_id(&conn, id)?;
    let mensajes = fetch_campaign_messages(&conn, id)?;
    Ok(CampaignDetail { campaign, mensajes })
}

#[tauri::command]
pub fn get_campaign_log(campana_id: i64, state: State<'_, DbState>) -> AppResult<Vec<MessageLog>> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    fetch_campaign_messages(&conn, campana_id)
}

#[tauri::command]
pub fn cancel_campaign(_campana_id: i64, cancel: State<'_, CancelFlag>) -> AppResult<bool> {
    cancel.0.store(true, Ordering::SeqCst);
    Ok(true)
}

// -------- Send flow --------

struct SendContext {
    url: String,
    token: String,
    delay_ms: u64,
    messages: Vec<PendingMessage>,
}

struct PendingMessage {
    log_id: i64,
    contacto_id: Option<i64>,
    numero: String,
    mensaje_final: String,
}

enum SendOutcome {
    Sent,
    Invalid(String),
    AuthError,
    PermError,
    Error(String),
}

fn load_send_context(state: &State<'_, DbState>, campana_id: i64) -> AppResult<SendContext> {
    let (url, delay_ms, messages) = {
        let conn = match state.lock() {
            Ok(c) => c,
            Err(_) => return poisoned_lock(),
        };

        // Ensure campaign exists and is startable
        let estado: String = conn
            .query_row(
                "SELECT estado FROM campanas WHERE id = ?1",
                [campana_id],
                |row| row.get(0),
            )
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => {
                    AppError::NotFound(format!("campaign {}", campana_id))
                }
                other => AppError::from(other),
            })?;
        if estado == "enviando" {
            return Err(AppError::ValidationError(
                "campaign is already being sent".into(),
            ));
        }
        if estado == "completado" {
            return Err(AppError::ValidationError(
                "campaign is already completed".into(),
            ));
        }

        let url = get_mobile_url(&conn)?.ok_or_else(|| {
            AppError::ValidationError("mobile URL not configured".into())
        })?;
        let delay = read_config_string(&conn, DELAY_KEY)?
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(DEFAULT_DELAY_MS);

        let mut stmt = conn.prepare(
            "SELECT id, contacto_id, numero, mensaje_final
             FROM mensajes_log
             WHERE campana_id = ?1 AND estado = 'pendiente'
             ORDER BY id",
        )?;
        let messages: Vec<PendingMessage> = stmt
            .query_map([campana_id], |row| {
                Ok(PendingMessage {
                    log_id: row.get(0)?,
                    contacto_id: row.get(1)?,
                    numero: row.get(2)?,
                    mensaje_final: row.get(3)?,
                })
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        (url, delay, messages)
    };

    let token = get_mobile_token()?
        .ok_or_else(|| AppError::ValidationError("mobile token not set".into()))?;

    Ok(SendContext {
        url,
        token,
        delay_ms,
        messages,
    })
}

fn set_campaign_estado(
    state: &State<'_, DbState>,
    campana_id: i64,
    estado: &str,
) -> AppResult<()> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    conn.execute(
        "UPDATE campanas SET estado = ?1 WHERE id = ?2",
        params![estado, campana_id],
    )?;
    Ok(())
}

fn mark_campaign_completed(state: &State<'_, DbState>, campana_id: i64) -> AppResult<()> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    conn.execute(
        "UPDATE campanas
         SET estado = 'completado', completed_at = CURRENT_TIMESTAMP
         WHERE id = ?1",
        [campana_id],
    )?;
    Ok(())
}

fn record_message_result(
    state: &State<'_, DbState>,
    campana_id: i64,
    log_id: i64,
    estado: &str,
    error: Option<&str>,
    increment_column: &str,
) -> AppResult<()> {
    let mut conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let tx = conn.transaction()?;
    tx.execute(
        "UPDATE mensajes_log
         SET estado = ?1, error_detalle = ?2, sent_at = CURRENT_TIMESTAMP
         WHERE id = ?3",
        params![estado, error, log_id],
    )?;
    let sql = format!(
        "UPDATE campanas SET {} = {} + 1 WHERE id = ?1",
        increment_column, increment_column
    );
    tx.execute(&sql, [campana_id])?;
    tx.commit()?;
    Ok(())
}

async fn send_one_message(
    client: &reqwest::Client,
    base_url: &str,
    token: &str,
    numero: &str,
    mensaje: &str,
) -> SendOutcome {
    let send_url = format!("{}/send-sms", base_url.trim_end_matches('/'));
    let payload = json!({ "to": numero, "message": mensaje });

    let mut last_error = String::from("unknown error");
    for attempt in 0..3 {
        if attempt > 0 {
            let wait = RETRY_WAITS_MS
                .get(attempt - 1)
                .copied()
                .unwrap_or(RETRY_WAITS_MS[RETRY_WAITS_MS.len() - 1]);
            tokio::time::sleep(Duration::from_millis(wait)).await;
        }

        let response = client
            .post(&send_url)
            .bearer_auth(token)
            .json(&payload)
            .send()
            .await;

        match response {
            Ok(resp) => match resp.status().as_u16() {
                200 => return SendOutcome::Sent,
                400 => {
                    let body = resp.text().await.unwrap_or_default();
                    return SendOutcome::Invalid(if body.is_empty() {
                        "invalid request".into()
                    } else {
                        body
                    });
                }
                401 => return SendOutcome::AuthError,
                503 => return SendOutcome::PermError,
                500 => {
                    let body = resp.text().await.unwrap_or_default();
                    last_error = format!("HTTP 500: {}", body);
                    // retry
                }
                other => return SendOutcome::Error(format!("HTTP {}", other)),
            },
            Err(e) => {
                last_error = e.to_string();
                // retry
            }
        }
    }

    SendOutcome::Error(last_error)
}

#[tauri::command]
pub async fn send_campaign(
    campana_id: i64,
    app: AppHandle,
    state: State<'_, DbState>,
    cancel: State<'_, CancelFlag>,
) -> AppResult<()> {
    cancel.0.store(false, Ordering::SeqCst);

    let ctx = load_send_context(&state, campana_id)?;
    if ctx.messages.is_empty() {
        return Err(AppError::ValidationError(
            "no pending messages to send".into(),
        ));
    }

    set_campaign_estado(&state, campana_id, "enviando")?;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(SEND_TIMEOUT_SECS))
        .build()?;

    let total = ctx.messages.len();
    let mut enviados: i64 = 0;
    let mut errores: i64 = 0;
    let started_at = Instant::now();

    for (idx, msg) in ctx.messages.iter().enumerate() {
        if cancel.0.load(Ordering::SeqCst) {
            set_campaign_estado(&state, campana_id, "cancelado")?;
            let _ = app.emit(
                "sms:completed",
                json!({
                    "campana_id": campana_id,
                    "enviados": enviados,
                    "errores": errores,
                    "duracion_ms": started_at.elapsed().as_millis() as u64,
                    "cancelado": true,
                }),
            );
            return Ok(());
        }

        let outcome = send_one_message(
            &client,
            &ctx.url,
            &ctx.token,
            &msg.numero,
            &msg.mensaje_final,
        )
        .await;

        match outcome {
            SendOutcome::Sent => {
                record_message_result(&state, campana_id, msg.log_id, "enviado", None, "enviados")?;
                enviados += 1;
                let _ = app.emit(
                    "sms:sent",
                    json!({
                        "contacto_id": msg.contacto_id,
                        "numero": msg.numero,
                        "estado": "enviado",
                    }),
                );
            }
            SendOutcome::Invalid(err) => {
                record_message_result(
                    &state,
                    campana_id,
                    msg.log_id,
                    "invalido",
                    Some(&err),
                    "errores",
                )?;
                errores += 1;
                let _ = app.emit(
                    "sms:error",
                    json!({
                        "contacto_id": msg.contacto_id,
                        "numero": msg.numero,
                        "error": err,
                    }),
                );
            }
            SendOutcome::Error(err) => {
                record_message_result(
                    &state,
                    campana_id,
                    msg.log_id,
                    "error",
                    Some(&err),
                    "errores",
                )?;
                errores += 1;
                let _ = app.emit(
                    "sms:error",
                    json!({
                        "contacto_id": msg.contacto_id,
                        "numero": msg.numero,
                        "error": err,
                    }),
                );
            }
            SendOutcome::AuthError => {
                set_campaign_estado(&state, campana_id, "cancelado")?;
                let _ = app.emit("sms:auth_error", json!({ "campana_id": campana_id }));
                return Ok(());
            }
            SendOutcome::PermError => {
                set_campaign_estado(&state, campana_id, "cancelado")?;
                let _ = app.emit("sms:perm_error", json!({ "campana_id": campana_id }));
                return Ok(());
            }
        }

        let processed = enviados + errores;
        let porcentaje = if total > 0 {
            (processed as u64 * 100) / total as u64
        } else {
            0
        };
        let _ = app.emit(
            "sms:progress",
            json!({
                "campana_id": campana_id,
                "enviados": enviados,
                "errores": errores,
                "total": total,
                "porcentaje": porcentaje,
            }),
        );

        if idx < total - 1 {
            tokio::time::sleep(Duration::from_millis(ctx.delay_ms)).await;
        }
    }

    mark_campaign_completed(&state, campana_id)?;
    let _ = app.emit(
        "sms:completed",
        json!({
            "campana_id": campana_id,
            "enviados": enviados,
            "errores": errores,
            "duracion_ms": started_at.elapsed().as_millis() as u64,
            "cancelado": false,
        }),
    );

    Ok(())
}
