use rusqlite::{params, ErrorCode, Row};
use tauri::State;

use crate::commands::contacts::{map_contact, poisoned_lock, SELECT_CONTACT_WITH_COUNT};
use crate::db::DbState;
use crate::errors::{AppError, AppResult};
use crate::models::{Contact, List, ListWithContacts};

const SELECT_LIST_WITH_COUNT: &str = "
    SELECT l.id, l.nombre, l.descripcion, l.created_at,
           (SELECT COUNT(*) FROM lista_contactos WHERE lista_id = l.id) AS total_contactos
    FROM listas l
";

fn map_list(row: &Row) -> rusqlite::Result<List> {
    Ok(List {
        id: row.get(0)?,
        nombre: row.get(1)?,
        descripcion: row.get(2)?,
        created_at: row.get(3)?,
        total_contactos: row.get(4)?,
    })
}

fn map_unique_violation(err: rusqlite::Error, nombre: &str) -> AppError {
    if let rusqlite::Error::SqliteFailure(ref f, _) = err {
        if f.code == ErrorCode::ConstraintViolation {
            return AppError::ValidationError(format!("list with nombre {} already exists", nombre));
        }
    }
    AppError::from(err)
}

#[tauri::command]
pub fn get_lists(state: State<'_, DbState>) -> AppResult<Vec<List>> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let sql = format!("{} ORDER BY l.nombre COLLATE NOCASE", SELECT_LIST_WITH_COUNT);
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], map_list)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(AppError::from)
}

fn fetch_list_by_id(conn: &rusqlite::Connection, id: i64) -> AppResult<List> {
    let sql = format!("{} WHERE l.id = ?1", SELECT_LIST_WITH_COUNT);
    conn.query_row(&sql, [id], map_list).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("list {}", id)),
        other => AppError::from(other),
    })
}

fn fetch_contacts_for_list(conn: &rusqlite::Connection, lista_id: i64) -> AppResult<Vec<Contact>> {
    let sql = format!(
        "{} INNER JOIN lista_contactos lc2 ON lc2.contacto_id = c.id WHERE lc2.lista_id = ?1 GROUP BY c.id ORDER BY c.nombre COLLATE NOCASE",
        SELECT_CONTACT_WITH_COUNT
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([lista_id], map_contact)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(AppError::from)
}

#[tauri::command]
pub fn get_list(id: i64, state: State<'_, DbState>) -> AppResult<ListWithContacts> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let list = fetch_list_by_id(&conn, id)?;
    let contactos = fetch_contacts_for_list(&conn, id)?;
    Ok(ListWithContacts { list, contactos })
}

#[tauri::command]
pub fn get_list_contacts(lista_id: i64, state: State<'_, DbState>) -> AppResult<Vec<Contact>> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    // ensure list exists (return NotFound instead of empty vec silently)
    fetch_list_by_id(&conn, lista_id)?;
    fetch_contacts_for_list(&conn, lista_id)
}

#[tauri::command]
pub fn create_list(
    nombre: String,
    descripcion: Option<String>,
    state: State<'_, DbState>,
) -> AppResult<List> {
    let nombre = nombre.trim().to_string();
    if nombre.is_empty() {
        return Err(AppError::ValidationError("nombre is required".into()));
    }
    let descripcion = descripcion
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    conn.execute(
        "INSERT INTO listas (nombre, descripcion) VALUES (?1, ?2)",
        params![nombre, descripcion],
    )
    .map_err(|e| map_unique_violation(e, &nombre))?;

    let id = conn.last_insert_rowid();
    fetch_list_by_id(&conn, id)
}

#[tauri::command]
pub fn update_list(
    id: i64,
    nombre: String,
    descripcion: Option<String>,
    state: State<'_, DbState>,
) -> AppResult<List> {
    let nombre = nombre.trim().to_string();
    if nombre.is_empty() {
        return Err(AppError::ValidationError("nombre is required".into()));
    }
    let descripcion = descripcion
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let affected = conn
        .execute(
            "UPDATE listas SET nombre = ?1, descripcion = ?2 WHERE id = ?3",
            params![nombre, descripcion, id],
        )
        .map_err(|e| map_unique_violation(e, &nombre))?;

    if affected == 0 {
        return Err(AppError::NotFound(format!("list {}", id)));
    }
    fetch_list_by_id(&conn, id)
}

#[tauri::command]
pub fn delete_list(id: i64, state: State<'_, DbState>) -> AppResult<bool> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    // CASCADE removes rows in lista_contactos, campanas keep lista_id but referenced list is gone
    let affected = conn.execute("DELETE FROM listas WHERE id = ?1", [id])?;
    Ok(affected > 0)
}

#[tauri::command]
pub fn add_contact_to_list(
    lista_id: i64,
    contacto_id: i64,
    state: State<'_, DbState>,
) -> AppResult<bool> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let affected = conn.execute(
        "INSERT OR IGNORE INTO lista_contactos (lista_id, contacto_id) VALUES (?1, ?2)",
        params![lista_id, contacto_id],
    )?;
    Ok(affected > 0)
}

#[tauri::command]
pub fn remove_contact_from_list(
    lista_id: i64,
    contacto_id: i64,
    state: State<'_, DbState>,
) -> AppResult<bool> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let affected = conn.execute(
        "DELETE FROM lista_contactos WHERE lista_id = ?1 AND contacto_id = ?2",
        params![lista_id, contacto_id],
    )?;
    Ok(affected > 0)
}
