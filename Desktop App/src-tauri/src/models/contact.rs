use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub id: i64,
    pub nombre: String,
    pub numero: String,
    pub notas: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub total_listas: i64,
}
