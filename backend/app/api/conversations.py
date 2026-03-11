from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.database import get_db
from app.db.models import Conversation, Message, User
from app.db.schemas import (
    ConversationDetail,
    ConversationListResponse,
    ConversationMessagesResponse,
    ConversationSummary,
    MessageOut,
)

router = APIRouter()


def _message_to_out(msg: Message) -> MessageOut:
    return MessageOut(
        id=msg.id,
        role=msg.role,
        content=msg.content,
        personality=msg.personality.value if msg.personality else None,
        source=msg.source or "text",
        timestamp=msg.created_at.timestamp() * 1000 if msg.created_at else 0,
    )


@router.get("", response_model=ConversationListResponse)
def list_conversations(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.started_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "conversations": [
            ConversationSummary(
                id=c.id,
                personality=c.personality.value,
                started_at=c.started_at,
                ended_at=c.ended_at,
                summary=c.summary,
                message_count=len(c.messages),
            )
            for c in convs
        ]
    }


@router.get("/{conversation_id}")
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ConversationDetail(
        id=conv.id,
        personality=conv.personality.value,
        started_at=conv.started_at,
        ended_at=conv.ended_at,
        summary=conv.summary,
        message_count=len(conv.messages),
        messages=[_message_to_out(m) for m in conv.messages],
    )


@router.get("/{conversation_id}/messages", response_model=ConversationMessagesResponse)
def get_conversation_messages(
    conversation_id: str,
    limit: int = 50,
    before: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify ownership
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    query = db.query(Message).filter(Message.conversation_id == conversation_id)

    if before:
        # Cursor-based pagination: get messages before this message's created_at
        cursor_msg = db.query(Message).filter(Message.id == before).first()
        if cursor_msg:
            query = query.filter(Message.created_at < cursor_msg.created_at)

    messages = (
        query.order_by(Message.created_at.desc())
        .limit(limit + 1)  # fetch one extra to check has_more
        .all()
    )

    has_more = len(messages) > limit
    messages = messages[:limit]
    messages.reverse()  # return in chronological order

    return {
        "messages": [_message_to_out(m) for m in messages],
        "has_more": has_more,
    }


@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Delete messages first (cascade)
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.delete(conv)
    db.commit()

    return {"success": True}
