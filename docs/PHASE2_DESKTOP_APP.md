# TRINITY Phase 2 — Desktop App Requirements & Architecture Plan

## Document Purpose

This is the full requirements specification for building TRINITY as a native macOS desktop application using **Tauri v2 + Ollama**. It covers every architectural decision, technical stack choice, migration path, and implementation detail needed to hand off to a developer or AI co-worker and have them build the app end-to-end without ambiguity.

---

## 1. Project Goals

### Primary Objectives
1. Package TRINITY as a native macOS `.app` bundle (~5-10MB, not 150MB Electron)
2. Run a local LLM via Ollama for **offline mode** and **API fallback** when Gemini quota is exhausted
3. Seamless switching between Gemini (cloud) and Ollama (local) — user should barely notice
4. Global hotkey activation (Cmd+Shift+Space) from anywhere in macOS
5. Menu bar tray icon with quick personality switching
6. Always-on-top floating window mode

### Non-Goals (for now)
- Windows/Linux builds (macOS first, cross-platform later)
- Replacing the web app (desktop app is a separate product)
- Custom model training or fine-tuning
- App Store distribution (direct download first)

---

## 2. Technical Stack

### Desktop Shell
| Component | Choice | Why |
|-----------|--------|-----|
| **Framework** | Tauri v2 (stable) | ~5MB bundle, Rust native layer, uses system WebView (WKWebView on macOS), first-class macOS support |
| **Frontend** | Existing React 18 + TypeScript + Vite | Drop-in — Tauri serves the Vite build as a WebView |
| **Native Layer** | Rust (Tauri commands) | System tray, global hotkeys, window management, file system access, process spawning |
| **IPC** | Tauri `invoke` + Events | Frontend calls Rust functions via `invoke()`, Rust pushes events to frontend |

### Local LLM
| Component | Choice | Why |
|-----------|--------|-----|
| **Runtime** | Ollama (with `keep_alive: 5m`) | Single binary, Metal GPU acceleration, OpenAI-compatible REST API at `localhost:11434`, 100+ models, auto-unloads after idle |
| **Default Model** | `phi3:mini` Q4 quantized (~1.8GB RAM) | Strong reasoning, low footprint, runs on 8GB Macs comfortably. Upgrade option: `llama3.2:3b` (~2GB) or `llama3.1:8b` (~4.7GB) for power users |
| **Model Management** | Ollama CLI via Tauri sidecar | Pull, list, delete models from within the app |
| **API Format** | OpenAI-compatible `/api/chat` | Streaming via NDJSON, nearly identical to existing Gemini streaming pattern |

### Backend (Embedded vs External)
| Option | Decision |
|--------|----------|
| **Embedded Python backend** | NO — too complex to bundle Python + deps in a Tauri app |
| **Keep external FastAPI** | YES for cloud mode — user runs backend separately or connects to hosted version |
| **Rust-native local backend** | YES — Tauri Rust layer handles local-only features directly (Ollama proxy, local DB, personality loading) |

### Architecture Mode: **Hybrid**
```
┌─────────────────────────────────────────────────┐
│                   TAURI APP                       │
│                                                   │
│  ┌──────────────┐    ┌────────────────────────┐  │
│  │  React UI    │◄──►│  Rust Native Layer     │  │
│  │  (WebView)   │    │                        │  │
│  │              │    │  • Ollama proxy         │  │
│  │  Same React  │    │  • SQLite local DB      │  │
│  │  components  │    │  • Personality YAML     │  │
│  │  as web app  │    │  • Global hotkeys       │  │
│  │              │    │  • System tray          │  │
│  │              │    │  • Window management    │  │
│  │              │    │  • File system access   │  │
│  └──────┬───────┘    └──────────┬─────────────┘  │
│         │                       │                 │
│         │  invoke() / events    │                 │
│         ▼                       ▼                 │
│  ┌──────────────────────────────────────────┐    │
│  │          Provider Router                   │    │
│  │                                            │    │
│  │  if (online && gemini_key && !rate_limited) │    │
│  │    → Gemini API (cloud)                    │    │
│  │  else                                      │    │
│  │    → Ollama (localhost:11434)              │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  ┌──────────────┐    ┌────────────────────────┐  │
│  │ Ollama       │    │  SQLite (local)         │  │
│  │ (sidecar)    │    │  • conversations        │  │
│  │              │    │  • messages              │  │
│  │ phi3:mini  │    │  • memories              │  │
│  │              │    │  • user prefs            │  │
│  └──────────────┘    └────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 3. Detailed Architecture

### 3.1 Provider Router (Core Decision Engine)

The provider router decides whether to use Gemini or Ollama for each request. Implemented in Rust as a Tauri command.

```
Decision tree:
1. Check network connectivity (reachability check)
2. If offline → Ollama
3. If online, check if GEMINI_API_KEY exists in local config
4. If no key → Ollama
5. If key exists, check rate limit status (track 429 responses)
6. If rate limited → Ollama (with toast: "Switched to local model")
7. If all good → Gemini API
8. If Gemini request fails mid-stream → attempt Ollama retry
```

**User override:** Settings toggle to force local-only or cloud-only mode.

### 3.2 Ollama Integration

**Lifecycle Management:**
- Tauri app manages Ollama as a **sidecar process** (bundled binary or detect system install)
- On app launch: check if Ollama is running → if not, start it
- On app quit: gracefully stop Ollama sidecar (if we started it)
- Health check: GET `http://localhost:11434/api/tags` every 30s

