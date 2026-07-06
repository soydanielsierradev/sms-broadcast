use std::sync::LazyLock;

use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};

use crate::errors::AppResult;

static MIGRATIONS: LazyLock<Migrations<'static>> = LazyLock::new(|| {
    Migrations::new(vec![M::up(
        r#"
        CREATE TABLE IF NOT EXISTS contactos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre      TEXT NOT NULL,
            numero      TEXT NOT NULL UNIQUE,
            notas       TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS listas (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre       TEXT NOT NULL UNIQUE,
            descripcion  TEXT,
            created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lista_contactos (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            lista_id     INTEGER NOT NULL REFERENCES listas(id) ON DELETE CASCADE,
            contacto_id  INTEGER NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
            UNIQUE(lista_id, contacto_id)
        );

        CREATE TABLE IF NOT EXISTS campanas (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre           TEXT NOT NULL,
            mensaje          TEXT NOT NULL,
            lista_id         INTEGER REFERENCES listas(id),
            total_contactos  INTEGER DEFAULT 0,
            enviados         INTEGER DEFAULT 0,
            errores          INTEGER DEFAULT 0,
            estado           TEXT DEFAULT 'pendiente',
            created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at     DATETIME
        );

        CREATE TABLE IF NOT EXISTS mensajes_log (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            campana_id    INTEGER NOT NULL REFERENCES campanas(id) ON DELETE CASCADE,
            contacto_id   INTEGER REFERENCES contactos(id),
            numero        TEXT NOT NULL,
            nombre        TEXT,
            mensaje_final TEXT NOT NULL,
            estado        TEXT DEFAULT 'pendiente',
            error_detalle TEXT,
            sent_at       DATETIME
        );

        CREATE TABLE IF NOT EXISTS configuracion (
            clave  TEXT PRIMARY KEY,
            valor  TEXT NOT NULL
        );

        INSERT OR IGNORE INTO configuracion (clave, valor) VALUES
            ('movil_url', 'http://192.168.43.1:8080'),
            ('delay_entre_sms', '2000'),
            ('app_version', '1.0.0');
        "#,
    )])
});

pub fn run_migrations(conn: &mut Connection) -> AppResult<()> {
    conn.pragma_update(None, "foreign_keys", "ON")?;
    MIGRATIONS.to_latest(conn)?;
    Ok(())
}
