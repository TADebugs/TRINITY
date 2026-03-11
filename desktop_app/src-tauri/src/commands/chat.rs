use tauri::AppHandle;

#[tauri::command]
pub async fn send_message(
    app: AppHandle,
    message: String,
    personality: String,
    history: Vec<serde_json::Value>,
) -> Result<(), String> {
    // TODO: implement provider routing + streaming
    Ok(())
}
