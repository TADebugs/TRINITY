from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.api import auth, chat, conversations, memory, tools
from app.api.socket_events import register_events
from app.db.database import create_tables

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Socket.IO server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.ALLOWED_ORIGINS,
)

# Register WebSocket event handlers
register_events(sio)

# FastAPI app
app = FastAPI(title="TRINITY API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])

# Mount Socket.IO as ASGI app wrapping FastAPI
socket_app = socketio.ASGIApp(sio, app)


@app.on_event("startup")
async def startup():
    create_tables()


@app.get("/health")
def health():
    return {"status": "ok", "app": "TRINITY"}
