use serde::Serialize;
use tauri::AppHandle;

#[derive(Debug, Serialize)]
pub struct OllamaModel {
    pub name: String,
    pub size: u64,
    pub modified_at: String,
}

#[tauri::command]
pub async fn list_models() -> Result<Vec<OllamaModel>, String> {
    let resp = reqwest::get("http://localhost:11434/api/tags")
        .await
        .map_err(|e| format!("Ollama not reachable: {}", e))?;
    let body: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let models = body["models"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .map(|m| OllamaModel {
            name: m["name"].as_str().unwrap_or("").to_string(),
            size: m["size"].as_u64().unwrap_or(0),
            modified_at: m["modified_at"].as_str().unwrap_or("").to_string(),
        })
        .collect();
    Ok(models)
}

#[tauri::command]
pub async fn pull_model(_app: AppHandle, name: String) -> Result<(), String> {
    // TODO: implement streaming pull with progress events
    let _ = name;
    Err("Not yet implemented".to_string())
}

#[tauri::command]
pub async fn check_ollama_status() -> Result<bool, String> {
    let available = reqwest::get("http://localhost:11434/api/tags")
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false);
    Ok(available)
}
