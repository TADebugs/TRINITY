use super::{AiProvider, ChatMessage, ProviderError, StreamEvent};
use async_trait::async_trait;
use tokio::sync::mpsc;

pub struct OllamaProvider {
    pub base_url: String,
    pub model: String,
}

impl OllamaProvider {
    pub fn new(model: &str) -> Self {
        Self {
            base_url: "http://localhost:11434".to_string(),
            model: model.to_string(),
        }
    }
}

#[async_trait]
impl AiProvider for OllamaProvider {
    async fn chat_stream(
        &self,
        _messages: Vec<ChatMessage>,
        _system_prompt: &str,
        tx: mpsc::Sender<StreamEvent>,
    ) -> Result<(), ProviderError> {
        // TODO: implement NDJSON streaming from Ollama /api/chat
        let _ = tx.send(StreamEvent::Error("Not yet implemented".into())).await;
        Ok(())
    }

    fn name(&self) -> &str {
        "ollama"
    }

    async fn is_available(&self) -> bool {
        reqwest::get(&format!("{}/api/tags", self.base_url))
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false)
    }
}
