use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ProviderStatus {
    pub mode: String,
    pub provider: String,
    pub model: String,
}

#[tauri::command]
pub fn get_provider_status() -> Result<ProviderStatus, String> {
    // TODO: read from app state / preferences
    Ok(ProviderStatus {
        mode: "auto".into(),
        provider: "gemini".into(),
        model: "gemini-2.5-flash".into(),
    })
}

#[tauri::command]
pub fn set_provider_mode(mode: String) -> Result<(), String> {
    match mode.as_str() {
        "auto" | "cloud" | "local" => {
            // TODO: persist to preferences and update app state
            Ok(())
        }
        _ => Err(format!("Invalid provider mode: {}", mode)),
    }
}
