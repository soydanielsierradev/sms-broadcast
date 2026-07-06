use csv::ReaderBuilder;
use rusqlite::{params, ErrorCode, Row};
use tauri::State;

use crate::db::DbState;
use crate::errors::{AppError, AppResult};
use crate::models::{Contact, ImportResult};

pub(crate) const SELECT_CONTACT_WITH_COUNT: &str = "
    SELECT c.id, c.nombre, c.numero, c.notas, c.created_at, c.updated_at,
           COUNT(lc.lista_id) AS total_listas
    FROM contactos c
    LEFT JOIN lista_contactos lc ON lc.contacto_id = c.id
";

pub(crate) fn map_contact(row: &Row) -> rusqlite::Result<Contact> {
    Ok(Contact {
        id: row.get(0)?,
        nombre: row.get(1)?,
        numero: row.get(2)?,
        notas: row.get(3)?,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
        total_listas: row.get(6)?,
    })
}

pub(crate) fn poisoned_lock<T>() -> Result<T, AppError> {
    Err(AppError::ValidationError("db lock poisoned".into()))
}

fn map_unique_violation(err: rusqlite::Error, numero: &str) -> AppError {
    if let rusqlite::Error::SqliteFailure(ref f, _) = err {
        if f.code == ErrorCode::ConstraintViolation {
            return AppError::ValidationError(format!("contact with numero {} already exists", numero));
        }
    }
    AppError::from(err)
}

#[tauri::command]
pub fn get_contacts(state: State<'_, DbState>) -> AppResult<Vec<Contact>> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let sql = format!("{} GROUP BY c.id ORDER BY c.nombre COLLATE NOCASE", SELECT_CONTACT_WITH_COUNT);
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], map_contact)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(AppError::from)
}

#[tauri::command]
pub fn get_contact(id: i64, state: State<'_, DbState>) -> AppResult<Contact> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let sql = format!("{} WHERE c.id = ?1 GROUP BY c.id", SELECT_CONTACT_WITH_COUNT);
    conn.query_row(&sql, [id], map_contact).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("contact {}", id)),
        other => AppError::from(other),
    })
}

#[tauri::command]
pub fn search_contacts(query: String, state: State<'_, DbState>) -> AppResult<Vec<Contact>> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let pattern = format!("%{}%", query.trim().replace('%', "\\%").replace('_', "\\_"));
    let sql = format!(
        "{} WHERE c.nombre LIKE ?1 ESCAPE '\\' OR c.numero LIKE ?1 ESCAPE '\\' GROUP BY c.id ORDER BY c.nombre COLLATE NOCASE",
        SELECT_CONTACT_WITH_COUNT
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([pattern], map_contact)?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(AppError::from)
}

#[tauri::command]
pub fn create_contact(
    nombre: String,
    numero: String,
    notas: Option<String>,
    state: State<'_, DbState>,
) -> AppResult<Contact> {
    let nombre = nombre.trim().to_string();
    let numero = numero.trim().to_string();
    if nombre.is_empty() {
        return Err(AppError::ValidationError("nombre is required".into()));
    }
    if numero.is_empty() {
        return Err(AppError::ValidationError("numero is required".into()));
    }
    let notas = notas
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    conn.execute(
        "INSERT INTO contactos (nombre, numero, notas) VALUES (?1, ?2, ?3)",
        params![nombre, numero, notas],
    )
    .map_err(|e| map_unique_violation(e, &numero))?;

    let id = conn.last_insert_rowid();
    let sql = format!("{} WHERE c.id = ?1 GROUP BY c.id", SELECT_CONTACT_WITH_COUNT);
    conn.query_row(&sql, [id], map_contact).map_err(AppError::from)
}

#[tauri::command]
pub fn update_contact(
    id: i64,
    nombre: String,
    numero: String,
    notas: Option<String>,
    state: State<'_, DbState>,
) -> AppResult<Contact> {
    let nombre = nombre.trim().to_string();
    let numero = numero.trim().to_string();
    if nombre.is_empty() {
        return Err(AppError::ValidationError("nombre is required".into()));
    }
    if numero.is_empty() {
        return Err(AppError::ValidationError("numero is required".into()));
    }
    let notas = notas
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let affected = conn
        .execute(
            "UPDATE contactos
             SET nombre = ?1, numero = ?2, notas = ?3, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?4",
            params![nombre, numero, notas, id],
        )
        .map_err(|e| map_unique_violation(e, &numero))?;

    if affected == 0 {
        return Err(AppError::NotFound(format!("contact {}", id)));
    }

    let sql = format!("{} WHERE c.id = ?1 GROUP BY c.id", SELECT_CONTACT_WITH_COUNT);
    conn.query_row(&sql, [id], map_contact).map_err(AppError::from)
}

#[tauri::command]
pub fn delete_contact(id: i64, state: State<'_, DbState>) -> AppResult<bool> {
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let affected = conn.execute("DELETE FROM contactos WHERE id = ?1", [id])?;
    Ok(affected > 0)
}

#[tauri::command]
pub fn delete_contacts_bulk(ids: Vec<i64>, state: State<'_, DbState>) -> AppResult<i64> {
    if ids.is_empty() {
        return Ok(0);
    }
    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };
    let placeholders = std::iter::repeat("?")
        .take(ids.len())
        .collect::<Vec<_>>()
        .join(",");
    let sql = format!("DELETE FROM contactos WHERE id IN ({})", placeholders);
    let affected = conn.execute(&sql, rusqlite::params_from_iter(ids.iter()))?;
    Ok(affected as i64)
}

#[tauri::command]
pub fn import_contacts_csv(
    csv_content: String,
    state: State<'_, DbState>,
) -> AppResult<ImportResult> {
    let mut imported: i64 = 0;
    let mut duplicated: i64 = 0;
    let mut errors: Vec<String> = Vec::new();

    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .trim(csv::Trim::All)
        .from_reader(csv_content.as_bytes());

    let conn = match state.lock() {
        Ok(c) => c,
        Err(_) => return poisoned_lock(),
    };

    for (row_idx, record) in reader.records().enumerate() {
        let line_num = row_idx + 2; // header is line 1, first data row is line 2

        let record = match record {
            Ok(r) => r,
            Err(e) => {
                errors.push(format!("line {}: {}", line_num, e));
                continue;
            }
        };

        let nombre = record.get(0).unwrap_or("").trim().to_string();
        let numero = record.get(1).unwrap_or("").trim().to_string();
        let notas = record
            .get(2)
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());

        if nombre.is_empty() || numero.is_empty() {
            errors.push(format!("line {}: nombre and numero are required", line_num));
            continue;
        }

        match conn.execute(
            "INSERT OR IGNORE INTO contactos (nombre, numero, notas) VALUES (?1, ?2, ?3)",
            params![nombre, numero, notas],
        ) {
            Ok(0) => duplicated += 1,
            Ok(_) => imported += 1,
            Err(e) => errors.push(format!("line {}: {}", line_num, e)),
        }
    }

    Ok(ImportResult {
        imported,
        duplicated,
        errors,
    })
}
