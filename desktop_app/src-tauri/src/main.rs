#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod providers;

use commands::{chat, config, conversations, memory, ollama, personality, provider};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            db::init(&app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            chat::send_message,
            conversations::list_conversations,
            conversations::delete_conversation,
            conversations::get_conversation,
            personality::get_personality_config,
            personality::switch_personality,
            provider::get_provider_status,
            provider::set_provider_mode,
            ollama::list_models,
            ollama::pull_model,
            ollama::check_ollama_status,
            config::get_preference,
            config::set_preference,
            config::delete_preference,
            memory::get_memory,
            memory::set_memory,
            memory::list_memories,
        ])
        .run(tauri::generate_context!())
        .expect("error while running TRINITY");
}
