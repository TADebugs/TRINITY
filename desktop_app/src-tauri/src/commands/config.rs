use tauri::State;
use rusqlite::OptionalExtension;
use crate::db::AppDb;

#[tauri::command]
pub fn get_preference(key: String, db: State<'_, AppDb>) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT value FROM preferences WHERE key = ?1")
        .map_err(|e| e.to_string())?;
    let result = stmt
        .query_row([&key], |row| row.get(0))
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(result)
}

#[tauri::command]
pub fn set_preference(key: String, value: String, db: State<'_, AppDb>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO preferences (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
        [&key, &value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_preference(key: String, db: State<'_, AppDb>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM preferences WHERE key = ?1", [&key])
        .map_err(|e| e.to_string())?;
    Ok(())
}
