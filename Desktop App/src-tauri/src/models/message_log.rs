use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageLog {
    pub id: i64,
    pub campana_id: i64,
    pub contacto_id: Option<i64>,
    pub numero: String,
    pub nombre: Option<String>,
    pub mensaje_final: String,
    pub estado: String,
    pub error_detalle: Option<String>,
    pub sent_at: Option<String>,
}
