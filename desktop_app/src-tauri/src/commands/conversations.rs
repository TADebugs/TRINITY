use tauri::State;
use crate::db::AppDb;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Conversation {
    pub id: String,
    pub personality: String,
    pub title: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub fn list_conversations(db: State<'_, AppDb>) -> Result<Vec<Conversation>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, personality, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                personality: row.get(1)?,
                title: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut convs = Vec::new();
    for row in rows {
        convs.push(row.map_err(|e| e.to_string())?);
    }
    Ok(convs)
}

#[tauri::command]
pub fn get_conversation(id: String, db: State<'_, AppDb>) -> Result<Conversation, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, personality, title, created_at, updated_at FROM conversations WHERE id = ?1",
        [&id],
        |row| {
            Ok(Conversation {
                id: row.get(0)?,
                personality: row.get(1)?,
                title: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_conversation(id: String, db: State<'_, AppDb>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM messages WHERE conversation_id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM conversations WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
