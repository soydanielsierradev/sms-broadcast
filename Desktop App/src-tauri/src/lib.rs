mod commands;
mod db;
mod errors;
mod models;

use std::sync::atomic::AtomicBool;
use std::sync::Mutex;

use tauri::Manager;

use crate::commands::campaigns::CancelFlag;
use crate::commands::{campaigns, contacts, lists, mobile_config, settings};
use crate::db::{init_db, run_migrations};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let mut conn = init_db(app.handle())?;
            run_migrations(&mut conn)?;
            app.manage(Mutex::new(conn));
            app.manage(CancelFlag(AtomicBool::new(false)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            contacts::get_contacts,
            contacts::get_contact,
            contacts::search_contacts,
            contacts::create_contact,
            contacts::update_contact,
            contacts::delete_contact,
            contacts::delete_contacts_bulk,
            contacts::import_contacts_csv,
            lists::get_lists,
            lists::get_list,
            lists::get_list_contacts,
            lists::create_list,
            lists::update_list,
            lists::delete_list,
            lists::add_contact_to_list,
            lists::remove_contact_from_list,
            settings::get_settings,
            settings::update_settings,
            mobile_config::set_mobile_config,
            mobile_config::get_mobile_config,
            mobile_config::clear_mobile_config,
            mobile_config::test_mobile_connection,
            campaigns::create_campaign,
            campaigns::get_campaigns,
            campaigns::get_campaign,
            campaigns::get_campaign_log,
            campaigns::cancel_campaign,
            campaigns::send_campaign,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
