# Idea Voting Board — Backend Architecture Reference

## Folder Structure

```
api/
├── .env.example
├── .gitignore
├── package.json
└── src/
    ├── server.js              ← Entry point (HTTP + WS bootstrap)
    ├── app.js                 ← Express app (middleware pipeline)
    ├── config/
    │   ├── config.js          ← Centralised env-var validation & export
    │   └── db.js              ← MongoDB connection (no +srv)
    ├── models/
    │   ├── User.js            ← Schema + bcrypt hook + comparePassword
    │   ├── Idea.js            ← Schema + text index + virtual comments
    │   ├── Vote.js            ← Schema + compound unique index
    │   └── Comment.js         ← Schema
    ├── services/
    │   ├── auth.service.js    ← register, login, getMe
    │   ├── idea.service.js    ← CRUD, pagination, search, filter
    │   ├── vote.service.js    ← castVote (transaction), getUserVote
    │   └── comment.service.js ← addComment, deleteComment, list
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── idea.controller.js
    │   ├── vote.controller.js
    │   └── comment.controller.js
    ├── routes/
    │   ├── index.js           ← Root router (mounts all sub-routers)
    │   ├── auth.routes.js
    │   ├── idea.routes.js     ← Also nests /vote and /comments
    │   └── comment.routes.js  ← DELETE /api/comments/:id
    ├── middlewares/
    │   ├── auth.middleware.js      ← protect, restrictTo
    │   ├── error.middleware.js     ← globalErrorHandler
    │   ├── validate.middleware.js  ← Joi validation factory
    │   └── rateLimiter.middleware.js ← apiLimiter, authLimiter
    ├── validators/
    │   ├── auth.validator.js
    │   ├── idea.validator.js
    │   ├── vote.validator.js
    │   └── comment.validator.js
    ├── utils/
    │   ├── AppError.js        ← Custom operational error class
    │   ├── catchAsync.js      ← Async error wrapper
    │   ├── apiResponse.js     ← sendSuccess / sendError helpers
    │   └── jwt.js             ← signToken / verifyToken
    └── websocket/
        └── ws.manager.js      ← WebSocket server + broadcast + online tracking
```

---

## REST API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register (rate-limited: 10/15m) |
| POST | `/api/auth/login` | ❌ | Login → JWT (rate-limited: 10/15m) |
| GET | `/api/auth/me` | ✅ | Current user profile |
| GET | `/api/ideas` | ❌ | List ideas (paginated, sorted, filtered) |
| POST | `/api/ideas` | ✅ | Create idea |
| GET | `/api/ideas/:id` | ❌ | Get single idea with comments |
| PATCH | `/api/ideas/:id` | ✅ owner | Update idea |
| DELETE | `/api/ideas/:id` | ✅ owner | Delete idea |
| POST | `/api/ideas/:id/vote` | ✅ | Upvote / downvote / toggle |
| GET | `/api/ideas/:id/vote` | ✅ | My current vote on this idea |
| GET | `/api/ideas/:id/comments` | ❌ | List comments for idea |
| POST | `/api/ideas/:id/comments` | ✅ | Add comment |
| DELETE | `/api/comments/:commentId` | ✅ owner | Delete comment |
| GET | `/api/health` | ❌ | Health check |

### Query Parameters — `GET /api/ideas`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Results per page (max 50) |
| `sort` | string | `-date` | `votes`, `-votes`, `date`, `-date` |
| `search` | string | — | Full-text search on title + description |
| `tags` | string \| string[] | — | Filter by one or more tags |

---

## WebSocket Events

Connect: `ws://host/ws?token=<JWT>`

### Server → Client

| Event type | Trigger | Payload |
|------------|---------|---------|
| `CONNECTED` | On connection | `{ message, authenticated }` |
| `NEW_IDEA` | Idea created | Full idea object |
| `VOTE_UPDATE` | Vote cast/toggled | `{ ideaId, votesCount, voteState }` |
| `NEW_COMMENT` | Comment added | `{ ideaId, comment }` |
| `ONLINE_USERS` | User connects/disconnects | `{ count, userIds }` |
| `PONG` | Response to PING | `{ ts }` |

### Client → Server

| Event type | Description |
|------------|-------------|
| `PING` | Heartbeat — server responds with `PONG` |

---

## Data Model Relationships

```
User ──< Idea          (One-to-Many: author field)
Idea ──< Comment       (One-to-Many: idea field)
User ><  Idea          (Many-to-Many via Vote: user + idea + value)
```

### Vote Logic (castVote)

| State | Action | votesCount delta |
|-------|--------|-----------------|
| No existing vote | Create vote | `+value` |
| Same value re-voted | Delete vote (toggle off) | `-value` |
| Different value | Update vote value | `value × 2` |

All vote + votesCount changes run in a **MongoDB session transaction**.

---

## Security Layers

| Layer | Implementation |
|-------|---------------|
| Headers | `helmet` |
| CORS | `cors` — only `CLIENT_URL` from `.env` |
| Rate limiting | `express-rate-limit` — 100 req/15m (API), 10 req/15m (auth) |
| Input validation | `joi` via `validate.middleware.js` |
| NoSQL injection | `express-mongo-sanitize` |
| Password storage | `bcrypt` with `SALT_ROUNDS` from `.env` |
| Auth | Bearer JWT via `protect` middleware |
| Ownership | Service-layer author checks before mutations |
| Body size | `express.json({ limit: '10kb' })` |

---

## Environment Variables

```bash
PORT=5000
MONGO_URI=mongodb://user:pass@host:27017/ideaboard   # no +srv!
JWT_SECRET=<min 32 chars>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
SALT_ROUNDS=12
WS_PORT=                                              # empty = share HTTP port
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...
NODE_ENV=development
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in env
cp .env.example .env

# 3. Start dev server (hot-reload)
npm run dev

# 4. Production
npm start
```

> [!IMPORTANT]
> `MONGO_URI` must use the **standard** connection string format (`mongodb://...`), **not** the `+srv` variant, as required by the project spec.

> [!TIP]
> WebSocket clients should reconnect with exponential back-off and re-send their `?token=` on reconnect to stay in the online-users list.
