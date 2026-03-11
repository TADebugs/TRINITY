# TRINITY

**Three AI Personalities. One Web Assistant.**

TRINITY is a web-based AI assistant featuring three distinct AI personalities — ARIA, ECHO, and NEXUS — that users can switch between in real time. Each personality is specialized for different workflows: productivity, creative work, and software development.

Built with Python (FastAPI + Socket.IO) on the backend and React (Vite + TypeScript) on the frontend. Uses Google Gemini 2.5 Flash for streaming AI responses, Web Speech API for voice input, and a Three.js animated orb that changes per personality.

---

## The Three Personalities

| Personality | Mode | Color | Focus |
|-------------|------|-------|-------|
| **ARIA** — Advanced Responsive Intelligence Assistant | Assistant Mode | Blue `#4A90D9` | Task completion, smart home control, web automation, calendar |
| **ECHO** — Enhanced Cognitive Helper & Orchestrator | Creative Mode | Purple `#9B59B6` | Brainstorming, CAD generation, image generation, creative writing |
| **NEXUS** — Network of eXecutable Unified Systems | Developer Mode | Green `#27AE60` | Code generation, terminal, git control, file operations |

### Switching Personalities

- **UI**: Click the personality selector dropdown in the top bar
- **WebSocket**: Emits `switch_personality` event for real-time switching

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Redis (local or Upstash)
- Google Gemini API key

### Installation

```bash
cd TRINITY

# Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add DATABASE_URL, GEMINI_API_KEY, REDIS_URL, SECRET_KEY

# Start backend
uvicorn app.main:socket_app --reload --port 8000

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — register an account and start chatting.

---

## Project Structure

```
TRINITY/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI + Socket.IO ASGI app
│   │   ├── config.py              # Pydantic settings from .env
│   │   ├── api/
│   │   │   ├── auth.py            # JWT register/login/me endpoints
│   │   │   ├── chat.py            # REST chat endpoint
│   │   │   ├── conversations.py   # Conversation CRUD
│   │   │   ├── memory.py          # Per-personality memory store
│   │   │   ├── tools.py           # Tool execution & availability
│   │   │   └── socket_events.py   # WebSocket streaming chat handler
│   │   ├── core/
│   │   │   ├── ai_provider.py     # Abstract AI interface
│   │   │   ├── gemini_provider.py # Gemini 2.5 Flash streaming
│   │   │   ├── memory_service.py  # Redis + DB hybrid memory
│   │   │   ├── personality_manager.py # YAML config loader
│   │   │   └── tool_router.py     # Permission-based tool routing
│   │   ├── db/
│   │   │   ├── database.py        # SQLAlchemy engine & sessions
│   │   │   ├── models.py          # User, Session, Conversation, Message, Memory, ToolExecution
│   │   │   └── schemas.py         # Pydantic request/response schemas
│   │   └── tools/
│   │       └── __init__.py        # 16 tool stubs (ready for implementation)
│   ├── personalities/             # YAML configs for ARIA, ECHO, NEXUS
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Root — auth gate + main layout
│   │   ├── api/client.ts          # Axios client with JWT interceptor
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts    # Socket.IO connection & event handlers
│   │   │   └── useVoice.ts        # Web Speech API voice input
│   │   ├── store/
│   │   │   ├── useAuthStore.ts    # JWT auth state (Zustand + persist)
│   │   │   ├── useChatStore.ts    # Messages, streaming, send via socket
│   │   │   └── usePersonalityStore.ts # Active personality & switching
│   │   └── components/
│   │       ├── auth/AuthScreen.tsx
│   │       ├── chat/ChatWindow.tsx
│   │       ├── chat/MessageBubble.tsx
│   │       ├── chat/InputBar.tsx
│   │       ├── chat/ToolResultCard.tsx
│   │       ├── personality/PersonalityOrb.tsx    # Three.js animated orb
│   │       ├── personality/PersonalitySelector.tsx
│   │       └── ui/StatusBar.tsx, Sidebar.tsx
│   ├── vite.config.ts             # Proxy /api + /socket.io → :8000
│   └── package.json
└── docs/
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              React + Vite (5173)             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Zustand  │  │ Three.js │  │ Web Speech│  │
│  │ Stores   │  │   Orb    │  │    API    │  │
│  └────┬─────┘  └──────────┘  └───────────┘  │
│       │  Socket.IO + REST (via Vite proxy)   │
└───────┼─────────────────────────────────────┘
        │
┌───────┼─────────────────────────────────────┐
│       FastAPI + Socket.IO (8000)             │
│  ┌────┴───────────────────────────────┐     │
│  │       Personality Manager          │     │
│  │   ARIA (blue) │ ECHO (purple) │ NEXUS (green) │
│  └───────┬───────────┬───────────┬────┘     │
│  ┌───────┴───────────┴───────────┴────┐     │
│  │    Gemini 2.5 Flash (streaming)    │     │
│  └────────────────────────────────────┘     │
│  ┌──────────────┐  ┌─────────────────┐      │
│  │ PostgreSQL   │  │  Redis Cache    │      │
│  │ (Supabase)   │  │  (Memory TTL)   │      │
│  └──────────────┘  └─────────────────┘      │
└─────────────────────────────────────────────┘
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (OAuth2 form) |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/:id/messages` | Get messages |
| DELETE | `/api/conversations/:id` | Delete conversation |
| GET | `/api/memory` | List memories |
| PUT | `/api/memory/:key` | Set memory |
| POST | `/api/tools/execute` | Execute tool |
| GET | `/api/tools/available/:personality` | List tools |
| GET | `/health` | Health check |

### WebSocket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `chat_message` | `{ message, personality, history, conversation_id }` |
| Client → Server | `switch_personality` | `{ personality }` |
| Server → Client | `token` | `{ token }` (streaming) |
| Server → Client | `message_done` | `{ content, message_id, conversation_id }` |
| Server → Client | `typing` | `{ isTyping }` |
| Server → Client | `error` | `{ code, message }` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, python-socketio, Uvicorn |
| Database | PostgreSQL (Supabase), SQLAlchemy 2.0 |
| Cache | Redis (memory TTL + Celery broker) |
| AI | Google Gemini 2.5 Flash (streaming) |
| Frontend | React 18, TypeScript, Vite 5 |
| State | Zustand (3 stores: auth, chat, personality) |
| Real-time | Socket.IO (client + server) |
| 3D | Three.js + @react-three/fiber |
| Voice | Web Speech API (browser-native) |
| Styling | Tailwind CSS 4, Framer Motion, Radix UI |
| Auth | JWT (python-jose + bcrypt) |

---

## Environment Variables

```env
APP_NAME=TRINITY
DEBUG=false
SECRET_KEY=<random-secret>
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379/0
GEMINI_API_KEY=<your-gemini-key>
ALLOWED_ORIGINS=["http://localhost:5173"]
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

## License

This project is for educational and portfolio purposes.

---

## Author

Built by Tanmay — 2nd year B.Tech Information Technology student.
