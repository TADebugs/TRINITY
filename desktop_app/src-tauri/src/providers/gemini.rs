use super::{AiProvider, ChatMessage, ProviderError, StreamEvent};
use async_trait::async_trait;
use tokio::sync::mpsc;

pub struct GeminiProvider {
    pub api_key: String,
}

impl GeminiProvider {
    pub fn new(api_key: &str) -> Self {
        Self {
            api_key: api_key.to_string(),
        }
    }
}

#[async_trait]
impl AiProvider for GeminiProvider {
    async fn chat_stream(
        &self,
        _messages: Vec<ChatMessage>,
        _system_prompt: &str,
        tx: mpsc::Sender<StreamEvent>,
    ) -> Result<(), ProviderError> {
        // TODO: implement Gemini REST API streaming
        let _ = tx.send(StreamEvent::Error("Not yet implemented".into())).await;
        Ok(())
    }

    fn name(&self) -> &str {
        "gemini"
    }

    async fn is_available(&self) -> bool {
        !self.api_key.is_empty()
    }
}
