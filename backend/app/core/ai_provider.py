from abc import ABC, abstractmethod
from typing import AsyncGenerator


class AIProvider(ABC):
    """Abstract interface — swap Gemini for OpenAI/Anthropic without touching chat logic."""

    @abstractmethod
    async def chat_stream(
        self,
        messages: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """Yield response tokens as they stream in."""
        ...

    @abstractmethod
    async def transcribe(self, audio_bytes: bytes) -> str:
        """Speech-to-text."""
        ...

    @abstractmethod
    async def synthesize(self, text: str, voice: str = "default") -> bytes:
        """Text-to-speech. Returns audio bytes."""
        ...
