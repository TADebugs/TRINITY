use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct PersonalityConfig {
    pub name: String,
    pub slug: String,
    pub color: String,
    pub accent: String,
    pub tagline: String,
    pub humor_style: String,
    pub local_model: String,
    pub system_prompt: String,
}

#[tauri::command]
pub fn get_personality_config(name: String) -> Result<PersonalityConfig, String> {
    // TODO: load from bundled YAML resources
    let config = match name.to_lowercase().as_str() {
        "aria" => PersonalityConfig {
            name: "ARIA".into(),
            slug: "aria".into(),
            color: "#4A90D9".into(),
            accent: "#2563EB".into(),
            tagline: "Assistant Mode".into(),
            humor_style: "sarcastic".into(),
            local_model: "phi3:mini".into(),
            system_prompt: String::new(),
        },
        "echo" => PersonalityConfig {
            name: "ECHO".into(),
            slug: "echo".into(),
            color: "#9B59B6".into(),
            accent: "#7C3AED".into(),
            tagline: "Creative Mode".into(),
            humor_style: "dad_jokes".into(),
            local_model: "llama3.2:3b".into(),
            system_prompt: String::new(),
        },
        "nexus" => PersonalityConfig {
            name: "NEXUS".into(),
            slug: "nexus".into(),
            color: "#27AE60".into(),
            accent: "#16A34A".into(),
            tagline: "Developer Mode".into(),
            humor_style: "nerd_subtle".into(),
            local_model: "phi3:mini".into(),
            system_prompt: String::new(),
        },
        _ => return Err(format!("Unknown personality: {}", name)),
    };
    Ok(config)
}

#[tauri::command]
pub fn switch_personality(name: String) -> Result<(), String> {
    // Validate personality name
    match name.to_lowercase().as_str() {
        "aria" | "echo" | "nexus" => Ok(()),
        _ => Err(format!("Unknown personality: {}", name)),
    }
}
