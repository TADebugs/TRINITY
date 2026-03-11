# TRINITY — Future Changes & Roadmap

## Priority 1: Critical Fixes

### Voice Input Flickering
- **File:** `frontend/src/hooks/useVoice.ts`
- **Problem:** Web Speech API `onend` fires on silence/network hiccups, triggering rapid restart loop (listen→stop→restart every 300ms) causing UI flicker
- **Fix:** Add `restartTimerRef` to debounce restarts, guard against overlapping instances with `if (recognitionRef.current) return`, increase restart delay to 800ms, clear pending timers in `stop()`

### Alembic Migrations
- **Problem:** Using `create_tables()` at startup — no migration history, schema changes require manual DB drops
- **Fix:** Initialize Alembic (`alembic init`), generate initial migration from existing models, use `alembic upgrade head` at startup instead of `create_all()`

### bcrypt Pinning
- **Problem:** passlib incompatible with bcrypt>=4.1, currently requires manual `pip install bcrypt==4.0.1`
- **Fix:** Pin `bcrypt==4.0.1` in `requirements.txt`, or migrate from passlib to direct bcrypt usage

### Error Display in UI
- Backend emits `error` events via Socket.IO but the frontend only logs to console
- Show user-facing error toasts using `react-hot-toast` (already installed)

### Upgrade Gemini API Plan
- Currently on free tier (limited requests/day for gemini-2.5-flash — will get 429 errors)
- Upgrade to paid plan or add fallback to secondary model (e.g., Gemini 2.0 Flash) when rate-limited
- Add exponential backoff retry logic for 429 responses

---

## Priority 2: Tool Implementation

### All 16 tools are stubs
- **File:** `backend/app/tools/__init__.py`
- **Current state:** Every tool returns `{"status": "not_implemented"}`

| Tool | Personality | Implementation Notes |
|------|-------------|---------------------|
| web_search | ARIA, NEXUS | SerpAPI, Tavily, or Google Custom Search |
| browser_automation | ARIA | Playwright async, headless Chrome |
| smart_home | ARIA | python-kasa for TP-Link devices |
| calendar | ARIA | Google Calendar API |
| brainstorm | ECHO | Gemini with creative prompts |
| cad_generation | ECHO | build123d library, output STEP/STL files |
| image_generation | ECHO | Gemini Imagen or external API |
| writing_assist | ECHO | Gemini with writing-focused prompts |
| 3d_printer_control | ECHO | Moonraker/OctoPrint REST API |
| code_generation | NEXUS | Gemini with code prompts, file writing |
| terminal | NEXUS | subprocess with sandboxing, require user confirmation |
| git_control | NEXUS | GitPython or subprocess git commands |
| file_operations | NEXUS | Read/write/list with path validation |

### Tool Result Streaming
- Currently tool results returned as single response
- Add Socket.IO `tool_progress` events with percentage updates

### Celery Integration
- `celery_worker.py` exists with fast (5s) and slow (2min) task queues
- Wire up long-running tool executions to Celery instead of running synchronously
- Useful for: web scraping, CAD generation, code execution

---

## Priority 3: Features

### Conversation Management
- **Per-personality conversations:** All personalities share one message list — add filtering by personality in ChatWindow or maintain separate conversation IDs per personality
- **Conversation titles:** Auto-generate summary from first message using Gemini
- **Search:** Full-text search across conversation history
- **Rename:** Add conversation rename capability in sidebar

### Voice Improvements
- **Wake word detection:** Infrastructure exists in personality YAML (`wake_word` field) but not implemented. Parse interim transcripts for "aria"/"echo"/"nexus" to auto-switch
- **Text-to-speech:** `synthesize()` in GeminiProvider raises NotImplementedError
  - Option 1: Browser `SpeechSynthesis` API (free, no backend)
  - Option 2: Gemini TTS or ElevenLabs on backend
- **Audio streaming to backend:** Currently frontend transcribes via Web Speech API. Add option to send raw audio for Gemini multimodal transcription

### Memory System
- **Backend:** Memory CRUD exists (`/api/memory`) with Redis (15-min TTL) + PostgreSQL hybrid — functional but untested
- **Enhancement:** Auto-extract facts from conversations, inject relevant memories into system prompt
- **Cross-personality memory:** Some shared (user preferences), others personality-specific
- **UI:** Add memory viewer/editor per personality in frontend

### Markdown Rendering
- `react-markdown` is installed but MessageBubble renders plain text
- Add markdown rendering for AI responses (code blocks, lists, bold, etc.)

### Authentication Improvements
- Add password reset flow
- Add `face_hash` authentication (model field exists, not implemented)
- Smoother login UX (currently uses OAuth2PasswordRequestForm)

### Personality Enhancements
- Per-personality TTS voice/accent
- Sound effects on personality switch
- Personality-specific UI themes beyond just color

---

## Priority 4: Infrastructure

### Electron Packaging
- Original design calls for macOS Electron desktop app
- **Tasks:**
  - Create Electron main process (`frontend/main/index.js`)
  - Global hotkey registration (Cmd+Shift+Space)
  - Menu bar tray icon
  - Always-on-top window mode
  - Package as .app bundle using electron-builder

### MediaPipe Integration
- Face recognition for passwordless auth (use `face_hash` field in User model)
- Hand gesture recognition for personality switching / UI control
- Requires camera access permission flow

### Error Handling & Logging
- Add global error boundary in React
- Replace `print()` with structured logging (Python `logging` module)
- Retry logic for Gemini API 429 errors with exponential backoff

### Testing
- No tests exist currently
- Backend: pytest with FastAPI TestClient, mock Gemini API responses
- Frontend: Vitest + React Testing Library for components
- Socket.IO: Integration tests for chat flow

### Performance
- Message pagination in ChatWindow (currently loads all messages)
- Virtual scrolling for long conversations
- Redis caching for conversation list queries

### Deployment
- **Frontend:** Deploy to Vercel (already in ALLOWED_ORIGINS)
- **Backend:** Dockerize, deploy to Railway/Fly.io/Render
- **Redis:** Managed Redis (Upstash/Railway) for production Celery
- **Database:** Supabase already cloud-hosted
- Add Docker Compose for local dev
- CI/CD pipeline for automated deploys

### Git Setup
- No git repo initialized yet
- Initialize with `git init`, create initial commit
- Set up GitHub repo, add branch protection on main

### Security
- Refresh token flow (currently only access tokens with 24h expiry)
- CSRF protection for REST endpoints
- Validate/sanitize tool inputs before execution
- Sandbox terminal tool execution (NEXUS) — never execute without user confirmation
- Rate limiting on Socket.IO events (chat_message) per user
