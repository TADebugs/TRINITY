use tauri::{AppHandle, Manager};
use std::sync::Mutex;

pub struct AppDb(pub Mutex<rusqlite::Connection>);

pub fn init(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_dir = app.path().app_data_dir().map_err(|e| format!("Failed to get app data dir: {}", e))?;
    std::fs::create_dir_all(&app_dir)?;
    let db_path = app_dir.join("trinity.db");
    let conn = rusqlite::Connection::open(db_path)?;

    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            personality TEXT NOT NULL,
            title TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            personality TEXT,
            source TEXT DEFAULT 'text',
            provider TEXT,
            model TEXT,
            tokens_used INTEGER,
            latency_ms INTEGER,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            personality TEXT,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS preferences (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_key ON memories(personality, key);
    ")?;

    app.manage(AppDb(Mutex::new(conn)));
    Ok(())
}
