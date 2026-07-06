use serde::{Deserialize, Serialize};

use super::contact::Contact;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct List {
    pub id: i64,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub created_at: String,
    pub total_contactos: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListWithContacts {
    pub list: List,
    pub contactos: Vec<Contact>,
}
