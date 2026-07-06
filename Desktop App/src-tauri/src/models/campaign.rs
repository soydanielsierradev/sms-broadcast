use serde::{Deserialize, Serialize};

use super::message_log::MessageLog;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Campaign {
    pub id: i64,
    pub nombre: String,
    pub mensaje: String,
    pub lista_id: Option<i64>,
    pub total_contactos: i64,
    pub enviados: i64,
    pub errores: i64,
    pub estado: String,
    pub created_at: String,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CampaignDetail {
    pub campaign: Campaign,
    pub mensajes: Vec<MessageLog>,
}
