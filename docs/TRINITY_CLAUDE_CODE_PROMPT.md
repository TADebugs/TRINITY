# TRINITY — Claude Code Scaffold Prompt
### Copy this entire prompt into Claude Code to generate the full project foundation

---

```
You are scaffolding the complete foundation for TRINITY — a multi-personality
AI desktop + web assistant. Your job is to create every file and folder listed
below, populate each with the correct starter code, install all dependencies,
and leave the project in a state where I can immediately start building
features on top without fixing structural issues.

Do not ask questions. Work through the entire structure top to bottom.
Create every file. If a file needs real starter code, write it. If it is a
placeholder, add a clear TODO comment so I know what goes there.

---

## PROJECT OVERVIEW

TRINITY has three AI personalities:
- ARIA (Assistant, #4A90D9) — web search, browser automation, smart home
- ECHO (Creative, #9B59B6) — CAD generation, 3D printing, brainstorming
- NEXUS (Developer, #27AE60) — code generation, terminal (with confirm gate), git

Voice interaction: continuous conversation mode — mic is always live when the
app is open. No wake words. Web Speech API handles STT. Personality switching
is done via keyboard shortcuts (Cmd+1/2/3) or UI clicks only.

---

## MONOREPO STRUCTURE — CREATE ALL OF THESE

```
TRINITY/
├── .env.example
├── .gitignore
├── README.md
│
├── backend/
│   ├── requirements.txt
│   ├── celery_worker.py
│   ├── Dockerfile
│   ├── Procfile
│   │
│   ├── personalities/
│   │   ├── aria.yaml
│   │   ├── echo.yaml
│   │   └── nexus.yaml
│   │
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/          (empty dir, add .gitkeep)
│   │
│   └── app/
│       ├── main.py
│       ├── config.py
│       │
│       ├── api/
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   ├── chat.py
│       │   ├── memory.py
│       │   ├── tools.py
│       │   └── socket_events.py
│       │
│       ├── core/
│       │   ├── __init__.py
│       │   ├── personality_manager.py
│       │   ├── ai_provider.py
│       │   ├── gemini_provider.py
│       │   ├── tool_router.py
│       │   └── memory_service.py
│       │
│       ├── db/
│       │   ├── __init__.py
│       │   ├── database.py
│       │   ├── models.py
│       │   └── schemas.py
│       │
│       └── tools/
│           ├── __init__.py
│           ├── web_search.py
│           ├── browser_automation.py
│           ├── code_gen.py
│           ├── terminal.py
│           └── smart_home.py
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       │
│       ├── types/
│       │   └── index.ts
│       │
│       ├── api/
│       │   └── client.ts
│       │
│       ├── store/
│       │   ├── usePersonalityStore.ts
│       │   ├── useChatStore.ts
│       │   └── useAuthStore.ts
│       │
│       ├── hooks/
│       │   ├── useVoice.ts
│       │   ├── useWebSocket.ts
│       │   └── useKeyboardShortcuts.ts
│       │
│       └── components/
│           ├── chat/
│           │   ├── ChatWindow.tsx
│           │   ├── MessageBubble.tsx
│           │   └── InputBar.tsx
│           ├── personality/
│           │   ├── PersonalitySelector.tsx
│           │   └── PersonalityOrb.tsx
│           └── ui/
│               ├── Sidebar.tsx
│               └── StatusBar.tsx
│
└── electron/
    ├── package.json
    ├── tsconfig.json
    ├── main.ts
    └── preload.ts
```

---

## FILE CONTENTS — IMPLEMENT EXACTLY AS SPECIFIED

### .gitignore
```
.env
.env.local
__pycache__/
*.pyc
venv/
.venv/
node_modules/
dist/
build/
out/
.vite/
electron/dist/
.DS_Store
*.pem
*.key
```

### .env.example
```
APP_NAME=TRINITY
DEBUG=false
SECRET_KEY=change-this-to-a-random-64-char-string

DATABASE_URL=postgresql://postgres:password@localhost:5432/trinity

REDIS_URL=redis://localhost:6379/0

GEMINI_API_KEY=your-gemini-api-key-here
AI_PROVIDER=gemini

ALLOWED_ORIGINS=http://localhost:5173,https://trinity.vercel.app

CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

