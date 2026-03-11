# TRINITY — Complete Build Guide
### Desktop + Web AI Assistant · Built From Scratch · No Legacy Dependencies

> **Who this is for:** You, Tanmay. This document is your single source of truth for building TRINITY end-to-end — fresh repo, clean architecture, built from scratch.

---

## Table of Contents

1. [What You're Building](#1-what-youre-building)
2. [Final Tech Stack](#2-final-tech-stack)
3. [Monorepo Setup](#3-monorepo-setup)
4. [Backend — FastAPI](#4-backend--fastapi)
5. [Frontend — React + Vite](#5-frontend--react--vite)
6. [Electron — Desktop Wrapper](#6-electron--desktop-wrapper)
7. [Personality System](#7-personality-system)
8. [AI Layer — Gemini Integration](#8-ai-layer--gemini-integration)
9. [Database Schema](#9-database-schema)
10. [Memory System](#10-memory-system)
11. [Tool Router](#11-tool-router)
12. [Wake Word Detection](#12-wake-word-detection)
13. [WebSocket & Real-Time Layer](#13-websocket--real-time-layer)
14. [Authentication](#14-authentication)
15. [Environment Variables](#15-environment-variables)
16. [Deployment](#16-deployment)
17. [Week-by-Week Build Order](#17-week-by-week-build-order)

---

## 1. What You're Building

**TRINITY** is a multi-personality AI assistant available as both a macOS desktop app and a web app.

| Personality | Trigger Word | Color | Mode | Humor |
|-------------|-------------|-------|------|-------|
| **ARIA** | "aria" | `#4A90D9` Blue | Assistant | Sarcastic & fun |
| **ECHO** | "echo" | `#9B59B6` Purple | Creative | Dad jokes |
| **NEXUS** | "nexus" | `#27AE60` Green | Developer | Subtle nerd jokes |

**Core features:**
- Voice-activated personality switching
- Persistent cross-personality memory
- ARIA: web search + browser automation
- ECHO: brainstorming + CAD generation
- NEXUS: code generation + terminal control
- Face authentication (optional)
- Desktop (Electron/macOS) + Web (Vercel)

---

## 2. Final Tech Stack

```
Frontend    React 18 + TypeScript + Vite + Tailwind CSS + Zustand + Three.js
Desktop     Electron 28 (wraps frontend)
Backend     Python 3.11 + FastAPI + Uvicorn
AI          Google Gemini 2.5 Flash (text + audio)
Database    PostgreSQL 15 (Supabase)
Cache       Redis 7 (Upstash)
Queue       Celery 5 + Redis broker
Auth        JWT (custom) + optional MediaPipe face auth
Deploy      Vercel (frontend) · Railway (backend) · Supabase (DB) · Upstash (Redis)
```

---

## 3. Monorepo Setup

### 3.1 Initialize fresh repository

```bash
mkdir TRINITY && cd TRINITY
git init
echo "# TRINITY" > README.md
```

### 3.2 Create folder structure

```
TRINITY/
├── backend/                  # FastAPI server
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── api/              # Route handlers
│   │   │   ├── chat.py
│   │   │   ├── auth.py
│   │   │   ├── memory.py
│   │   │   └── tools.py
│   │   ├── core/             # Business logic
│   │   │   ├── personality_manager.py
│   │   │   ├── tool_router.py
│   │   │   ├── ai_provider.py
│   │   │   └── memory_service.py
│   │   ├── db/               # Database layer
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   └── database.py
│   │   ├── tasks/            # Celery tasks
│   │   │   └── tool_tasks.py
│   │   └── config.py         # Settings
│   ├── personalities/        # YAML personality configs
│   │   ├── aria.yaml
│   │   ├── echo.yaml
│   │   └── nexus.yaml
│   ├── alembic/              # DB migrations
│   ├── requirements.txt
│   └── celery_worker.py
│
├── frontend/                 # React app (also loaded by Electron)
│   ├── src/
│   │   ├── main.tsx          # React entry
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   └── InputBar.tsx
│   │   │   ├── personality/
│   │   │   │   ├── PersonalitySelector.tsx
│   │   │   │   └── PersonalityOrb.tsx
│   │   │   └── ui/
│   │   │       ├── Sidebar.tsx
│   │   │       └── StatusBar.tsx
│   │   ├── store/            # Zustand global state
│   │   │   ├── usePersonalityStore.ts
│   │   │   ├── useChatStore.ts
│   │   │   └── useAuthStore.ts
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useVoice.ts
│   │   │   └── useWakeWord.ts
│   │   ├── api/              # API client
│   │   │   └── client.ts
│   │   └── types/
│   │       └── index.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── electron/                 # Desktop wrapper
│   ├── main.ts               # Electron main process
│   ├── preload.ts            # Context bridge (secure IPC)
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

### 3.3 .gitignore

```gitignore
# Environment
.env
.env.local
.env.*.local

# Python
__pycache__/
*.pyc
*.pyo
venv/
.venv/
*.egg-info/

# Node
node_modules/
dist/
build/
.vite/

# Electron
electron/dist/
out/

# macOS
.DS_Store
*.swp

# IDE
.vscode/
.idea/

# Secrets — never commit these
*.pem
*.key
secrets/
```

---

## 4. Backend — FastAPI

### 4.1 Python environment

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
```

### 4.2 requirements.txt

```txt
fastapi==0.111.0
uvicorn[standard]==0.29.0
python-socketio==5.11.2
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
redis==5.0.4
celery==5.4.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic-settings==2.2.1
pydantic==2.7.1
python-dotenv==1.0.1
google-generativeai==0.7.0
httpx==0.27.0
pyyaml==6.0.1
slowapi==0.1.9
python-multipart==0.0.9
```

```bash
pip install -r requirements.txt
```

### 4.3 config.py

```python
# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    APP_NAME: str = "TRINITY"
    DEBUG: bool = False
    SECRET_KEY: str

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # AI
    GEMINI_API_KEY: str

    # Auth
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "https://trinity.vercel.app"]

    class Config:
        env_file = ".env"

settings = Settings()
```

### 4.4 main.py

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.api import chat, auth, memory, tools
from app.db.database import create_tables

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Socket.IO
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.ALLOWED_ORIGINS
)

# FastAPI
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
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, app)

@app.on_event("startup")
async def startup():
    create_tables()

@app.get("/health")
def health():
    return {"status": "ok", "app": "TRINITY"}
```

### 4.5 Run backend

```bash
uvicorn app.main:socket_app --reload --port 8000
```

---

## 5. Frontend — React + Vite

### 5.1 Scaffold

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

### 5.2 Install dependencies

```bash
npm install \
  tailwindcss @tailwindcss/vite \
  zustand \
  socket.io-client \
  axios \
  three @types/three \
  framer-motion \
  lucide-react \
  react-router-dom \
  @radix-ui/react-dialog \
  @radix-ui/react-tooltip \
  clsx tailwind-merge
```

### 5.3 vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/socket.io': { target: 'http://localhost:8000', ws: true }
    }
  }
})
```

### 5.4 Zustand personality store

```typescript
// frontend/src/store/usePersonalityStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PersonalityName = 'ARIA' | 'ECHO' | 'NEXUS'

interface PersonalityConfig {
  name: PersonalityName
  color: string
  accentColor: string
  wakeWord: string
  tagline: string
}

const PERSONALITIES: Record<PersonalityName, PersonalityConfig> = {
  ARIA: { name: 'ARIA', color: '#4A90D9', accentColor: '#2563EB', wakeWord: 'aria', tagline: 'Assistant Mode' },
  ECHO: { name: 'ECHO', color: '#9B59B6', accentColor: '#7C3AED', wakeWord: 'echo', tagline: 'Creative Mode' },
  NEXUS: { name: 'NEXUS', color: '#27AE60', accentColor: '#16A34A', wakeWord: 'nexus', tagline: 'Developer Mode' },
}

interface PersonalityStore {
  active: PersonalityName
  config: PersonalityConfig
  isTransitioning: boolean
  switchTo: (name: PersonalityName) => void
  setTransitioning: (v: boolean) => void
}

export const usePersonalityStore = create<PersonalityStore>()(
  persist(
    (set) => ({
      active: 'ARIA',
      config: PERSONALITIES['ARIA'],
      isTransitioning: false,
      switchTo: (name) => {
        set({ isTransitioning: true })
        setTimeout(() => {
          set({ active: name, config: PERSONALITIES[name], isTransitioning: false })
        }, 400)
      },
      setTransitioning: (v) => set({ isTransitioning: v }),
    }),
    { name: 'trinity-personality' }
  )
)
```

### 5.5 WebSocket hook

```typescript
// frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useChatStore } from '@/store/useChatStore'

let socket: Socket | null = null

export function useWebSocket(token: string | null) {
  const addMessage = useChatStore((s) => s.addMessage)
  const setTyping = useChatStore((s) => s.setTyping)

  useEffect(() => {
    if (!token) return

    socket = io('/', {
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => console.log('[WS] connected'))
    socket.on('message', (data) => addMessage(data))
    socket.on('typing', (data) => setTyping(data.isTyping))
    socket.on('personality_switched', (data) => {
      console.log('[WS] personality switched to', data.personality)
    })

    return () => { socket?.disconnect(); socket = null }
  }, [token])

  return socket
}
```

### 5.6 Key UI components to build

```
PersonalityOrb.tsx      — 3D glowing sphere (Three.js) that changes color per personality
ChatWindow.tsx          — scrollable message list with streamed responses
InputBar.tsx            — text input + mic button + send
PersonalitySelector.tsx — three cards (ARIA / ECHO / NEXUS) with hover animations
StatusBar.tsx           — shows active personality + connection status
Sidebar.tsx             — conversation history, settings, memory explorer
```

---

## 6. Electron — Desktop Wrapper

### 6.1 Install

```bash
cd electron
npm init -y
npm install --save-dev electron electron-builder typescript ts-node
```

### 6.2 main.ts — CRITICAL security settings

```typescript
// electron/main.ts
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import path from 'path'

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',  // macOS native look
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      // ── SECURITY: these three are non-negotiable ──
      nodeIntegration: false,          // never true
      contextIsolation: true,          // always true
      sandbox: true,                   // always true
      // ─────────────────────────────────────────────
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Load frontend
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../frontend/dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  // Global hotkey: Cmd+Shift+Space to open TRINITY
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (win?.isVisible()) win.hide()
    else { win?.show(); win?.focus() }
  })
})

app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (!win) createWindow() })
```

### 6.3 preload.ts — Safe IPC bridge

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

// ONLY expose what the frontend actually needs
// Never expose raw ipcRenderer — that's a security hole
contextBridge.exposeInMainWorld('electronAPI', {
  onPersonalitySwitch: (cb: (name: string) => void) =>
    ipcRenderer.on('personality-switch', (_e, name) => cb(name)),

  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // NEXUS: terminal command (user confirmation required in UI before calling)
  runCommand: (cmd: string) => ipcRenderer.invoke('run-command', cmd),

  platform: process.platform,
})
```

---

## 7. Personality System

### 7.1 YAML config format

```yaml
# backend/personalities/aria.yaml
name: ARIA
slug: aria
wake_word: aria
color: "#4A90D9"
accent: "#2563EB"
tagline: "Assistant Mode"
humor_style: sarcastic
system_prompt: |
  You are ARIA, the assistant personality of TRINITY.
  You are sharp, witty, and unapologetically sarcastic — but always helpful.
  You throw in dry humor and playful jabs, never at the user's expense.
  You can search the web, control smart home devices, and automate the browser.
  When you don't know something, you say so with flair: "Believe it or not, I don't have that one memorized. Searching now..."
  Keep responses concise. Never break character.
tools:
  enabled:
    - web_search
    - browser_automation
    - smart_home
    - calendar
  disabled:
    - terminal
    - code_execution
    - cad_generation
```

```yaml
# backend/personalities/echo.yaml
name: ECHO
slug: echo
wake_word: echo
color: "#9B59B6"
accent: "#7C3AED"
tagline: "Creative Mode"
humor_style: dad_jokes
system_prompt: |
  You are ECHO, the creative personality of TRINITY.
  You are warm, imaginative, and deeply enthusiastic about making things.
  You are the undisputed champion of dad jokes — you sneak them in naturally and commit fully.
  Example: If asked about 3D printing, you might say "Let me layer on some ideas for you."
  You help with brainstorming, design, writing, CAD generation, and 3D printing.
  Never break character. Embrace the groan.
tools:
  enabled:
    - brainstorm
    - cad_generation
    - image_generation
    - writing_assist
    - 3d_printer_control
  disabled:
    - terminal
    - browser_automation
```

```yaml
# backend/personalities/nexus.yaml
name: NEXUS
slug: nexus
wake_word: nexus
color: "#27AE60"
accent: "#16A34A"
tagline: "Developer Mode"
humor_style: nerd_subtle
system_prompt: |
  You are NEXUS, the developer personality of TRINITY.
  You are precise, methodical, and deeply technical.
  Your humor is subtle — dry nerdy references that most people miss, and you never explain the joke.
  Example: you might say "That's O(n²). We don't do that here." without elaborating.
  You help with code generation, debugging, terminal commands, git, and system tasks.
  CRITICAL: Never execute terminal commands directly. Always propose the command and wait for user confirmation.
  Format all code in proper markdown code blocks with language specified.
tools:
  enabled:
    - code_generation
    - terminal
    - git_control
    - file_operations
    - web_search
  disabled:
    - smart_home
    - 3d_printer_control
    - cad_generation
```

### 7.2 PersonalityManager

```python
# backend/app/core/personality_manager.py
import yaml
import os
from functools import lru_cache
from dataclasses import dataclass
from typing import Literal

PersonalitySlug = Literal["aria", "echo", "nexus"]

@dataclass
class PersonalityConfig:
    name: str
    slug: str
    wake_word: str
    color: str
    accent: str
    tagline: str
    humor_style: str
    system_prompt: str
    tools_enabled: list[str]
    tools_disabled: list[str]

class PersonalityManager:
    _cache: dict[str, PersonalityConfig] = {}
    _config_dir = os.path.join(os.path.dirname(__file__), "../../personalities")

    @classmethod
    def load(cls, slug: PersonalitySlug) -> PersonalityConfig:
        if slug in cls._cache:
            return cls._cache[slug]

        path = os.path.join(cls._config_dir, f"{slug}.yaml")
        with open(path, "r") as f:
            raw = yaml.safe_load(f)

        config = PersonalityConfig(
            name=raw["name"],
            slug=raw["slug"],
            wake_word=raw["wake_word"],
            color=raw["color"],
            accent=raw["accent"],
            tagline=raw["tagline"],
            humor_style=raw["humor_style"],
            system_prompt=raw["system_prompt"].strip(),
            tools_enabled=raw["tools"]["enabled"],
            tools_disabled=raw["tools"]["disabled"],
        )
        cls._cache[slug] = config
        return config

    @classmethod
    def load_all(cls) -> dict[str, PersonalityConfig]:
        return {slug: cls.load(slug) for slug in ["aria", "echo", "nexus"]}

    @classmethod
    def invalidate_cache(cls):
        cls._cache.clear()
```

---

## 8. AI Layer — Gemini Integration

### 8.1 AIProvider abstraction (future-proof)

```python
# backend/app/core/ai_provider.py
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
```

### 8.2 Gemini implementation

```python
# backend/app/core/gemini_provider.py
import google.generativeai as genai
from app.core.ai_provider import AIProvider
from app.config import settings
from typing import AsyncGenerator

genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiProvider(AIProvider):
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config=genai.GenerationConfig(
                temperature=0.8,
                max_output_tokens=2048,
            )
        )

    async def chat_stream(
        self,
        messages: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        # Build history (exclude last user message — it's the prompt)
        history = []
        for msg in messages[:-1]:
            history.append({
                "role": "user" if msg["role"] == "user" else "model",
                "parts": [msg["content"]]
            })

        chat = self.model.start_chat(history=history)

        # Add system prompt to first message if history is empty
        prompt = messages[-1]["content"]
        if not history:
            prompt = f"{system_prompt}\n\n---\n\n{prompt}"

        response = await chat.send_message_async(prompt, stream=True)
        async for chunk in response:
            if chunk.text:
                yield chunk.text

    async def transcribe(self, audio_bytes: bytes) -> str:
        # Gemini audio transcription
        audio_part = {"mime_type": "audio/wav", "data": audio_bytes}
        response = self.model.generate_content(["Transcribe this audio:", audio_part])
        return response.text

    async def synthesize(self, text: str, voice: str = "default") -> bytes:
        # Placeholder — Gemini TTS integration goes here
        # For MVP: use gTTS or browser Web Speech API
        raise NotImplementedError("TTS not yet implemented")


# Singleton
ai_provider = GeminiProvider()
```

### 8.3 Chat API route

```python
# backend/app/api/chat.py
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.personality_manager import PersonalityManager, PersonalitySlug
from app.core.gemini_provider import ai_provider
from app.core.memory_service import MemoryService
from app.core.tool_router import ToolRouter
from app.db.schemas import MessageCreate

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

class ChatRequest(BaseModel):
    message: str
    personality: PersonalitySlug
    conversation_id: str | None = None
    history: list[dict] = []

@router.post("/send")
@limiter.limit("20/minute")
async def send_message(request: Request, body: ChatRequest):
    personality = PersonalityManager.load(body.personality)

    # Check tool permissions
    tool_router = ToolRouter(personality)

    # Build message list
    messages = body.history + [{"role": "user", "content": body.message}]

    # Stream response
    async def generate():
        async for token in ai_provider.chat_stream(
            messages=messages,
            system_prompt=personality.system_prompt,
        ):
            yield token

    return StreamingResponse(generate(), media_type="text/plain")
```

---

## 9. Database Schema

### 9.1 Alembic setup

```bash
cd backend
alembic init alembic
# Edit alembic/env.py to point to your DATABASE_URL and models
```

### 9.2 SQLAlchemy models

```python
# backend/app/db/models.py
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class PersonalityEnum(enum.Enum):
    aria = "aria"
    echo = "echo"
    nexus = "nexus"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)  # UUID
    email = Column(String, unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    face_hash = Column(String, nullable=True)   # bcrypt of face embedding
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    last_seen = Column(DateTime, onupdate=func.now())

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    active_personality = Column(Enum(PersonalityEnum), default=PersonalityEnum.aria)
    started_at = Column(DateTime, server_default=func.now())
    ended_at = Column(DateTime, nullable=True)
    device_type = Column(String, default="web")  # "desktop" or "web"

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    personality = Column(Enum(PersonalityEnum), nullable=False)
    started_at = Column(DateTime, server_default=func.now())
    ended_at = Column(DateTime, nullable=True)
    summary = Column(Text, nullable=True)   # compressed after 10+ messages
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)   # "user" or "assistant"
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    conversation = relationship("Conversation", back_populates="messages")

class Memory(Base):
    __tablename__ = "memories"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    personality = Column(Enum(PersonalityEnum), nullable=True)  # null = shared
    scope = Column(String, default="personal")   # "personal" or "shared"
    key = Column(String, nullable=False)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class ToolExecution(Base):
    __tablename__ = "tool_executions"
    id = Column(String, primary_key=True)
    message_id = Column(String, ForeignKey("messages.id"), nullable=False)
    personality = Column(Enum(PersonalityEnum), nullable=False)
    tool_name = Column(String, nullable=False)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    status = Column(String, default="pending")   # pending / running / done / failed
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
```

### 9.3 Critical indexes (run after migration)

```sql
-- Run these in Supabase SQL editor after first migration
CREATE INDEX idx_messages_conv_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_memories_user_key ON memories(user_id, key);
CREATE INDEX idx_sessions_user_active ON sessions(user_id) WHERE ended_at IS NULL;
CREATE INDEX idx_tool_exec_msg ON tool_executions(message_id, status);
```

---

## 10. Memory System

### 10.1 MemoryService with Redis cache

```python
# backend/app/core/memory_service.py
import json
import redis
from sqlalchemy.orm import Session as DBSession
from app.config import settings
from app.db.models import Memory
import uuid

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
CACHE_TTL = 900  # 15 minutes

class MemoryService:
    def __init__(self, db: DBSession, user_id: str):
        self.db = db
        self.user_id = user_id

    def _cache_key(self, personality: str | None, key: str) -> str:
        p = personality or "shared"
        return f"memory:{self.user_id}:{p}:{key}"

    def get(self, key: str, personality: str | None = None) -> dict | None:
        cache_key = self._cache_key(personality, key)

        # Try Redis first
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

        # Fall back to DB
        query = self.db.query(Memory).filter(
            Memory.user_id == self.user_id,
            Memory.key == key,
        )
        if personality:
            query = query.filter(Memory.personality == personality)
        else:
            query = query.filter(Memory.scope == "shared")

        mem = query.first()
        if mem:
            redis_client.setex(cache_key, CACHE_TTL, json.dumps(mem.value))
            return mem.value
        return None

    def set(self, key: str, value: dict, personality: str | None = None):
        scope = "personal" if personality else "shared"
        cache_key = self._cache_key(personality, key)

        # Upsert in DB
        mem = self.db.query(Memory).filter(
            Memory.user_id == self.user_id,
            Memory.key == key,
            Memory.personality == personality,
        ).first()

        if mem:
            mem.value = value
        else:
            mem = Memory(
                id=str(uuid.uuid4()),
                user_id=self.user_id,
                personality=personality,
                scope=scope,
                key=key,
                value=value,
            )
            self.db.add(mem)

        self.db.commit()

        # Update cache
        redis_client.setex(cache_key, CACHE_TTL, json.dumps(value))
```

---

## 11. Tool Router

```python
# backend/app/core/tool_router.py
from app.core.personality_manager import PersonalityConfig

class ToolPermissionError(Exception):
    pass

class ToolRouter:
    def __init__(self, personality: PersonalityConfig):
        self.personality = personality

    def check_permission(self, tool_name: str):
        if tool_name in self.personality.tools_disabled:
            raise ToolPermissionError(
                f"{self.personality.name} does not have access to '{tool_name}'. "
                f"Switch to the appropriate personality to use this tool."
            )
        if tool_name not in self.personality.tools_enabled:
            raise ToolPermissionError(f"Tool '{tool_name}' is not registered.")

    async def execute(self, tool_name: str, params: dict) -> dict:
        self.check_permission(tool_name)

        # Route to tool implementation
        match tool_name:
            case "web_search":
                from app.tools.web_search import run_web_search
                return await run_web_search(params)
            case "code_generation":
                from app.tools.code_gen import run_code_gen
                return await run_code_gen(params)
            case "terminal":
                # NEXUS only — always requires user confirm flag
                if not params.get("user_confirmed"):
                    raise ToolPermissionError("Terminal commands require explicit user confirmation.")
                from app.tools.terminal import run_terminal
                return await run_terminal(params)
            case _:
                raise ToolPermissionError(f"Tool '{tool_name}' has no implementation.")
```

---

## 12. Continuous Conversation Mode

> **Decision:** Wake word detection is skipped for MVP. When TRINITY is open,
> it is always in conversation mode. The mic activates automatically on app open
> and stays live. Personality switching is done via keyboard shortcuts or UI clicks only.
> Wake word support can be layered on in a future sprint.

### How it works

1. App opens → mic starts automatically (user grants permission once)
2. Web Speech API runs in continuous mode, transcribing everything
3. On sentence end (final result), transcript is sent to active personality via WebSocket
4. Response streams back token by token into the chat window
5. User can mute/unmute with `Cmd+M` or the mic button in the UI
6. Personality switching: `Cmd+1` / `Cmd+2` / `Cmd+3` or click the selector

### 12.1 useVoice hook — continuous STT

```typescript
// frontend/src/hooks/useVoice.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { usePersonalityStore } from '@/store/usePersonalityStore'

interface UseVoiceOptions {
  autoStart?: boolean   // start listening on mount (default: true)
}

export function useVoice({ autoStart = true }: UseVoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const activePersonality = usePersonalityStore((s) => s.active)

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR || isMuted) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      setIsListening(false)
      // Auto-restart unless muted or unmounted
      if (!isMuted) setTimeout(() => recognition.start(), 300)
    }

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      // Show live transcript in input bar as user speaks
      setTranscript(interim)

      // Final result → send to active personality
      if (final.trim()) {
        setTranscript('')
        sendMessage({
          content: final.trim(),
          personality: activePersonality,
          source: 'voice',
        })
      }
    }

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') {
        console.error('[Voice] Mic permission denied')
        setIsMuted(true)
      }
      // Other errors (network, aborted) → auto-retry handled by onend
    }

    recognition.start()
    recognitionRef.current = recognition
  }, [isMuted, activePersonality, sendMessage])

  const stop = useCallback(() => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setIsListening(false)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (prev) {
        // Unmuting — restart recognition
        setTimeout(start, 100)
      } else {
        stop()
      }
      return !prev
    })
  }, [start, stop])

  // Auto-start on mount
  useEffect(() => {
    if (autoStart) start()
    return () => stop()
  }, [autoStart]) // eslint-disable-line

  return { isListening, isMuted, transcript, toggleMute, start, stop }
}
```

### 12.2 InputBar — shows live transcript + send button

```typescript
// frontend/src/components/chat/InputBar.tsx
import { useVoice } from '@/hooks/useVoice'
import { Mic, MicOff, Send } from 'lucide-react'
import { useState } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { usePersonalityStore } from '@/store/usePersonalityStore'

export function InputBar() {
  const [textInput, setTextInput] = useState('')
  const { isListening, isMuted, transcript, toggleMute } = useVoice()
  const sendMessage = useChatStore((s) => s.sendMessage)
  const activePersonality = usePersonalityStore((s) => s.active)
  const config = usePersonalityStore((s) => s.config)

  const handleTextSend = () => {
    if (!textInput.trim()) return
    sendMessage({ content: textInput.trim(), personality: activePersonality, source: 'text' })
    setTextInput('')
  }

  return (
    <div className="flex items-center gap-3 p-4 border-t border-white/10 bg-black/20">
      {/* Live voice transcript shown as ghost text */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={textInput || transcript}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
          placeholder={isListening ? 'Listening...' : 'Type or speak...'}
          className="w-full bg-white/5 rounded-xl px-4 py-3 text-white placeholder-white/30
                     outline-none focus:ring-2 transition-all"
          style={{ '--tw-ring-color': config.color } as any}
        />
        {/* Pulsing dot when voice is active */}
        {isListening && !isMuted && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: config.color }} />
        )}
      </div>

      {/* Mute toggle */}
      <button onClick={toggleMute}
              className="p-3 rounded-xl transition-all hover:bg-white/10"
              title={isMuted ? 'Unmute (Cmd+M)' : 'Mute (Cmd+M)'}>
        {isMuted
          ? <MicOff size={20} className="text-red-400" />
          : <Mic size={20} style={{ color: config.color }} />}
      </button>

      {/* Send (for typed messages) */}
      <button onClick={handleTextSend}
              className="p-3 rounded-xl transition-all hover:bg-white/10">
        <Send size={20} style={{ color: config.color }} />
      </button>
    </div>
  )
}
```

### 12.3 Keyboard shortcut: Cmd+M for mute

```typescript
// Add to App.tsx or a useKeyboardShortcuts hook
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
      e.preventDefault()
      toggleMute()
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [toggleMute])
```

### 12.4 Voice state in useChatStore

```typescript
// Add to frontend/src/store/useChatStore.ts
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  personality: PersonalityName
  source: 'voice' | 'text'    // track how message was sent
  timestamp: number
}

