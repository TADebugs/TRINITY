pub mod gemini;
pub mod ollama;

use async_trait::async_trait;
use tokio::sync::mpsc;

#[derive(Debug)]
pub enum StreamEvent {
    Token(String),
    Done { content: String, tokens_used: Option<u32> },
    Error(String),
}

#[derive(Debug)]
pub enum ProviderError {
    NotAvailable,
    RequestFailed(String),
    NotImplemented(&'static str),
}

impl std::fmt::Display for ProviderError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NotAvailable => write!(f, "Provider not available"),
            Self::RequestFailed(msg) => write!(f, "Request failed: {}", msg),
            Self::NotImplemented(method) => write!(f, "{} not implemented", method),
        }
    }
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[async_trait]
pub trait AiProvider: Send + Sync {
    async fn chat_stream(
        &self,
        messages: Vec<ChatMessage>,
        system_prompt: &str,
        tx: mpsc::Sender<StreamEvent>,
    ) -> Result<(), ProviderError>;

    async fn transcribe(&self, _audio: Vec<u8>) -> Result<String, ProviderError> {
        Err(ProviderError::NotImplemented("transcribe"))
    }

    async fn synthesize(&self, _text: &str, _voice: &str) -> Result<Vec<u8>, ProviderError> {
        Err(ProviderError::NotImplemented("synthesize"))
    }

    fn name(&self) -> &str;
    async fn is_available(&self) -> bool;
}
