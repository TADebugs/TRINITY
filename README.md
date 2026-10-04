# TRINITY

TRINITY is an AI assistant with three switchable personalities: ARIA (productivity, sarcastic), ECHO (creative, dad jokes) and NEXUS (developer, dry nerd humor). Each personality is defined in a YAML file with its own system prompt, colour, wake word, local fallback model and tool permissions, so switching changes what the assistant is allowed to do as well as how it talks. The repo holds two versions: an earlier FastAPI + React web app that streams Gemini 2.5 Flash responses over Socket.IO, and a Tauri v2 (Rust) desktop app that is currently a scaffold. Built by Tanmay Desai, 2nd-year B.Tech IT student.

**Case study:** <https://tanmaydesai.xyz/trinity>

**Live demo:** there is none. TRINITY is a desktop app and the voice path uses paid Gemini audio, so it is not hosted publicly. The case study above has the write-up.

## Screenshots

The images below are the personality orb art already in this repo (`site/src/sprites/`). They are not screenshots of the running app.

| ARIA | ECHO | NEXUS |
|------|------|-------|
| <img src="site/src/sprites/ARIA.png" width="160" alt="ARIA orb"> | <img src="site/src/sprites/ECHO.png" width="160" alt="ECHO orb"> | <img src="site/src/sprites/NEXUS.png" width="160" alt="NEXUS orb"> |

<!-- PLACEHOLDER: screenshot of the web app chat window -->
<!-- PLACEHOLDER: screenshot of the desktop app -->

## The three personalities

From `web_app/backend/personalities/*.yaml` (the desktop app ships copies in `desktop_app/src-tauri/resources/personalities/`).

| | ARIA | ECHO | NEXUS |
|---|------|------|-------|
| Mode | Assistant | Creative | Developer |
| Colour | `#4A90D9` | `#9B59B6` | `#27AE60` |
| Humor | sarcastic | dad jokes | subtle nerd humor |
| Wake word | `aria` | `echo` | `nexus` |
| Local model (Ollama) | `phi3:mini` | `llama3.2:3b` | `phi3:mini` |
| Tools enabled | web_search, browser_automation, smart_home, calendar | brainstorm, cad_generation, image_generation, writing_assist, 3d_printer_control | code_generation, terminal, git_control, file_operations, web_search |
| Tools disabled | terminal, code_execution, cad_generation | terminal, browser_automation | smart_home, 3d_printer_control, cad_generation |

NEXUS's prompt says: never execute terminal commands directly, always propose the command and wait for confirmation.

## Stack

**Web version (`web_app/`)**, the working one:
- Backend: Python 3.11, FastAPI, python-socketio, Uvicorn, SQLAlchemy 2.0 on PostgreSQL, Redis, Celery, JWT auth (python-jose + passlib/bcrypt)
- AI: Google Gemini 2.5 Flash, streamed token by token
- Frontend: React 18, TypeScript, Vite, Zustand, Tailwind, Three.js orb, browser Web Speech API for voice input

**Desktop version (`desktop_app/`)**, early scaffold:
- Tauri v2 with a Rust backend (`tokio`, `reqwest`, `rusqlite`, `serde_yaml`), React 18 + Vite + Three.js frontend
- Cloud provider: Gemini. Local provider: Ollama at `localhost:11434`
- Both providers implement an `AiProvider` trait, but their `chat_stream` methods are `TODO` stubs and the `send_message` command does nothing yet. What exists: app boot, SQLite init, personality config loading, preferences, memory, conversation commands and an Ollama availability check. Details are in `docs/PHASE2_DESKTOP_APP.md`.

## Architecture

```
User (text / voice)
   -> React frontend (Zustand stores, Three.js orb, Web Speech API)
   -> Socket.IO `chat_message` { message, personality, history, conversation_id }
   -> FastAPI backend
        PersonalityManager  loads + caches the YAML config, supplies the system prompt
        ToolRouter          checks the personality's enabled/disabled tools before running a tool
        Gemini 2.5 Flash    streams tokens back as `token` events, then `message_done`
        PostgreSQL          persists messages; Redis for memory and Celery broker
```

- **PersonalityManager** (`web_app/backend/app/core/personality_manager.py`): loads `aria`/`echo`/`nexus` YAML into a `PersonalityConfig` and caches it. The system prompt is prepended to every request.
- **ToolRouter** (`web_app/backend/app/core/tool_router.py`): raises `ToolPermissionError` if a tool is in the personality's `disabled` list or not in its `enabled` list. The 16 tool handlers in `app/tools/__init__.py` are stubs that return `not_implemented`.
- **Per-personality tools:** the table above, enforced by ToolRouter.
- **Cloud + local fallback:** Gemini is the cloud model. Each YAML names a local Ollama model, and the desktop provider mode accepts `auto`, `cloud` or `local`. The automatic Gemini-to-Ollama switch is planned in `docs/PHASE2_DESKTOP_APP.md`, not implemented.
- **WakeWordDetector and per-personality voices:** the YAML has a `wake_word` field per personality, but there is no `WakeWordDetector` in the code, and `docs/FUTURE_CHANGES.md` lists wake-word detection as not implemented. The Gemini 2.5 native audio streaming, `WakeWordDetector` and Chirp 3 HD per-personality voices appear in Tanmay's CV description of the project, not in this repo. The desktop `AiProvider` trait has a `synthesize(text, voice)` method that returns "not implemented".
- **Switching personality:** UI selector, Cmd+1/2/3, or the Socket.IO `switch_personality` event.

## Run the web app

Needs Python 3.11+, Node 18+, a PostgreSQL database (Supabase works), Redis, and a Gemini API key.

```bash
# Backend (terminal 1)
cd web_app/backend
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
pip install bcrypt==4.0.1        # passlib breaks with bcrypt>=4.1
cp .env.example .env             # then fill it in, see below
uvicorn app.main:socket_app --reload --port 8000

# Frontend (terminal 2)
cd web_app/frontend
npm install
npm run dev                      # http://localhost:5173, proxies /api and /socket.io to :8000

# Celery worker (terminal 3, optional, async tool execution)
cd web_app/backend && celery -A celery_worker.celery_app worker --loglevel=info
```

`.env` keys (from `CLAUDE.md`): `APP_NAME`, `DEBUG`, `SECRET_KEY`, `DATABASE_URL` (URL-encode `@` in the password as `%40`), `REDIS_URL`, `GEMINI_API_KEY`, `ALLOWED_ORIGINS` (must be a JSON array, e.g. `["http://localhost:5173"]`), `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`.

The Gemini free tier has a daily request limit and returns 429 once it is used up.

I read these commands from the repo's files (`requirements.txt`, `package.json`, `celery_worker.py`, `CLAUDE.md`) but did not run the stack.

## Run the desktop app

```bash
cd desktop_app
npm install
npm run dev        # runs `tauri dev`; needs Rust and the Tauri v2 prerequisites
```

It opens a window, but chat is not wired up yet (see Stack). Not run here.

## Repo layout

```
web_app/backend/    FastAPI + Socket.IO server, personalities/*.yaml
web_app/frontend/   React + Vite client
desktop_app/        Tauri v2 + Rust app (scaffold)
site/               Marketing site (Vite + React)
docs/               Specs, build guide, roadmap
```

## License

No license file yet.
