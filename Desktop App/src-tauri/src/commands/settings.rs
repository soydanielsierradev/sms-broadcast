use rusqlite::{params, OptionalExtension};
use tauri::State;

use crate::commands::contacts::poisoned_lock;
use crate::db::DbState;
use crate::errors::{AppError, AppResult};
use crate::models::Settings;

pub(crate) const DELAY_KEY: &str = "delay_entre_sms";
const DEFAULT_DELAY: i64 = 2000;
const MIN_DELAY: i64 = 500;
const MAX_DELAY: i64 = 10000;

pub(crate) fn read_config_string(
    conn: &rusqlite::Connection,
    key: &str,
) -> AppResult<Option<String>> {
    let value: Option<String> = conn
        .query_row(
            "SELECT valor FROM configuracion WHERE clave = ?1",
            [key],
            |row| row.get(0),
        )
        .optional()?;
    Ok(value.filter(|s| !s.is_empty()))
}

pub(crate) fn write_config_string(
    conn: &rusqlite::Connection,
    key: &str,
    value: &str,
) -> AppResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?1, ?2)",
        params![key, value],
    )?;
    Ok(())
}

pub(crate) fn delete_config(conn: &rusqlite::Connection, key: &str) -> AppResult<()> {
    conn.execute("DELETE FROM configuracion WHERE clave = ?1", [key])?;
    Ok(())
}

#[tauri::command]
pub fn get_settings(state: State<'_, DbState>) -> AppResult<Settings> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let delay = read_config_string(&conn, DELAY_KEY)?
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(DEFAULT_DELAY);
    Ok(Settings {
        delay_entre_sms: delay,
    })
}

#[tauri::command]
pub fn update_settings(delay_entre_sms: i64, state: State<'_, DbState>) -> AppResult<Settings> {
    if !(MIN_DELAY..=MAX_DELAY).contains(&delay_entre_sms) {
        return Err(AppError::ValidationError(format!(
            "delay must be between {} and {} ms",
            MIN_DELAY, MAX_DELAY
        )));
    }
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    write_config_string(&conn, DELAY_KEY, &delay_entre_sms.to_string())?;
    Ok(Settings {
        delay_entre_sms,
    })
}
