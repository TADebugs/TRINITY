# TRINITY API Contract

> **Single source of truth** for frontend and backend agents. Both agents MUST reference this file before writing any endpoint or API call.

---

## 1. Auth Header Convention

- All authenticated endpoints require: `Authorization: Bearer <jwt_token>`
- JWT payload: `{ sub: user_id, exp: timestamp }`
- WebSocket auth: passed via `auth: { token }` on Socket.IO connect

---

## 2. REST Endpoints

### Auth (`/api/auth`)

| Method | Path | Request Body | Response | Auth |
|--------|------|-------------|----------|------|
| POST | `/api/auth/register` | `{ email, display_name, password }` | `{ token, user: { id, name } }` | No |
| POST | `/api/auth/login` | Form: `username` (email), `password` | `{ access_token, token_type }` | No |
| GET | `/api/auth/me` | — | `{ id, email, display_name, created_at }` | Yes |

### Chat (`/api/chat`)

| Method | Path | Request Body | Response | Auth |
|--------|------|-------------|----------|------|
| POST | `/api/chat/send` | `{ message, personality, conversation_id?, history[] }` | StreamingResponse (text/plain) | Yes |

> **Note on REST vs WebSocket:** The frontend should **prefer WebSocket (`chat_message` event)** for all real-time chat — this is what continuous voice mode and typed input both use. The REST `POST /api/chat/send` exists as a **fallback** for environments where WebSocket is unavailable (e.g., degraded network, certain proxies). Both produce identical behavior. Frontend agent: default to WebSocket.

### Conversations (`/api/conversations`)

| Method | Path | Params | Response | Auth |
|--------|------|--------|----------|------|
| GET | `/api/conversations` | Query: `limit?` (default 20), `offset?` | `{ conversations: ConversationSummary[] }` | Yes |
| GET | `/api/conversations/:id` | — | `{ conversation: ConversationDetail }` | Yes |
| GET | `/api/conversations/:id/messages` | Query: `limit?` (default 50), `before?` (cursor) | `{ messages: Message[], has_more: boolean }` | Yes |
| DELETE | `/api/conversations/:id` | — | `{ success: true }` | Yes |

### Memory (`/api/memory`)

| Method | Path | Request Body / Params | Response | Auth |
|--------|------|----------------------|----------|------|
| GET | `/api/memory` | Query: `personality?` | `{ memories: MemoryEntry[] }` | Yes |
| GET | `/api/memory/:key` | Query: `personality?` | `{ key, value, scope }` | Yes |
| PUT | `/api/memory/:key` | `{ value, personality? }` | `{ success: true }` | Yes |

### Tools (`/api/tools`)

| Method | Path | Request Body | Response | Auth |
|--------|------|-------------|----------|------|
| POST | `/api/tools/execute` | `{ tool_name, params, personality }` | `{ task_id, status }` | Yes |
| GET | `/api/tools/status/:task_id` | — | `{ task_id, status, result?, error?, duration_ms? }` | Yes |
| GET | `/api/tools/available/:personality` | — | `{ enabled: string[], disabled: string[] }` | Yes |

> **Async tool execution:** `POST /api/tools/execute` returns immediately with a `task_id` and `status: "pending"`. The frontend polls `GET /api/tools/status/:task_id` for completion. For fast tools (web search), status may already be `"done"` on first poll. For slow tools (CAD generation, browser automation), the frontend polls every 2s until `status` is `"done"` or `"failed"`. Additionally, tool completion is pushed via Socket.IO `tool_result` event for clients connected via WebSocket.

### Health

| Method | Path | Response | Auth |
|--------|------|----------|------|
| GET | `/health` | `{ status: "ok", app: "TRINITY" }` | No |

---

## 3. WebSocket Events (Socket.IO)

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `chat_message` | `{ message, personality, history[], conversation_id? }` | Send a message to active personality |
| `switch_personality` | `{ personality: "aria"\|"echo"\|"nexus" }` | Request personality switch |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `token` | `{ token: string }` | Single streamed token from AI response |
| `message_done` | `{ content: string, message_id: string, conversation_id: string }` | Full response complete |
| `typing` | `{ isTyping: boolean }` | Typing indicator toggle |
| `personality_switched` | `{ personality, color, tagline }` | Confirms personality switch |
| `tool_result` | `{ task_id, status, result?, error?, duration_ms? }` | Async tool execution completed |
| `error` | `{ code: string, message: string }` | Error during processing |

---

## 4. Shared Types

```typescript
// ── Personality ──
type PersonalitySlug = "aria" | "echo" | "nexus"

// ── User ──
interface UserProfile {
  id: string
  email: string
  display_name: string
  created_at: string          // ISO 8601
}

// ── Message ──
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  personality: PersonalitySlug
  source: "voice" | "text"
  timestamp: number           // Unix ms
}

// ── Conversation ──
interface ConversationSummary {
  id: string
  personality: PersonalitySlug
  started_at: string          // ISO 8601
  ended_at: string | null
  summary: string | null      // compressed after 10+ messages
  message_count: number
}

interface ConversationDetail extends ConversationSummary {
  messages: Message[]
}

// ── Chat ──
interface ChatRequest {
  message: string
  personality: PersonalitySlug
  conversation_id?: string
  history: { role: string; content: string }[]
}

// ── Memory ──
interface MemoryEntry {
  key: string
  value: any
  scope: "personal" | "shared"
  personality: PersonalitySlug | null
  updated_at: string          // ISO 8601
}

// ── Tools ──
interface ToolRequest {
  tool_name: string
  params: Record<string, any>
  personality: PersonalitySlug
}

interface ToolStatus {
  task_id: string
  status: "pending" | "running" | "done" | "failed"
  result?: any
  error?: string
  duration_ms?: number
}

// ── Auth ──
interface RegisterRequest {
  email: string
  display_name: string
  password: string
}

interface AuthResponse {
  token: string
  user: { id: string; name: string }
}

interface LoginResponse {
  access_token: string
  token_type: "bearer"
}
```

---

## 5. Error Response Format (all endpoints)

```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

**Standard codes:** `UNAUTHORIZED`, `RATE_LIMITED`, `TOOL_PERMISSION_DENIED`, `INVALID_PERSONALITY`, `NOT_FOUND`, `VALIDATION_ERROR`, `TOOL_TIMEOUT`

---

## 6. Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/chat/send` | 20 req/min per IP |
| `/api/tools/execute` | 10 req/min per IP |
| All other endpoints | 60 req/min per IP |

---

## Verification Checklist

- [ ] Frontend `client.ts` and `types/index.ts` match shared types exactly
- [ ] Backend Pydantic schemas mirror the same shapes
- [ ] Both agents reference this file before writing any endpoint or API call
