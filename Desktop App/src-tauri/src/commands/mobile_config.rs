use std::time::{Duration, Instant};

use keyring::Entry;
use tauri::State;

use crate::commands::contacts::poisoned_lock;
use crate::commands::settings::{delete_config, read_config_string, write_config_string};
use crate::db::DbState;
use crate::errors::{AppError, AppResult};
use crate::models::{ConnectionStatus, MobileConfig};

pub(crate) const URL_KEY: &str = "movil_url";
pub(crate) const KEYRING_SERVICE: &str = "sms-broadcast";
pub(crate) const KEYRING_USER: &str = "mobile-token";
const HEALTH_TIMEOUT_SECS: u64 = 5;

fn valid_mobile_url(url: &str) -> bool {
    let rest = if let Some(r) = url.strip_prefix("https://") {
        r
    } else if let Some(r) = url.strip_prefix("http://") {
        r
    } else {
        return false;
    };
    match rest.rsplit_once(':') {
        Some((host, port)) => {
            !host.is_empty()
                && !host.contains('/')
                && !port.is_empty()
                && port.chars().all(|c| c.is_ascii_digit())
        }
        None => false,
    }
}

fn valid_token(token: &str) -> bool {
    token.len() == 32
        && token
            .chars()
            .all(|c| c.is_ascii_digit() || ('a'..='f').contains(&c))
}

fn keyring_entry() -> AppResult<Entry> {
    Ok(Entry::new(KEYRING_SERVICE, KEYRING_USER)?)
}

pub(crate) fn get_mobile_token() -> AppResult<Option<String>> {
    let entry = keyring_entry()?;
    match entry.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::from(e)),
    }
}

pub(crate) fn get_mobile_url(conn: &rusqlite::Connection) -> AppResult<Option<String>> {
    read_config_string(conn, URL_KEY)
}

#[tauri::command]
pub fn set_mobile_config(
    url: String,
    token: String,
    state: State<'_, DbState>,
) -> AppResult<bool> {
    let url = url.trim().to_string();
    let token = token.trim().to_string();
    if !valid_mobile_url(&url) {
        return Err(AppError::ValidationError(
            "url must match http(s)://<host>:<port>".into(),
        ));
    }
    if !valid_token(&token) {
        return Err(AppError::ValidationError(
            "token must be 32 lowercase hex characters".into(),
        ));
    }

    // keyring first: if it fails, DB is untouched
    keyring_entry()?.set_password(&token)?;

    // then DB URL; on failure, roll back keyring
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => {
            rollback_keyring();
            return poisoned_lock();
        }
    };
    if let Err(e) = write_config_string(&conn, URL_KEY, &url) {
        drop(conn);
        rollback_keyring();
        return Err(e);
    }
    Ok(true)
}

fn rollback_keyring() {
    if let Ok(entry) = keyring_entry() {
        let _ = entry.delete_password();
    }
}

#[tauri::command]
pub fn get_mobile_config(state: State<'_, DbState>) -> AppResult<MobileConfig> {
    let url = {
        let conn = match state.lock() {
            Ok(c) => c,
            Err(_) => return poisoned_lock(),
        };
        get_mobile_url(&conn)?.unwrap_or_default()
    };
    let token_set = get_mobile_token()?.is_some();
    Ok(MobileConfig { url, token_set })
}

#[tauri::command]
pub fn clear_mobile_config(state: State<'_, DbState>) -> AppResult<bool> {
    {
        let conn = match state.lock() {
            Ok(c) => c,
            Err(_) => return poisoned_lock(),
        };
        delete_config(&conn, URL_KEY)?;
    }
    match keyring_entry()?.delete_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(true),
        Err(e) => Err(AppError::from(e)),
    }
}

#[tauri::command]
pub async fn test_mobile_connection(state: State<'_, DbState>) -> AppResult<ConnectionStatus> {
    // extract url + token synchronously so no MutexGuard crosses .await
    let url = {
        let conn = match state.lock() {
            Ok(c) => c,
            Err(_) => return poisoned_lock(),
        };
        get_mobile_url(&conn)?
    };
    let token = get_mobile_token()?;

    let url = match url {
        Some(u) => u,
        None => {
            return Ok(ConnectionStatus {
                connected: false,
                latency_ms: None,
                error: Some("mobile URL not configured".into()),
            })
        }
    };
    let token = match token {
        Some(t) => t,
        None => {
            return Ok(ConnectionStatus {
                connected: false,
                latency_ms: None,
                error: Some("token not set".into()),
            })
        }
    };

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(HEALTH_TIMEOUT_SECS))
        .build()?;

    let health_url = format!("{}/health", url.trim_end_matches('/'));
    let start = Instant::now();
    let response = client.get(&health_url).bearer_auth(&token).send().await;
    let latency_ms = start.elapsed().as_millis() as u64;

    match response {
        Ok(resp) if resp.status().is_success() => Ok(ConnectionStatus {
            connected: true,
            latency_ms: Some(latency_ms),
            error: None,
        }),
        Ok(resp) => Ok(ConnectionStatus {
            connected: false,
            latency_ms: Some(latency_ms),
            error: Some(format!("HTTP {}", resp.status())),
        }),
        Err(e) => Ok(ConnectionStatus {
            connected: false,
            latency_ms: None,
            error: Some(e.to_string()),
        }),
    }
}