**First-Run Setup:**
1. App detects no Ollama installed → prompt to download (link to ollama.com) or bundle it
2. App detects Ollama but no model → auto-pull `phi3:mini` with progress UI
3. Show download progress bar (Ollama pull streams progress as JSON)
4. Store model preference in local config

**API Integration:**
```
POST http://localhost:11434/api/chat
{
  "model": "phi3:mini",
  "messages": [
    {"role": "system", "content": "<personality_system_prompt>"},
    {"role": "user", "content": "Hello ARIA"}
  ],
  "stream": true
}

Response (NDJSON stream):
{"message":{"role":"assistant","content":"Hey"},"done":false}
{"message":{"role":"assistant","content":" there"},"done":false}
{"message":{"role":"assistant","content":"!"},"done":true}
```

**Mapping to existing frontend:**
- Replace Socket.IO `token` events with Tauri event emissions from Rust
- Same Zustand store pattern: `appendToken()` → `finalizeStream()`
- The React components don't change — only the transport layer

### 3.3 Local Database (SQLite)

Replace PostgreSQL (cloud) with SQLite for local-first storage.

**Schema (mirrors existing PostgreSQL but simplified):**

```sql
-- No users table needed (single user, local app)
-- No sessions table needed (implicit)

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  personality TEXT NOT NULL,  -- 'aria' | 'echo' | 'nexus'
  title TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,          -- 'user' | 'assistant'
  content TEXT NOT NULL,
  personality TEXT,
  source TEXT DEFAULT 'text',  -- 'text' | 'voice'
  provider TEXT,               -- 'gemini' | 'ollama'
  model TEXT,                  -- 'gemini-2.5-flash' | 'phi3:mini' | 'llama3.1:8b'
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);

CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  personality TEXT,            -- null = shared across all
  key TEXT NOT NULL,
  value TEXT NOT NULL,         -- JSON string
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_memories_key ON memories(personality, key);

CREATE TABLE preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL           -- JSON string
);
```

**Two-tier storage — hard split between sensitive and non-sensitive data:**

**`tauri-plugin-store` (encrypted keychain) — secrets ONLY:**
- `gemini_api_key` — never touches SQLite, never logged, never serialized to JSON
- Any future API keys (ElevenLabs, SerpAPI, etc.)