### backend/requirements.txt
```
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

### backend/app/config.py
Pydantic BaseSettings class. Fields: APP_NAME, DEBUG, SECRET_KEY,
DATABASE_URL, REDIS_URL, GEMINI_API_KEY, AI_PROVIDER, ALLOWED_ORIGINS (list),
ACCESS_TOKEN_EXPIRE_MINUTES=1440, ALGORITHM="HS256",
CELERY_BROKER_URL, CELERY_RESULT_BACKEND. Reads from .env file.

### backend/app/main.py
FastAPI app with:
- SlowAPI rate limiter
- CORS middleware using settings.ALLOWED_ORIGINS
- Socket.IO AsyncServer mounted as ASGI app
- Routers: /api/auth, /api/chat, /api/memory, /api/tools
- startup event that calls create_tables()
- GET /health returns {"status": "ok", "app": "TRINITY"}

### backend/app/db/database.py
SQLAlchemy engine from DATABASE_URL. SessionLocal. Base. create_tables()
function that runs Base.metadata.create_all(). get_db() dependency.

### backend/app/db/models.py
SQLAlchemy models for these tables:
- User: id (UUID str PK), email (unique), display_name, hashed_password,
  face_hash (nullable), is_active (bool default True), created_at, last_seen
- Session: id, user_id (FK users), active_personality (enum: aria/echo/nexus,
  default aria), started_at, ended_at (nullable), device_type (default "web")
- Conversation: id, session_id (FK), personality (enum), started_at,
  ended_at (nullable), summary (nullable Text)
- Message: id, conversation_id (FK), role (user/assistant), content (Text),
  tokens_used (nullable int), latency_ms (nullable int), created_at
- Memory: id, user_id (FK), personality (enum, nullable — null means shared),
  scope (personal/shared default personal), key (str), value (JSON), updated_at
- ToolExecution: id, message_id (FK), personality (enum), tool_name,
  input_data (JSON nullable), output_data (JSON nullable),
  status (pending/running/done/failed), duration_ms (nullable), created_at

### backend/app/db/schemas.py
Pydantic v2 schemas (model_config = ConfigDict(from_attributes=True)) for:
- UserCreate, UserOut
- MessageCreate, MessageOut
- MemoryCreate, MemoryOut
- LoginRequest, TokenOut

### backend/personalities/aria.yaml
```yaml
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
  You can search the web, control smart home devices, and automate browsers.
  When you don't know something, say so with flair.
  Keep responses concise. Never break character.
tools:
  enabled:
    - web_search
    - browser_automation
    - smart_home
  disabled:
    - terminal
    - code_execution
    - cad_generation
```

### backend/personalities/echo.yaml
```yaml
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
  You are the undisputed champion of dad jokes — you sneak them in naturally.
  You help with brainstorming, design, CAD generation, and 3D printing.
  Never break character. Embrace the groan.
tools:
  enabled:
    - brainstorm
    - cad_generation
    - image_generation
    - writing_assist
  disabled:
    - terminal
    - browser_automation
```

### backend/personalities/nexus.yaml
```yaml
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
  Your humor is dry and nerdy — subtle references you never explain.
  You help with code generation, debugging, terminal commands, git.
  CRITICAL: Never execute terminal commands directly. Always propose
  the command first and wait for explicit user confirmation before running.
  Format all code in proper markdown code blocks with language specified.
tools:
  enabled:
    - code_generation
    - terminal
    - git_control
    - web_search
  disabled:
    - smart_home
    - cad_generation
