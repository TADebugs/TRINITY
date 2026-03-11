from typing import AsyncGenerator

import google.generativeai as genai

from app.config import settings
from app.core.ai_provider import AIProvider

genai.configure(api_key=settings.GEMINI_API_KEY)


class GeminiProvider(AIProvider):
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config=genai.GenerationConfig(
                temperature=0.8,
                max_output_tokens=2048,
            ),
        )

    async def chat_stream(
        self,
        messages: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        # Build history (exclude last user message — it becomes the prompt)
        history = []
        for msg in messages[:-1]:
            history.append({
                "role": "user" if msg["role"] == "user" else "model",
                "parts": [msg["content"]],
            })

        chat = self.model.start_chat(history=history)

        # Always prepend system prompt so personality is respected
        prompt = f"{system_prompt}\n\n---\n\n{messages[-1]['content']}"

        response = await chat.send_message_async(prompt, stream=True)
        async for chunk in response:
            if chunk.text:
                yield chunk.text

    async def transcribe(self, audio_bytes: bytes) -> str:
        audio_part = {"mime_type": "audio/wav", "data": audio_bytes}
        response = self.model.generate_content(["Transcribe this audio:", audio_part])
        return response.text

    async def synthesize(self, text: str, voice: str = "default") -> bytes:
        raise NotImplementedError("TTS not yet implemented — use browser Web Speech API for MVP")


# Singleton
ai_provider = GeminiProvider()