interface SendMessageParams {
  content: string
  personality: PersonalityName
  source: 'voice' | 'text'
}

// sendMessage → emits to WebSocket → receives streamed tokens back
```

---

## 13. WebSocket & Real-Time Layer

### 13.1 Backend Socket.IO events

```python
# backend/app/api/socket_events.py
import socketio
from app.core.personality_manager import PersonalityManager
from app.core.gemini_provider import ai_provider

sio = socketio.AsyncServer(async_mode="asgi")

@sio.event
async def connect(sid, environ, auth):
    # Validate JWT token from auth dict
    token = auth.get("token") if auth else None
    if not token:
        raise socketio.exceptions.ConnectionRefusedError("Unauthorized")
    print(f"[WS] client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"[WS] client disconnected: {sid}")

@sio.event
async def switch_personality(sid, data):
    """Client requests personality switch."""
    personality_slug = data.get("personality")
    config = PersonalityManager.load(personality_slug)
    await sio.emit("personality_switched", {
        "personality": config.name,
        "color": config.color,
        "tagline": config.tagline,
    }, to=sid)

@sio.event
async def chat_message(sid, data):
    """Real-time streaming chat."""
    personality = PersonalityManager.load(data["personality"])
    messages = data.get("history", []) + [{"role": "user", "content": data["message"]}]

    await sio.emit("typing", {"isTyping": True}, to=sid)

    full_response = ""
    async for token in ai_provider.chat_stream(messages, personality.system_prompt):
        full_response += token
        await sio.emit("token", {"token": token}, to=sid)

    await sio.emit("message_done", {"content": full_response}, to=sid)
    await sio.emit("typing", {"isTyping": False}, to=sid)
```

---

## 14. Authentication

### 14.1 Auth routes

```python
# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import uuid

from app.config import settings
from app.db.database import get_db
from app.db.models import User

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RegisterRequest(BaseModel):
    email: str
    display_name: str
    password: str

def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        display_name=body.display_name,
        hashed_password=pwd_context.hash(body.password),
    )
    db.add(user)
    db.commit()
    return {"token": create_token(user.id), "user": {"id": user.id, "name": user.display_name}}