```

### backend/app/core/personality_manager.py
PersonalityConfig dataclass with: name, slug, wake_word, color, accent,
tagline, humor_style, system_prompt, tools_enabled (list), tools_disabled (list).
PersonalityManager class with:
- _cache dict (class-level)
- load(slug) → reads YAML, caches, returns PersonalityConfig
- load_all() → returns dict of all three
- invalidate_cache() → clears _cache

### backend/app/core/ai_provider.py
Abstract base class AIProvider with abstract async methods:
- chat_stream(messages: list[dict], system_prompt: str) → AsyncGenerator[str, None]
- transcribe(audio_bytes: bytes) → str
- synthesize(text: str, voice: str) → bytes

### backend/app/core/gemini_provider.py
GeminiProvider(AIProvider) implementing all three methods using
google.generativeai. Model: "gemini-2.5-flash". Temperature 0.8,
max_output_tokens 2048. Singleton instance at bottom: ai_provider = GeminiProvider()

### backend/app/core/tool_router.py
ToolRouter class initialized with PersonalityConfig.
- check_permission(tool_name) raises ToolPermissionError if in disabled list
- async execute(tool_name, params) routes to correct tool module
- Terminal tool always requires params["user_confirmed"] == True

### backend/app/core/memory_service.py
MemoryService initialized with (db: Session, user_id: str).
Redis cache-aside pattern with 15-min TTL.
- get(key, personality=None) → checks Redis first, falls back to DB
- set(key, value, personality=None) → upserts to DB, updates Redis cache
Cache key format: memory:{user_id}:{personality or "shared"}:{key}

### backend/app/api/auth.py
FastAPI router with:
- POST /register → hashes password with bcrypt, creates User, returns JWT
- POST /login (OAuth2PasswordRequestForm) → verifies password, returns JWT
JWT creation uses python-jose with SECRET_KEY and ALGORITHM from settings.
Token expiry: ACCESS_TOKEN_EXPIRE_MINUTES.

### backend/app/api/chat.py
FastAPI router with:
- POST /send → rate limited 20/minute, accepts ChatRequest
  (message: str, personality: slug, conversation_id: str|None, history: list)
  streams response using StreamingResponse + ai_provider.chat_stream

### backend/app/api/socket_events.py
Socket.IO event handlers:
- connect: validates JWT from auth dict
- disconnect: log
- switch_personality: loads config, emits personality_switched back
- chat_message: streams tokens via emit("token"), emits message_done when done,
  wraps with typing true/false events

### backend/celery_worker.py
Celery app configured from settings. Two queues: "fast" and "slow".
JSON serializer (not pickle). Import app from app.main.

### backend/Dockerfile
Python 3.11-slim. WORKDIR /app. Copy requirements, pip install, copy app.
CMD uvicorn app.main:socket_app --host 0.0.0.0 --port 8000

### backend/Procfile
```
web: uvicorn app.main:socket_app --host 0.0.0.0 --port $PORT
worker: celery -A celery_worker worker --loglevel=info --queues=fast,slow
```

---

### frontend/package.json
Name: trinity-frontend. Scripts: dev, build, preview.
Dependencies: react@18, react-dom@18, react-router-dom, zustand,
socket.io-client, axios, three, framer-motion, lucide-react,
@radix-ui/react-dialog, @radix-ui/react-tooltip, clsx, tailwind-merge.
DevDependencies: typescript, vite, @vitejs/plugin-react, @tailwindcss/vite,
tailwindcss, @types/react, @types/react-dom, @types/three.

### frontend/vite.config.ts
Vite config with react() and tailwindcss() plugins. Path alias @ → ./src.
Dev server proxy: /api and /socket.io → http://localhost:8000

### frontend/tailwind.config.ts
Tailwind v4 config. Content: src/**/*.{ts,tsx}. No special plugins needed.

### frontend/src/types/index.ts
TypeScript types:
```typescript
export type PersonalityName = 'ARIA' | 'ECHO' | 'NEXUS'
export type PersonalitySlug = 'aria' | 'echo' | 'nexus'
export type MessageSource = 'voice' | 'text'
export type MessageRole = 'user' | 'assistant'