**`preferences` table (SQLite) — non-sensitive prefs ONLY:**
- `preferred_model` (ollama model name)
- `provider_mode` ('auto' | 'cloud' | 'local')
- `theme` (personality colors, custom overrides)
- `window_mode` ('normal' | 'floating' | 'tray')
- `global_hotkey` (default: Cmd+Shift+Space)
- `ollama_url` (default: http://localhost:11434)

> **Rule:** If a value would be dangerous in a backup, screenshot, or crash log, it goes in the encrypted store. Everything else goes in SQLite. No exceptions, no "encrypted at rest" SQLite columns.

**ORM:** Use `rusqlite` in Rust (Tauri side) or `sql.js`/`better-sqlite3` via Tauri commands.

### 3.4 Personality System (Local)

Move personality YAML loading from Python backend to Rust:

```
App bundle contains:
  resources/
    personalities/
      aria.yaml
      echo.yaml
      nexus.yaml
```

**Rust reads YAML** → parses into `PersonalityConfig` struct → sends to frontend via Tauri events or `invoke` return values.

The system prompt from YAML gets prepended to every Ollama/Gemini request, same as the current Python backend.

**Per-personality local model** — each YAML now includes a `local_model` field:

```yaml
# aria.yaml
local_model: phi3:mini      # strong reasoning, task-oriented

# echo.yaml
local_model: llama3.2:3b    # better creative writing, conversational

# nexus.yaml
local_model: phi3:mini      # precise, good at code
```

The Rust provider reads `personality_config.local_model` — no if-statement, no
hardcoded mapping. Users can override this per-personality in Settings without
touching any code. The model name flows straight into the Ollama API request.

### 3.4.1 Cold-Start Loading State

When switching personalities with different local models (e.g., ARIA → ECHO),
the new model needs ~2-3s to load if it's not already in RAM. During this
window the app must not feel broken.

**Required UI behavior:**

1. User switches personality (Cmd+2, voice wake word, or UI click)
2. PersonalityOrb immediately transitions to ECHO's color/animation
3. If the model isn't loaded yet:
   - PersonalityOrb enters a **pulsing/breathing state** (slower, wider pulse)
   - A subtle label appears below the orb: "Loading model..."
   - InputBar is **not disabled** — user can type, message queues
4. First token arrives from Ollama → loading state resolves instantly
   - Orb returns to normal animation
   - Label disappears
   - Queued message starts streaming response
5. If model load fails (Ollama down, model deleted):
   - Orb shows error state (brief red flash)
   - Toast: "Couldn't load local model. Trying cloud..."
   - Provider router falls back to Gemini

**Why this matters:** In a continuous conversation app where the mic is always
live, a 2-3 second silence with no visual feedback feels broken. Users will
think TRINITY crashed. The pulsing orb bridges the gap.

### 3.5 Window Management

**Window Modes:**
1. **Normal** — standard resizable window (default)
2. **Floating** — always-on-top, compact mode (~400x600), semi-transparent background
3. **Tray only** — minimized to menu bar, click to open floating panel

**Global Hotkey:** Cmd+Shift+Space
- If app is hidden → show and focus
- If app is visible → hide
- Configurable in settings

**System Tray:**
- Tray icon: TRINITY logo (changes color based on active personality)
- Right-click menu:
  - Active personality indicator (colored dot)
  - Switch to ARIA / ECHO / NEXUS
  - Separator
  - Provider status: "Cloud (Gemini)" or "Local (llama3.1)"
  - Separator
  - Settings
  - Quit

### 3.6 Frontend Migration Path

**What stays the same:**
- All React components (ChatWindow, InputBar, MessageBubble, PersonalityOrb, etc.)
- Zustand stores (useAuthStore, useChatStore, usePersonalityStore)
- Tailwind styling
- Framer Motion animations
- Three.js orb

**What changes:**

| Current (Web) | Desktop (Tauri) |
|----------------|------------------|
| Socket.IO for chat streaming | Tauri `invoke` + event listeners |
| Axios for REST API | Tauri `invoke` commands |
| localStorage for persistence | SQLite via Tauri commands |
| Web Speech API for voice | Same (WebView supports it) OR native macOS speech recognition via Rust |
| JWT auth | Not needed (local app, single user) |
| `api/client.ts` | New `tauri/bridge.ts` |

**Critical: Zustand persist migration**

The existing stores (`useAuthStore`, `usePersonalityStore`) use Zustand's `persist` middleware which writes to `localStorage` under the hood. In Tauri's WebView, `localStorage` works but is ephemeral — it can be cleared on WebView updates and doesn't live in our SQLite DB.

We need a **custom Zustand storage adapter** that routes through Tauri invoke calls:

```typescript
// src/tauri/storage.ts
import { invoke } from '@tauri-apps/api/core'
import type { StateStorage } from 'zustand/middleware'

export const tauriStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await invoke<string | null>('get_preference', { key: name })
    } catch {
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await invoke('set_preference', { key: name, value })
  },
  removeItem: async (name: string): Promise<void> => {
    await invoke('delete_preference', { key: name })
  },
}
```

Then in each persisted store, swap the storage backend:

```typescript
// Before (web app)
persist(storeCreator, { name: 'trinity-personality' })

// After (desktop app)
persist(storeCreator, {
  name: 'trinity-personality',
  storage: createJSONStorage(() => tauriStorage),
})
```

> **If this adapter is missing**, the stores will silently fall back to
> localStorage, which works in dev but loses state after WebView updates
> in production builds. This is a subtle bug — the app appears to work
> until it doesn't. Wire this up in Phase 2b alongside the bridge.ts file.

**New file: `src/tauri/bridge.ts`**
```typescript
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

// Chat
export async function sendMessage(message: string, personality: string, history: Message[]) {
  return invoke('send_message', { message, personality, history })
}

// Listen for streaming tokens
export async function onToken(callback: (token: string) => void) {
  return listen<string>('chat_token', (event) => callback(event.payload))
}

export async function onMessageDone(callback: (data: { content: string, id: string }) => void) {
  return listen('message_done', (event) => callback(event.payload))
}

// Conversations
export async function listConversations() {
  return invoke<Conversation[]>('list_conversations')
}

export async function deleteConversation(id: string) {
  return invoke('delete_conversation', { id })
}

// Personality
export async function switchPersonality(name: string) {
  return invoke('switch_personality', { name })
}

export async function getPersonalityConfig(name: string) {
  return invoke<PersonalityConfig>('get_personality_config', { name })
}

// Provider
export async function getProviderStatus() {
  return invoke<{ mode: string, provider: string, model: string }>('get_provider_status')
}

export async function setProviderMode(mode: 'auto' | 'cloud' | 'local') {
  return invoke('set_provider_mode', { mode })
}

// Ollama
export async function listModels() {
  return invoke<OllamaModel[]>('list_ollama_models')
}

export async function pullModel(name: string) {
  return invoke('pull_ollama_model', { name })
}

export async function onPullProgress(callback: (progress: PullProgress) => void) {
  return listen('ollama_pull_progress', (event) => callback(event.payload))
}

// Settings
export async function getConfig(key: string) {
  return invoke<string>('get_config', { key })
}

export async function setConfig(key: string, value: string) {
  return invoke('set_config', { key, value })
}
```

### 3.7 Rust Commands (Tauri Backend)

**Directory structure:**
```
src-tauri/
├── Cargo.toml
├── tauri.conf.json
├── build.rs
├── icons/                      # App icons (.icns for macOS)
├── resources/
│   └── personalities/
│       ├── aria.yaml
│       ├── echo.yaml
│       └── nexus.yaml
├── src/
│   ├── main.rs                 # Tauri setup, plugin registration
│   ├── commands/
│   │   ├── mod.rs
│   │   ├── chat.rs             # send_message, stream handling
│   │   ├── conversations.rs    # CRUD for conversations table
│   │   ├── personality.rs      # YAML loading, switching
│   │   ├── provider.rs         # Router logic, Gemini/Ollama dispatch
│   │   ├── ollama.rs           # Ollama sidecar management, model ops
│   │   ├── config.rs           # Settings get/set
│   │   └── memory.rs           # Memory CRUD
│   ├── db/
│   │   ├── mod.rs
│   │   ├── migrations.rs       # Auto-run schema on first launch
│   │   └── models.rs           # Rust structs matching SQLite tables
│   ├── providers/
│   │   ├── mod.rs              # AiProvider trait
│   │   ├── gemini.rs           # Gemini API client (reqwest + streaming)
│   │   └── ollama.rs           # Ollama API client (reqwest + NDJSON)
│   ├── personality.rs          # PersonalityConfig struct, YAML parser
│   ├── tray.rs                 # System tray setup + menu
│   ├── hotkey.rs               # Global hotkey registration
│   └── window.rs               # Window modes, floating, show/hide
```

**Key Rust dependencies (Cargo.toml):**
```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon", "global-shortcut"] }
tauri-plugin-shell = "2"           # Sidecar process management
tauri-plugin-sql = "2"             # SQLite via plugin
tauri-plugin-store = "2"           # Encrypted key-value store
tauri-plugin-autostart = "2"       # Launch on login
tauri-plugin-updater = "2"         # Auto-updates
tauri-plugin-notification = "2"    # Native notifications
serde = { version = "1", features = ["derive"] }
serde_json = "1"
serde_yaml = "0.9"
reqwest = { version = "0.12", features = ["stream", "json"] }
tokio = { version = "1", features = ["full"] }
rusqlite = { version = "0.31", features = ["bundled"] }
uuid = { version = "1", features = ["v4"] }
chrono = "0.4"
futures = "0.3"
```

---

## 4. Rust Provider Trait

```rust
use async_trait::async_trait;
use tokio::sync::mpsc;

#[async_trait]
pub trait AiProvider: Send + Sync {
    /// Stream chat response tokens through the channel
    async fn chat_stream(
        &self,
        messages: Vec<ChatMessage>,
        system_prompt: &str,
        tx: mpsc::Sender<StreamEvent>,
    ) -> Result<(), ProviderError>;

    /// Speech-to-text. Default: unimplemented (WebView handles STT via Web Speech API).
    /// Override when adding native macOS speech recognition as fallback.
    async fn transcribe(&self, _audio: Vec<u8>) -> Result<String, ProviderError> {
        Err(ProviderError::NotImplemented("transcribe"))
    }

    /// Text-to-speech. Default: unimplemented.
    /// Override when adding native TTS (macOS NSSpeechSynthesizer or Gemini/ElevenLabs).
    async fn synthesize(&self, _text: &str, _voice: &str) -> Result<Vec<u8>, ProviderError> {
        Err(ProviderError::NotImplemented("synthesize"))
    }

    /// Get provider name for logging/display
    fn name(&self) -> &str;

    /// Check if provider is available right now
    async fn is_available(&self) -> bool;
}

// NOTE: transcribe/synthesize are default-implemented stubs so adding native
// macOS speech later won't be a breaking trait change. Implementations can
// override them one at a time without touching existing providers.

pub enum StreamEvent {
    Token(String),
    Done { content: String, tokens_used: Option<u32> },
    Error(String),
}

pub struct ChatMessage {
    pub role: String,       // "user" | "assistant" | "system"
    pub content: String,
}
```

**GeminiProvider** implements this trait using the Gemini REST API with reqwest streaming.
**OllamaProvider** implements this trait using the Ollama `/api/chat` endpoint with NDJSON parsing.

---

## 5. Chat Flow (Desktop)

```
1. User types message in InputBar
2. React calls: invoke('send_message', { message, personality, history })
3. Rust command:
   a. Load personality YAML → get system_prompt + local_model
   b. Provider router decides: Gemini or Ollama
   c. If Ollama → use personality_config.local_model (e.g., "phi3:mini" or "llama3.2:3b")
   d. Build messages array: [system, ...history, user_message]
   e. Call provider.chat_stream(messages, system_prompt, tx)
   e. For each token received:
      - Emit Tauri event: app.emit("chat_token", token)
      - Accumulate full response
   f. When stream completes:
      - Save user message to SQLite
      - Save assistant message to SQLite
      - Emit Tauri event: app.emit("message_done", { content, id, conversation_id })
4. Frontend:
   a. listen("chat_token") → useChatStore.appendToken()
   b. listen("message_done") → useChatStore.finalizeStream()
   c. UI updates reactively (same as current web app)
```

---

## 6. Ollama Sidecar Management

### Detection, Version Check & Installation
```
1. On app launch:
   - Check if `ollama` binary exists:
     a. System PATH: `which ollama`
     b. Default location: /usr/local/bin/ollama
     c. Homebrew: /opt/homebrew/bin/ollama
   - If found → check if running: GET localhost:11434/api/tags
   - If not found → show first-run setup screen

2. VERSION CHECK (critical — API changed between versions):
   - Run: `ollama --version` → parse semver
   - Minimum required: 0.3.0
   - If below minimum:
     → Show warning: "Your Ollama version (X.Y.Z) is outdated.
        TRINITY requires 0.3.0+. Please update at ollama.com/download"
     → [Update Ollama] button → open download page
     → [Continue anyway] button → proceed but log warnings
     → [Cloud only] button → skip Ollama
   - If version check fails (no --version flag = very old):
     → Treat as below minimum, same warning
   - Store detected version in memory for later API compatibility checks

   WHY: Silent failures from API mismatches between Ollama versions are
   extremely hard to debug. The /api/chat format, streaming behavior, and
   model naming all changed across versions. Catching this upfront saves
   hours of user frustration.

3. First-run setup screen (if not installed):
   - "TRINITY needs Ollama for offline AI"
   - [Download Ollama] button → open https://ollama.com/download
   - [I've installed it] button → re-check (includes version check)
   - [Skip — cloud only] button → set provider_mode = 'cloud'

4. After Ollama detected + version OK, check models:
   - GET localhost:11434/api/tags → list installed models
   - If no suitable model → prompt to download
   - Default: phi3:mini Q4 (~1.8GB download, ~1.8GB RAM)
   - Power option: llama3.1:8b (~4.7GB download, ~4.7GB RAM)
   - Show download progress bar
```

### Process Management
```rust
// On app start (if provider_mode != 'cloud')
fn ensure_ollama_running() {
    if !is_ollama_running() {
        // Start Ollama as background process
        Command::new("ollama")
            .arg("serve")
            .spawn()
            .expect("Failed to start Ollama");

        // Wait for it to be ready (poll /api/tags)
        wait_for_ollama(timeout: 10s);
    }
}

// On app quit
fn cleanup_ollama() {
    // Only kill if WE started it (not if user had it running)
    if self.started_ollama {
        kill_process(self.ollama_pid);
    }
}
```

### Memory Strategy: Lazy Load + Keep-Alive Timeout

The default model (phi3:mini Q4) uses ~1.8GB when loaded. To keep idle
RAM low, we use Ollama's `keep_alive` parameter:

```
Every Ollama chat request includes:
  "keep_alive": "5m"

This means:
  - Model stays in RAM for 5 minutes after last request
  - After 5 minutes idle → Ollama auto-unloads the model
  - Next message triggers a re-load (~2-3s cold start)
  - During active conversation → model stays hot, no delay
```

**Lazy load:** Don't pre-load the model on app launch. The model only
loads when the user sends their first local message. This means the app
launches at ~130MB and only jumps to ~1.9GB when actually chatting.

**User-facing:** Show a brief "Loading model..." indicator on first
message (and after idle timeout). After the first token arrives, the
indicator disappears and streaming feels normal.

**Configurable:** Settings panel has a keep-alive slider (1m / 5m / 30m / forever).
Power users who want instant responses can set "forever" and accept the RAM cost.

### Health Monitoring
- Background task: ping `localhost:11434` every 30 seconds
- Monitor model load state via `GET /api/ps` (shows loaded models + RAM)
- If Ollama dies unexpectedly → restart it
- If restart fails 3x → switch to cloud-only mode, notify user
- Status shown in system tray and settings panel

---

## 7. Settings Panel

New React component: `src/components/settings/SettingsPanel.tsx`

### Sections:

**General**
- Launch on login (toggle) → tauri-plugin-autostart
- Window mode: Normal / Floating / Tray only
- Global hotkey: Cmd+Shift+Space (configurable)

**AI Provider**
- Mode: Auto / Cloud only / Local only
- Gemini API key: input field (stored encrypted via tauri-plugin-store)
- Ollama model: dropdown (from installed models)
- [Pull new model] button
- [Test connection] button for both providers
- Status indicators: green/red dot for each provider

**Personalities**
- View/edit personality configs
- Custom system prompt overrides
- Per-personality model preference (e.g., use Gemini for ARIA, Ollama for NEXUS)

**Data**
- Conversation export (JSON)
- Clear all conversations
- Clear memories
- Database location: `~/Library/Application Support/com.trinity.app/trinity.db`

**About**
- Version number
- Check for updates (tauri-plugin-updater)
- Links: GitHub, docs, feedback
- **Memory usage breakdown** (always visible in About panel):
  ```
  Active (model loaded):
    TRINITY app:     ~80 MB
    Ollama runtime:  ~50 MB
    Loaded model:    ~1.8 GB (phi3:mini Q4)
    ─────────────────────────
    Total:           ~1.9 GB

  Idle (5min after last message):
    TRINITY app:     ~80 MB
    Ollama runtime:  ~50 MB
    Model:           unloaded (0 MB)
    ─────────────────────────
    Total:           ~130 MB
  ```
  The About panel shows this breakdown live (pull actual values from
  Ollama's `/api/ps` endpoint). Include a note: "The model loads into
  memory when you chat and unloads after 5 minutes of inactivity."
  System tray tooltip: `"TRINITY — Local AI (phi3:mini, idle)"`
  or `"TRINITY — Local AI (phi3:mini, ~1.9GB active)"`

---

## 8. macOS-Specific Features

### 8.1 Global Shortcut
```rust
use tauri_plugin_global_shortcut::GlobalShortcutExt;

app.plugin(
    tauri_plugin_global_shortcut::Builder::new()
        .with_shortcut("CmdOrCtrl+Shift+Space")?
        .with_handler(|app, shortcut, event| {
            if event.state == ShortcutState::Pressed {
                toggle_window_visibility(app);
            }
        })
        .build()
)?;
```

### 8.2 System Tray
```rust
let tray = TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&menu)
    .on_menu_event(|app, event| {
        match event.id.as_ref() {
            "aria" => switch_personality(app, "aria"),
            "echo" => switch_personality(app, "echo"),
            "nexus" => switch_personality(app, "nexus"),
            "settings" => show_settings(app),
            "quit" => app.exit(0),
            _ => {}
        }
    })
    .build(app)?;
```

### 8.3 App Bundle Structure
```
TRINITY.app/
├── Contents/
│   ├── Info.plist
│   ├── MacOS/
│   │   └── TRINITY              # Rust binary
│   ├── Resources/
│   │   ├── icon.icns
│   │   └── personalities/
│   │       ├── aria.yaml
│   │       ├── echo.yaml
│   │       └── nexus.yaml
│   └── Frameworks/
│       └── WebView.framework    # System WebView (linked, not bundled)
```

### 8.4 Native Notifications
- "Switched to local model" when Gemini fails
- "Model download complete" after Ollama pull
- "TRINITY is ready" on first launch setup complete
- Personality switch confirmation (subtle)

### 8.5 macOS Permissions
- **Microphone** — for voice input (Web Speech API in WebView)
- **Accessibility** — for global hotkey (if needed)
- **Network** — for Gemini API + Ollama (localhost)
- No camera, no file system (beyond app sandbox), no contacts

---

## 9. File System Layout (Runtime)

```
~/Library/Application Support/com.trinity.app/
├── trinity.db                  # SQLite database
├── config.json                 # Encrypted config (API keys, prefs)
└── logs/
    └── trinity.log             # App logs (rotated daily)

~/.ollama/                      # Ollama's own data directory
└── models/                     # Downloaded model weights
    └── manifests/
    └── blobs/
```

---

## 10. Build & Distribution

### Development Setup
```bash
# Prerequisites
brew install rust
curl -fsSL https://ollama.com/install.sh | sh

# Project setup
cd TRINITY
npx create-tauri-app desktop --template react-ts
# OR add Tauri to existing frontend:
cd frontend
npm install @tauri-apps/cli @tauri-apps/api
npx tauri init

# Development
npx tauri dev          # Hot-reload dev mode
npx tauri build        # Production .app bundle
```

### CI/CD (GitHub Actions)
```yaml
- Build on macOS runner (macos-latest)
- Sign with Apple Developer ID (codesign)
- Notarize with Apple (xcrun notarytool)
- Create DMG installer
- Upload to GitHub Releases
- Tauri updater JSON for auto-updates
```

### Distribution
1. **GitHub Releases** — DMG download (free, immediate)
2. **Homebrew Cask** — `brew install --cask trinity` (community)
3. **App Store** — later (requires sandbox compliance review)

### Auto-Updates
- tauri-plugin-updater checks GitHub Releases on launch
- Silent download, prompt to install
- Update manifest: `https://github.com/TADebugs/TRINITY/releases/latest/download/latest.json`

---

## 11. Migration Phases

### Phase 2a — Skeleton (Week 1)
- [ ] Initialize Tauri v2 in the TRINITY repo (`src-tauri/`)
- [ ] Configure tauri.conf.json (app name, identifier, window size, permissions)
- [ ] Get existing React frontend rendering in Tauri WebView
- [ ] Basic window management (resize, close, minimize)
- [ ] System tray icon (static)
- [ ] Global hotkey (Cmd+Shift+Space) to toggle window

### Phase 2b — Local Backend (Week 2)
- [ ] SQLite setup with rusqlite (create tables on first launch)
- [ ] Port personality YAML loading to Rust
- [ ] Implement Tauri commands: `list_conversations`, `delete_conversation`, `get_personality_config`
- [ ] Create `src/tauri/bridge.ts` — frontend adapter layer
- [ ] Replace Socket.IO transport with Tauri invoke/events
- [ ] Remove auth requirement (single user, local app)

### Phase 2c — Ollama Integration (Week 3)
- [ ] Ollama detection and health checking
- [ ] OllamaProvider implementing AiProvider trait
- [ ] Streaming chat via NDJSON parsing + Tauri event emission
- [ ] Model management UI (list, pull, delete)
- [ ] First-run setup flow (detect Ollama, download model)
- [ ] Provider status in system tray

### Phase 2d — Gemini + Provider Router (Week 4)
- [ ] GeminiProvider implementing AiProvider trait (reqwest + streaming)
- [ ] Provider router with auto-fallback logic
- [ ] API key storage (encrypted via tauri-plugin-store)
- [ ] Rate limit tracking (429 detection → auto-switch)
- [ ] Network connectivity monitoring
- [ ] Settings panel for provider configuration

### Phase 2e — Polish (Week 5)
- [ ] Floating window mode (always-on-top, compact)
- [ ] Dynamic tray icon (personality color)
- [ ] Native notifications
- [ ] Auto-updater setup
- [ ] DMG build + codesign
- [ ] Performance testing (memory, CPU, startup time)
- [ ] README + installation docs

---

## 12. Key Technical Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Desktop framework | Tauri v2 | 30x smaller than Electron, native macOS feel, Rust performance |
| Local LLM runtime | Ollama | Easiest integration, REST API, Metal acceleration, model marketplace |
| Default model | phi3:mini (Q4) | ~1.8GB RAM, strong reasoning, fits comfortably on 8GB Macs. Power users can switch to llama3.1:8b in settings |
| Local database | SQLite via rusqlite | No external service, single file, fast, perfect for local app |
| Config storage | tauri-plugin-store | Encrypted at rest, no plaintext API keys on disk |
| Backend embedding | No embedded Python | Too complex; Rust handles local ops, Python backend optional for cloud |
| Auth for desktop | Removed | Single-user local app doesn't need JWT/login |
| IPC pattern | invoke + events | Tauri native, type-safe with TypeScript bindings |
| Auto-updates | tauri-plugin-updater | GitHub Releases as update source, silent background downloads |
| Ollama management | Detect system install | Don't bundle Ollama binary — too large, version coupling |

---

## 13. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ollama not installed | User can't use offline mode | Clear first-run setup, link to download, cloud fallback |
| Model too large for user's Mac | Download fails or OOM | Offer phi3:mini (2.3GB) as lightweight option, detect available RAM |
| User thinks app uses 5GB RAM | Bug reports, uninstalls | Memory breakdown in About panel + tray tooltip showing model size is expected |
| Ollama version too old | Silent API failures, broken streaming | Version check on startup, minimum 0.3.0, clear update prompt |
| WebView speech API issues | Voice input broken | Fallback to macOS native speech recognition via Rust |
| Gemini API key exposed | Security risk | Encrypt via tauri-plugin-store, never log, never send to analytics |
| Tauri v2 breaking changes | Build breaks | Pin Tauri version, monitor changelog |
| Large SQLite database | Slow queries | Add indexes, implement conversation archiving/deletion |
| Ollama process crashes | Local AI unavailable | Auto-restart (3 attempts), then fall back to cloud |
| Apple notarization rejection | Can't distribute | Follow Apple guidelines, no private API usage |

---

## 14. Success Criteria

1. App launches in < 2 seconds on M1 MacBook Air
2. First token from Ollama in < 500ms (after model loaded)
3. Seamless Gemini → Ollama fallback (user sees a toast, no interruption)
4. Bundle size < 15MB (excluding Ollama + model)
5. Memory usage < 130MB idle (TRINITY + Ollama runtime, model unloaded after 5m keep-alive)
6. All existing web app features work in desktop (chat, personalities, voice, orb)
7. Global hotkey works from any app
8. System tray with personality switching works

---

## 15. Open Questions (Resolve Before Building)

1. **Bundle Ollama or require separate install?**
   - Recommendation: require separate install (keeps bundle small, user controls updates)

2. **Support Intel Macs?**
   - Ollama works on Intel but slower. Tauri supports both. Default: yes, but recommend Apple Silicon.

3. **Cloud backend connection?**
   - Should desktop app optionally connect to the FastAPI backend for full cloud features (tools, Celery tasks)?
   - Recommendation: yes, as an advanced option in settings

4. **Sync between web and desktop?**
   - Should conversations sync across web app and desktop?
   - Recommendation: Phase 3 feature, not Phase 2

5. **Custom personality creation?**
   - Should users create their own personalities in the desktop app?
   - Recommendation: Phase 3, keep ARIA/ECHO/NEXUS for now