@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not pwd_context.verify(form.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    return {"access_token": create_token(user.id), "token_type": "bearer"}
```

---

## 15. Environment Variables

### .env.example

```bash
# ── App ─────────────────────────────────────
APP_NAME=TRINITY
DEBUG=false
SECRET_KEY=your-super-secret-key-change-this-in-production

# ── Database (Supabase) ──────────────────────
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# ── Redis (Upstash) ──────────────────────────
REDIS_URL=rediss://default:[password]@[endpoint].upstash.io:6379

# ── AI ──────────────────────────────────────
GEMINI_API_KEY=your-gemini-api-key
AI_PROVIDER=gemini           # swap to "openai" or "anthropic" to switch

# ── CORS ─────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:5173,https://trinity.vercel.app

# ── Celery ───────────────────────────────────
CELERY_BROKER_URL=${REDIS_URL}
CELERY_RESULT_BACKEND=${REDIS_URL}
```

---

## 16. Deployment

### 16.1 Backend — Railway

```bash
# Procfile (in backend/)
web: uvicorn app.main:socket_app --host 0.0.0.0 --port $PORT
worker: celery -A celery_worker worker --loglevel=info --queues=fast,slow
```

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:socket_app", "--host", "0.0.0.0", "--port", "8000"]
```

### 16.2 Frontend — Vercel

```json
// frontend/vercel.json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-railway-url.up.railway.app/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

```bash
cd frontend
npm run build
# Connect repo to Vercel, set VITE_API_URL env var in Vercel dashboard
```

### 16.3 Desktop — Build Electron app

```json
// electron/package.json (relevant section)
{
  "scripts": {
    "build": "electron-builder --mac",
    "dev": "NODE_ENV=development electron ."
  },
  "build": {
    "appId": "com.trinity.app",
    "productName": "TRINITY",
    "mac": {
      "category": "public.app-category.productivity",
      "target": "dmg"
    },
    "files": ["dist/**/*", "preload.js"]
  }
}
```

---

## 17. Week-by-Week Build Order

### Week 1 — Foundation
- [ ] Fresh repo init, folder structure, .gitignore
- [ ] Backend: FastAPI + Postgres + Alembic first migration
- [ ] `users`, `sessions`, `conversations`, `messages` tables live
- [ ] Auth routes: register + login working with JWT
- [ ] Frontend: Vite + React + Tailwind scaffold running on localhost:5173
- [ ] `/health` endpoint returns `{"status": "ok"}`

### Week 2 — Personality Core
- [ ] All 3 YAML configs written and loading via PersonalityManager
- [ ] `POST /api/chat/send` streaming plain text responses
- [ ] Zustand personality store + PersonalitySelector component
- [ ] Wake word detection hook working in browser
- [ ] Personality switch reflects in UI (color change, name change)

### Week 3 — Chat + Memory
- [ ] WebSocket real-time chat (token streaming via Socket.IO)
- [ ] ChatWindow + MessageBubble + InputBar components complete
- [ ] Memory table + MemoryService with Redis cache
- [ ] Conversation history persisted and loaded on page refresh

### Week 4 — Tools
- [ ] ToolRouter with permission checks per personality
- [ ] ARIA: web search tool (Serper or Tavily API)
- [ ] NEXUS: code generation + terminal (with confirm gate)
- [ ] Celery workers running for async tool execution

### Week 5 — Electron Desktop
- [ ] Electron wrapping frontend with security settings locked
- [ ] contextBridge preload — safe IPC only
- [ ] Global hotkey Cmd+Shift+Space working
- [ ] macOS vibrancy + hiddenInset titlebar
- [ ] Build a .dmg file successfully

### Week 6 — Polish + Deploy
- [ ] Deploy backend to Railway, connect Supabase + Upstash
- [ ] Deploy frontend to Vercel
- [ ] Environment variables set in both platforms
- [ ] End-to-end test: web user can sign up, chat with all 3 personalities
- [ ] Error boundaries in React, graceful degradation if backend is down

---

*TRINITY — Built clean. Built yours.*
