use serde::{Serialize, Serializer};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("database error: {0}")]
    DbError(#[from] rusqlite::Error),

    #[error("migration error: {0}")]
    MigrationError(#[from] rusqlite_migration::Error),

    #[error("network error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("validation error: {0}")]
    ValidationError(String),

    #[error("not found: {0}")]
    NotFound(String),

    #[error("io error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("tauri error: {0}")]
    TauriError(#[from] tauri::Error),

    #[error("keyring error: {0}")]
    KeyringError(#[from] keyring::Error),

    #[error("json error: {0}")]
    JsonError(#[from] serde_json::Error),
}

// Manual Serialize so AppError crosses the Tauri command boundary as a string.
impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(self.to_string().as_str())
    }
}

pub type AppResult<T> = Result<T, AppError>;
