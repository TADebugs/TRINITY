import uuid

import socketio

from app.api.auth import verify_token
from app.core.gemini_provider import ai_provider
from app.core.personality_manager import PersonalityManager
from app.db.database import SessionLocal
from app.db.models import Conversation, Message as DBMessage, PersonalityEnum

# This sio instance is created in main.py and imported here via register_events()
sio: socketio.AsyncServer | None = None

# Map sid -> user_id for authenticated connections
_sid_user_map: dict[str, str] = {}


def register_events(server: socketio.AsyncServer):
    """Attach Socket.IO event handlers to the server instance."""
    global sio
    sio = server

    @sio.event
    async def connect(sid, environ, auth):
        token = auth.get("token") if auth else None
        if not token:
            raise socketio.exceptions.ConnectionRefusedError("Unauthorized")

        user_id = verify_token(token)
        if not user_id:
            raise socketio.exceptions.ConnectionRefusedError("Invalid token")

        _sid_user_map[sid] = user_id
        print(f"[WS] client connected: {sid} (user: {user_id})")

    @sio.event
    async def disconnect(sid):
        _sid_user_map.pop(sid, None)
        print(f"[WS] client disconnected: {sid}")

    @sio.event
    async def switch_personality(sid, data):
        """Client requests personality switch."""
        personality_slug = data.get("personality")
        try:
            config = PersonalityManager.load(personality_slug)
            await sio.emit("personality_switched", {
                "personality": config.slug,
                "color": config.color,
                "tagline": config.tagline,
            }, to=sid)
        except (ValueError, FileNotFoundError):
            await sio.emit("error", {
                "code": "INVALID_PERSONALITY",
                "message": f"Unknown personality: {personality_slug}",
            }, to=sid)

    @sio.event
    async def chat_message(sid, data):
        """Real-time streaming chat via WebSocket."""
        user_id = _sid_user_map.get(sid)
        if not user_id:
            await sio.emit("error", {"code": "UNAUTHORIZED", "message": "Not authenticated"}, to=sid)
            return

        personality_slug = data.get("personality", "aria")
        try:
            personality = PersonalityManager.load(personality_slug)
        except (ValueError, FileNotFoundError):
            await sio.emit("error", {
                "code": "INVALID_PERSONALITY",
                "message": f"Unknown personality: {personality_slug}",
            }, to=sid)
            return

        user_message = data.get("message", "")
        messages = data.get("history", []) + [{"role": "user", "content": user_message}]
        conversation_id = data.get("conversation_id") or str(uuid.uuid4())
        message_id = str(uuid.uuid4())

        # Persist to database
        db = SessionLocal()
        try:
            # Create conversation if it doesn't exist
            conv = db.query(Conversation).filter_by(id=conversation_id).first()
            if not conv:
                # Ensure a session row exists (create one if needed)
                from app.db.models import Session as DBSession
                session_row = db.query(DBSession).filter_by(id=user_id).first()
                if not session_row:
                    session_row = DBSession(id=user_id, user_id=user_id)
                    db.add(session_row)
                    db.flush()

                conv = Conversation(
                    id=conversation_id,
                    session_id=session_row.id,
                    user_id=user_id,
                    personality=PersonalityEnum(personality_slug),
                )
                db.add(conv)
                db.commit()

            # Save user message
            user_msg_id = str(uuid.uuid4())
            db.add(DBMessage(
                id=user_msg_id,
                conversation_id=conversation_id,
                role="user",
                content=user_message,
                personality=PersonalityEnum(personality_slug),
                source=data.get("source", "text"),
            ))
            db.commit()
        except Exception as e:
            print(f"[WS] DB error saving message: {e}")
            db.rollback()
        finally:
            db.close()

        await sio.emit("typing", {"isTyping": True}, to=sid)

        full_response = ""
        try:
            async for token in ai_provider.chat_stream(messages, personality.system_prompt):
                full_response += token
                await sio.emit("token", {"token": token}, to=sid)

            # Save assistant response
            db = SessionLocal()
            try:
                db.add(DBMessage(
                    id=message_id,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_response,
                    personality=PersonalityEnum(personality_slug),
                    source="text",
                ))
                db.commit()
            except Exception as e:
                print(f"[WS] DB error saving response: {e}")
                db.rollback()
            finally:
                db.close()

            await sio.emit("message_done", {
                "content": full_response,
                "message_id": message_id,
                "conversation_id": conversation_id,
            }, to=sid)
        except Exception as e:
            print(f"[WS] AI streaming error: {e}")
            await sio.emit("error", {
                "code": "AI_ERROR",
                "message": str(e),
            }, to=sid)
        finally:
            await sio.emit("typing", {"isTyping": False}, to=sid)
