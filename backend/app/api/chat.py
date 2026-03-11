import uuid

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.gemini_provider import ai_provider
from app.core.personality_manager import PersonalityManager
from app.db.database import get_db
from app.db.models import Conversation, Message, User
from app.db.schemas import ChatRequest

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/send")
@limiter.limit("20/minute")
async def send_message(
    request: Request,
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    personality = PersonalityManager.load(body.personality)

    # Get or create conversation
    conversation_id = body.conversation_id
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        conv = Conversation(
            id=conversation_id,
            session_id=str(uuid.uuid4()),  # simplified — no session tracking yet
            user_id=current_user.id,
            personality=body.personality,
        )
        db.add(conv)
        db.commit()

    # Save user message
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=body.message,
        personality=body.personality,
        source="text",
    )
    db.add(user_msg)
    db.commit()

    # Build message list for AI
    messages = body.history + [{"role": "user", "content": body.message}]

    # Stream response
    async def generate():
        full_response = ""
        async for token in ai_provider.chat_stream(
            messages=messages,
            system_prompt=personality.system_prompt,
        ):
            full_response += token
            yield token

        # Save assistant message after streaming completes
        assistant_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role="assistant",
            content=full_response,
            personality=body.personality,
        )
        db.add(assistant_msg)
        db.commit()

    return StreamingResponse(generate(), media_type="text/plain")
