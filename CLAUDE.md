# CLAUDE.md — TRINITY Project Context

## What is this project?

TRINITY is a macOS AI assistant with three switchable personalities — ARIA (productivity/sarcastic), ECHO (creative/dad jokes), NEXUS (developer/nerd humor). FastAPI + Socket.IO backend, React + Vite frontend. Built by Tanmay, 2nd year B.Tech IT student.

## How to run

```bash
# Backend (terminal 1)
cd web_app/backend && source venv/bin/activate
uvicorn app.main:socket_app --reload --port 8000

# Frontend (terminal 2)
cd web_app/frontend && npm run dev

# Celery worker (terminal 3, optional — for async tool execution)
cd web_app/backend && celery -A celery_worker.celery_app worker --loglevel=info
```

Frontend: http://localhost:5173 → proxies /api and /socket.io to :8000

## Key Architecture

- **Socket.IO is the primary chat transport** — REST `/api/chat/stream` exists as fallback
- **Uvicorn must run `app.main:socket_app`** (not `app.main:app`) — wraps FastAPI with Socket.IO ASGI
- **Auth is JWT-based** — python-jose, passlib+bcrypt for hashing, token in localStorage `trinity-auth`
- **Zustand stores** are frontend source of truth: useChatStore, usePersonalityStore, useAuthStore (all persisted)
- **Web Speech API** for voice input — `useVoice.ts` handles continuous recognition with auto-restart
- **Three.js orb** in `PersonalityOrb.tsx` — each personality has unique animation (pulse/wave/digital)

### Communication Flow
1. Frontend `sendMessage()` emits `chat_message` via Socket.IO: `{ message, personality, history, conversation_id }`
2. Backend loads personality YAML → gets system_prompt
3. System prompt always prepended to user message (every request, not just first)
4. Gemini streams tokens → emitted as `token` events → finalized with `message_done`
5. User + assistant messages persisted to PostgreSQL in socket_events.py

### Personality System
- YAML configs in `web_app/backend/personalities/{aria,echo,nexus}.yaml`
- Fields: name, slug, wake_word, color, accent, tagline, humor_style, system_prompt, tools enabled/disabled
- `PersonalityManager` loads and caches configs (classmethod pattern)
- Switching: voice wake words, Cmd+1/2/3, UI selector, Socket.IO `switch_personality` event
- Colors: ARIA=#4A90D9, ECHO=#9B59B6, NEXUS=#27AE60

## Database

- PostgreSQL via Supabase (connection string in `.env`)
- SQLAlchemy 2.0 with `Base.metadata.create_all()` at startup (no Alembic migrations yet)
- Models: User, Session, Conversation, Message, Memory, ToolExecution
- **Important**: Conversation requires valid `session_id` FK → Session row auto-created in socket_events.py
- Message tracks: role, content, personality, source (voice/text), tokens_used, latency_ms

