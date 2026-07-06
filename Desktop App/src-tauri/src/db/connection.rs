use std::fs;
use std::sync::Mutex;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

use crate::errors::AppResult;

pub type DbState = Mutex<Connection>;

const DB_FILENAME: &str = "sms-broadcast.db";

pub fn init_db(app_handle: &AppHandle) -> AppResult<Connection> {
    let data_dir = app_handle.path().app_data_dir()?;
    fs::create_dir_all(&data_dir)?;
    let db_path = data_dir.join(DB_FILENAME);
    let conn = Connection::open(db_path)?;
    Ok(conn)
}
