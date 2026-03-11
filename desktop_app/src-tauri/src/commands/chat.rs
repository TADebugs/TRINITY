use tauri::AppHandle;

#[tauri::command]
pub async fn send_message(
    _app: AppHandle,
    _message: String,
    _personality: String,
    _history: Vec<serde_json::Value>,
) -> Result<(), String> {
    // TODO: implement provider routing + streaming
    Ok(())
}
