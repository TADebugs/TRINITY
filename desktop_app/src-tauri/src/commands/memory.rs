use tauri::State;
use crate::db::AppDb;
use rusqlite::OptionalExtension;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct MemoryEntry {
    pub key: String,
    pub value: String,
    pub personality: Option<String>,
}

#[tauri::command]
pub fn get_memory(
    key: String,
    personality: Option<String>,
    db: State<'_, AppDb>,
) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let result = match &personality {
        Some(p) => conn
            .query_row(
                "SELECT value FROM memories WHERE key = ?1 AND personality = ?2",
                [&key, p],
                |row| row.get(0),
            )
            .optional(),
        None => conn
            .query_row(
                "SELECT value FROM memories WHERE key = ?1 AND personality IS NULL",
                [&key],
                |row| row.get(0),
            )
            .optional(),
    };
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_memory(
    key: String,
    value: String,
    personality: Option<String>,
    db: State<'_, AppDb>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO memories (id, personality, key, value, updated_at) VALUES (?1, ?2, ?3, ?4, datetime('now'))
         ON CONFLICT(personality, key) DO UPDATE SET value = ?4, updated_at = datetime('now')",
        rusqlite::params![id, personality, key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_memories(
    personality: Option<String>,
    db: State<'_, AppDb>,
) -> Result<Vec<MemoryEntry>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut entries = Vec::new();
    match &personality {
        Some(p) => {
            let mut stmt = conn
                .prepare("SELECT key, value, personality FROM memories WHERE personality = ?1 ORDER BY key")
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map([p], |row| {
                    Ok(MemoryEntry {
                        key: row.get(0)?,
                        value: row.get(1)?,
                        personality: row.get(2)?,
                    })
                })
                .map_err(|e| e.to_string())?;
            for row in rows {
                entries.push(row.map_err(|e| e.to_string())?);
            }
        }
        None => {
            let mut stmt = conn
                .prepare("SELECT key, value, personality FROM memories ORDER BY key")
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map([], |row| {
                    Ok(MemoryEntry {
                        key: row.get(0)?,
                        value: row.get(1)?,
                        personality: row.get(2)?,
                    })
                })
                .map_err(|e| e.to_string())?;
            for row in rows {
                entries.push(row.map_err(|e| e.to_string())?);
            }
        }
    }
    Ok(entries)
}
