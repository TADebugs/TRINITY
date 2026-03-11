from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr


# ── Personality ──────────────────────────────

PersonalitySlug = Literal["aria", "echo", "nexus"]


# ── Auth ─────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    display_name: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict  # { id, name }


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfile(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Chat ─────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    personality: PersonalitySlug
    conversation_id: str | None = None
    history: list[dict] = []


# ── Message ──────────────────────────────────

class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    personality: PersonalitySlug | None = None
    source: str = "text"
    timestamp: float  # Unix ms

    class Config:
        from_attributes = True


# ── Conversation ─────────────────────────────

class ConversationSummary(BaseModel):
    id: str
    personality: PersonalitySlug
    started_at: datetime
    ended_at: datetime | None = None
    summary: str | None = None
    message_count: int = 0

    class Config:
        from_attributes = True


class ConversationDetail(ConversationSummary):
    messages: list[MessageOut] = []


class ConversationListResponse(BaseModel):
    conversations: list[ConversationSummary]


class ConversationMessagesResponse(BaseModel):
    messages: list[MessageOut]
    has_more: bool = False


# ── Memory ───────────────────────────────────

class MemoryEntry(BaseModel):
    key: str
    value: Any
    scope: str = "personal"
    personality: PersonalitySlug | None = None
    updated_at: datetime

    class Config:
        from_attributes = True


class MemoryUpdateRequest(BaseModel):
    value: Any
    personality: PersonalitySlug | None = None


class MemoryListResponse(BaseModel):
    memories: list[MemoryEntry]


# ── Tools ────────────────────────────────────

class ToolRequest(BaseModel):
    tool_name: str
    params: dict = {}
    personality: PersonalitySlug


class ToolStatus(BaseModel):
    task_id: str
    status: str  # pending / running / done / failed
    result: Any | None = None
    error: str | None = None
    duration_ms: int | None = None


class ToolAvailableResponse(BaseModel):
    enabled: list[str]
    disabled: list[str]
