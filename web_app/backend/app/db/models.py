import enum

from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Enum, Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class PersonalityEnum(str, enum.Enum):
    aria = "aria"
    echo = "echo"
    nexus = "nexus"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    face_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), onupdate=func.now())

    sessions = relationship("Session", back_populates="user")
    memories = relationship("Memory", back_populates="user")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    active_personality = Column(Enum(PersonalityEnum), default=PersonalityEnum.aria)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    device_type = Column(String, default="web")

    user = relationship("User", back_populates="sessions")
    conversations = relationship("Conversation", back_populates="session")

    __table_args__ = (
        Index("idx_sessions_user_active", "user_id", postgresql_where=(ended_at.is_(None))),
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    personality = Column(Enum(PersonalityEnum), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    summary = Column(Text, nullable=True)

    session = relationship("Session", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    personality = Column(Enum(PersonalityEnum), nullable=True)
    source = Column(String, default="text")  # "voice" or "text"
    tokens_used = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
    tool_executions = relationship("ToolExecution", back_populates="message")

    __table_args__ = (
        Index("idx_messages_conv_created", "conversation_id", "created_at"),
    )


class Memory(Base):
    __tablename__ = "memories"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    personality = Column(Enum(PersonalityEnum), nullable=True)  # null = shared
    scope = Column(String, default="personal")  # "personal" or "shared"
    key = Column(String, nullable=False)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="memories")

    __table_args__ = (
        Index("idx_memories_user_key", "user_id", "key"),
    )


class ToolExecution(Base):
    __tablename__ = "tool_executions"

    id = Column(String, primary_key=True)
    message_id = Column(String, ForeignKey("messages.id"), nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    personality = Column(Enum(PersonalityEnum), nullable=False)
    tool_name = Column(String, nullable=False)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    status = Column(String, default="pending")  # pending / running / done / failed
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    message = relationship("Message", back_populates="tool_executions")

    __table_args__ = (
        Index("idx_tool_exec_msg", "message_id", "status"),
    )