## .env Format (web_app/backend/.env)
```
APP_NAME=TRINITY
DEBUG=true
SECRET_KEY=<random-key>
DATABASE_URL=postgresql://user:pass@host:5432/dbname   # URL-encode @ as %40 in password
REDIS_URL=redis://localhost:6379/0
GEMINI_API_KEY=<key>
ALLOWED_ORIGINS=["http://localhost:5173"]               # MUST be JSON array for pydantic list[str]
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## Known Gotchas

- **ALLOWED_ORIGINS** must be JSON array in .env — pydantic-settings parses `list[str]` as JSON
- **DATABASE_URL** password with `@` must be URL-encoded as `%40`
- **bcrypt**: pin to 4.0.1 (`pip install bcrypt==4.0.1`) — passlib incompatible with bcrypt>=4.1
- **Gemini free tier**: limited requests/day for gemini-2.5-flash — will get 429 errors after limit
- `socket_events.py` creates Session rows on-the-fly (keyed by `user_id`) to satisfy FK constraint
- `useVoice.ts` uses `intentionalStopRef` to prevent UI flicker during auto-restarts — don't remove it
- Flex containers in `App.tsx` need `min-h-0` for chat scroll to work (nested flexbox quirk)
- All 16 tools in `web_app/backend/app/tools/__init__.py` are stubs returning `{"status": "not_implemented"}`
- No git repo initialized yet

## File Layout

```
web_app/backend/app/main.py              — FastAPI app + Socket.IO setup, entry: socket_app
web_app/backend/app/config.py            — Pydantic Settings, reads .env
web_app/backend/app/api/auth.py          — Register, login, JWT (create_token, verify_token, get_current_user)
web_app/backend/app/api/chat.py          — REST /api/chat/stream (rate limited 20/min)
web_app/backend/app/api/conversations.py — /api/conversations CRUD with pagination
web_app/backend/app/api/memory.py        — /api/memory per-personality key-value store
web_app/backend/app/api/tools.py         — /api/tools/execute + status polling
web_app/backend/app/api/socket_events.py — WebSocket: chat_message, switch_personality, connect/disconnect
web_app/backend/app/core/ai_provider.py  — Abstract AIProvider base class
web_app/backend/app/core/gemini_provider.py — Gemini 2.5 Flash: chat_stream, transcribe (singleton: ai_provider)
web_app/backend/app/core/personality_manager.py — YAML loader + cache for PersonalityConfig
web_app/backend/app/db/database.py       — Engine, SessionLocal, get_db dependency, create_tables
web_app/backend/app/db/models.py         — User, Session, Conversation, Message, Memory, ToolExecution
web_app/backend/app/db/schemas.py        — Pydantic request/response models
web_app/backend/app/tasks/tool_tasks.py  — Celery: fast queue (5s) and slow queue (2min)
web_app/backend/app/tools/__init__.py    — TOOL_REGISTRY with 16 stub handlers
web_app/backend/personalities/*.yaml     — ARIA, ECHO, NEXUS personality definitions
web_app/backend/celery_worker.py         — Celery config with redis broker

web_app/frontend/src/App.tsx             — Root layout, auth gate, sidebar/chat/orb composition
web_app/frontend/src/api/client.ts       — Axios instance, /api base, JWT interceptor from localStorage
web_app/frontend/src/hooks/useVoice.ts   — Web Speech API continuous recognition + auto-restart
web_app/frontend/src/hooks/useWebSocket.ts — Socket.IO client, token/message_done/typing/error events
web_app/frontend/src/hooks/useKeyboardShortcuts.ts — Cmd+M mute, Cmd+1/2/3 personality switch
web_app/frontend/src/store/useChatStore.ts     — Messages, streaming, sendMessage emits via socket
web_app/frontend/src/store/usePersonalityStore.ts — Active personality config, persisted localStorage
web_app/frontend/src/store/useAuthStore.ts     — Token, user, login/register/logout, persisted
web_app/frontend/src/components/auth/AuthScreen.tsx — Login/register form
web_app/frontend/src/components/chat/ChatWindow.tsx — Message list + streaming + typing dots
web_app/frontend/src/components/chat/InputBar.tsx   — Text + voice input + send
web_app/frontend/src/components/chat/MessageBubble.tsx — User/assistant message styling
web_app/frontend/src/components/chat/ToolResultCard.tsx — Tool execution status display
web_app/frontend/src/components/personality/PersonalityOrb.tsx — Three.js 3D orb per personality
web_app/frontend/src/components/personality/PersonalitySelector.tsx — Cmd+1/2/3 switcher UI
web_app/frontend/src/components/ui/Sidebar.tsx    — Conversation list, new chat, delete
web_app/frontend/src/components/ui/StatusBar.tsx  — Voice/connection status indicators
web_app/frontend/src/types/index.ts      — All TypeScript interfaces and type aliases
```

## Code Style

- Backend: Python 3.11, snake_case, FastAPI dependency injection, no type stubs needed
- Frontend: TypeScript strict, React functional components, Zustand for state, Tailwind v4 for styling
- Desktop app (Tauri v2 + Ollama) lives in `desktop_app/`, web app in `web_app/`, marketing site in `site/`
- Personality YAML files define system prompts, tool permissions, colors, humor styles