export interface PersonalityConfig {
  name: PersonalityName
  slug: PersonalitySlug
  color: string
  accent: string
  tagline: string
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  personality: PersonalityName
  source: MessageSource
  timestamp: number
  isStreaming?: boolean
}
```

### frontend/src/store/usePersonalityStore.ts
Zustand store with persist middleware. State: active (PersonalityName),
config (PersonalityConfig), isTransitioning (bool).
Actions: switchTo(name) — sets isTransitioning true for 400ms then switches,
setTransitioning(bool).
Hardcode all three personality configs (name, color, accent, tagline) inside
the store — no API call needed for this.

### frontend/src/store/useChatStore.ts
Zustand store. State: messages (Message[]), isTyping (bool),
conversationId (string|null).
Actions: addMessage(msg), appendToken(token), setTyping(bool),
sendMessage({content, personality, source}) — emits to WebSocket,
clearMessages().

### frontend/src/store/useAuthStore.ts
Zustand store with persist. State: token (string|null), user ({id, name}|null).
Actions: setAuth(token, user), clearAuth().

### frontend/src/api/client.ts
Axios instance with baseURL from import.meta.env.VITE_API_URL or "/api".
Request interceptor: attach Bearer token from useAuthStore if available.
Export typed functions: authApi.login, authApi.register.

### frontend/src/hooks/useVoice.ts
Continuous conversation hook using Web Speech API:
- SpeechRecognition in continuous mode, interimResults true
- On final result → calls sendMessage from useChatStore
- Live interim transcript exposed as `transcript` (shown in InputBar as ghost text)
- isMuted state, toggleMute() function
- isListening state
- Auto-restarts on onend unless isMuted
- On not-allowed error → sets isMuted true, logs warning

### frontend/src/hooks/useWebSocket.ts
Connects to Socket.IO with JWT auth from useAuthStore.
Listens for: token (append to streaming message), message_done (finalize),
typing (set isTyping), personality_switched (update store).
Exports: socket instance, isConnected bool.

### frontend/src/hooks/useKeyboardShortcuts.ts
useEffect hook that registers:
- Cmd+1 → switch to ARIA
- Cmd+2 → switch to ECHO
- Cmd+3 → switch to NEXUS
- Cmd+M → toggleMute (from useVoice)
Cleans up on unmount.

### frontend/src/App.tsx
Root component. Layout: Sidebar (left) + main area (PersonalitySelector top,
ChatWindow center, InputBar bottom) + StatusBar (bottom strip).
Initializes useWebSocket and useKeyboardShortcuts. Shows personality color as
CSS custom property on root element for theme-aware styling.

### frontend/src/components/chat/ChatWindow.tsx
Scrollable message list. Maps over messages from useChatStore.
Shows MessageBubble for each. Auto-scrolls to bottom on new message.
Shows typing indicator (three dots animation) when isTyping is true.

### frontend/src/components/chat/MessageBubble.tsx
Single message. User messages right-aligned, assistant messages left-aligned.
Assistant messages show personality name + color accent.
If message.isStreaming is true, show cursor blink at end of content.

### frontend/src/components/chat/InputBar.tsx
Text input + mic button + send button.
Shows live transcript from useVoice as ghost text in input when user speaks.
Pulsing colored dot in input when isListening and not isMuted.
Mic button toggles mute. Send button submits typed text.
Enter key also submits typed text.

### frontend/src/components/personality/PersonalitySelector.tsx
Three clickable cards: ARIA, ECHO, NEXUS.
Active personality card has colored border + glow matching personality.color.
Clicking a card calls switchTo(name) from usePersonalityStore.
Shows name, tagline, and keyboard hint (⌘1 / ⌘2 / ⌘3).

### frontend/src/components/personality/PersonalityOrb.tsx
Three.js canvas showing a glowing animated orb.
Orb color matches active personality.color.
On personality switch (isTransitioning), play a brief morph/pulse animation.
Keep it simple: IcosahedronGeometry + MeshStandardMaterial + point light.

### frontend/src/components/ui/Sidebar.tsx
Left sidebar. Shows: TRINITY logo/wordmark at top, conversation history list
(stubbed with placeholder items for now), settings link at bottom.

### frontend/src/components/ui/StatusBar.tsx
Bottom status strip. Shows: active personality name + colored dot,
connection status (connected/disconnected), mic status (live/muted).

---

### electron/package.json
Name: trinity-electron. Main: main.js (compiled from main.ts).
Scripts: dev (NODE_ENV=development electron .), build (electron-builder --mac).
DevDependencies: electron, electron-builder, typescript, ts-node.
electron-builder config: appId com.trinity.app, productName TRINITY,
mac target dmg, files [dist/**, preload.js].

### electron/main.ts
BrowserWindow with:
- width 1200, height 800, minWidth 800, minHeight 600
- titleBarStyle: "hiddenInset", vibrancy: "under-window" (macOS native look)
- webPreferences: nodeIntegration false, contextIsolation true, sandbox true,
  preload: path.join(__dirname, "preload.js")
In dev: loadURL("http://localhost:5173")
In prod: loadFile("../frontend/dist/index.html")
globalShortcut: Cmd+Shift+Space toggles window show/hide.
Cleans up shortcuts on will-quit. Handles activate for macOS dock click.

### electron/preload.ts
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  onPersonalitySwitch: (cb) → ipcRenderer.on listener,
  runCommand: (cmd) → ipcRenderer.invoke("run-command", cmd),
  getSystemInfo: () → ipcRenderer.invoke("get-system-info"),
})
Note: never expose raw ipcRenderer.

---

## AFTER CREATING ALL FILES, DO THE FOLLOWING:

1. Run `cd frontend && npm install` to install all frontend dependencies
2. Run `cd backend && python -m venv venv && source venv/bin/activate &&
   pip install -r requirements.txt` to set up the Python environment
3. Run `cd electron && npm install` to install Electron dependencies
4. Copy .env.example to .env with the comment "# Fill in your credentials"
5. Confirm the following work without errors:
   - `cd frontend && npm run dev` → React dev server starts on port 5173
   - `cd backend && uvicorn app.main:socket_app --reload --port 8000`
     → FastAPI starts, /health returns 200
6. Print a summary of every file created and flag any TODOs that need
   my attention before I start building features

---

## CRITICAL RULES

- Electron: nodeIntegration MUST be false, contextIsolation MUST be true
- No wake word logic anywhere — the app is in continuous conversation mode
  (mic always on, Web Speech API handles STT)
- Personality switching is keyboard (Cmd+1/2/3) and UI click ONLY
- All tools in backend/app/tools/ are stubs returning {"status": "not_implemented"}
  for now — they will be built later
- NEXUS terminal tool must always check params["user_confirmed"] == True
  before executing anything
- Celery serializer must be JSON — never pickle
- Database models must use UUID strings as primary keys (not integers)
- The project is a completely original build — this is a
  completely fresh build
```
