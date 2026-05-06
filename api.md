# Idea Voting Board API and WebSocket Contract

## 1. Runtime basics

- HTTP API prefix: `process.env.API_PREFIX` (default `/api`)
- WebSocket path: `process.env.WS_PATH` (default `/ws`)
- CORS origin: `process.env.CLIENT_URL`
- JSON body size limit: `process.env.BODY_LIMIT` (default `10kb`)

## 2. Common HTTP response formats

### Success format

```json
{
  "status": "success",
  "message": "Human readable message",
  "data": {},
  "meta": {}
}
```

- `data` is omitted when not provided.
- `meta` is omitted when not provided.

### Error format

Production (`NODE_ENV=production`):

```json
{
  "status": "fail|error",
  "message": "Operational error message"
}
```

Development (`NODE_ENV=development`) includes debug fields:

```json
{
  "status": "fail|error",
  "message": "Error message",
  "stack": "...",
  "error": {}
}
```

## 3. Authentication

- Auth type: Bearer JWT
- Header: `Authorization: Bearer <token>`
- JWT payload uses `sub` = user id
- Missing/invalid/expired token returns `401`

## 4. Validation and rate limiting

- Validation errors return `422` with joined Joi messages.
- Global API rate limit on `API_PREFIX`:
  - `RATE_LIMIT_WINDOW_MS`
  - `RATE_LIMIT_MAX`
- Auth routes also have stricter limiter:
  - `AUTH_RATE_LIMIT_MAX`

## 5. Data shapes used in responses

### Public user

```json
{
  "id": "userId",
  "username": "name",
  "email": "user@email.com",
  "avatarUrl": "",
  "role": "user",
  "createdAt": "ISO_DATE"
}
```

### Idea (populated author)

```json
{
  "_id": "ideaId",
  "title": "Idea title",
  "description": "Idea description",
  "author": {
    "_id": "userId",
    "username": "name",
    "avatarUrl": ""
  },
  "votesCount": 0,
  "tags": ["tag1", "tag2"],
  "createdAt": "ISO_DATE",
  "updatedAt": "ISO_DATE"
}
```

### Comment (populated author)

```json
{
  "_id": "commentId",
  "content": "text",
  "author": {
    "_id": "userId",
    "username": "name",
    "avatarUrl": ""
  },
  "idea": "ideaId",
  "createdAt": "ISO_DATE",
  "updatedAt": "ISO_DATE"
}
```

## 6. HTTP endpoints

Base shown below assumes `API_PREFIX=/api`.

---

### `GET /api/health`

- Public health check.

Response `200`:

```json
{
  "status": "ok",
  "timestamp": "ISO_DATE"
}
```

---

### `POST /api/auth/register`

Request body:

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "StrongPass1"
}
```

Validation:
- `username`: 3-30, regex `^[a-zA-Z0-9_]+$`
- `email`: valid format
- `password`: 8-72, must include uppercase/lowercase/number

Logic:
- Checks unique by `email` or `username`.
- Hashes password with bcrypt (`SALT_ROUNDS`).
- Returns JWT and public user profile.

Response `201`:

```json
{
  "status": "success",
  "message": "Registration successful.",
  "data": {
    "token": "jwt",
    "user": {}
  }
}
```

Errors:
- `409` duplicate email/username
- `422` validation

---

### `POST /api/auth/login`

Request body:

```json
{
  "email": "john@example.com",
  "password": "StrongPass1"
}
```

Logic:
- Finds user by email (selects password explicitly).
- Compares password.
- Returns JWT and public user profile.

Response `200`:

```json
{
  "status": "success",
  "message": "Login successful.",
  "data": {
    "token": "jwt",
    "user": {}
  }
}
```

Errors:
- `401` invalid email/password
- `422` validation

---

### `GET /api/auth/me`

- Protected.

Logic:
- Uses JWT `sub`.
- Returns current user public profile.

Response `200`:

```json
{
  "status": "success",
  "message": "Profile retrieved.",
  "data": {
    "user": {}
  }
}
```

Errors:
- `401` auth errors
- `404` user not found

---

### `GET /api/ideas`

- Public.

Query params:
- `page` (int >= 1, default `1`)
- `limit` (int 1..50, default `10`)
- `sort` one of: `votes`, `date`, `-votes`, `-date` (default `-date`)
- `search` (text search over title+description)
- `tags` (`string` or `string[]`)

Logic:
- Uses MongoDB text search if `search`.
- Tags filter uses case-normalized `$in`.
- Pagination metadata returned.

Response `200`:

```json
{
  "status": "success",
  "message": "Ideas retrieved.",
  "data": {
    "ideas": []
  },
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  }
}
```

---

### `GET /api/ideas/:id`

- Public.

Logic:
- Returns one idea with:
  - populated `author`
  - populated `comments.author`
  - comments sorted desc by `createdAt`
  - comments limited by `IDEA_COMMENTS_PREVIEW_LIMIT`

Response `200`:

```json
{
  "status": "success",
  "message": "Idea retrieved.",
  "data": {
    "idea": {}
  }
}
```

Errors:
- `404` idea not found

---

### `POST /api/ideas`

- Protected.

Request body:

```json
{
  "title": "A better voting UI",
  "description": "Detailed description ...",
  "tags": ["ui", "voting"]
}
```

Validation:
- `title`: 5-120
- `description`: 10-2000
- `tags`: max 10 items, each max 30 chars, lowercased/trimmed

Logic:
- Creates idea with authenticated user as `author`.
- Broadcasts WebSocket `NEW_IDEA`.

Response `201`:

```json
{
  "status": "success",
  "message": "Idea created.",
  "data": {
    "idea": {}
  }
}
```

---

### `PATCH /api/ideas/:id`

- Protected.

Request body (at least one field required):

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "tags": ["tag"]
}
```

Logic:
- Only idea owner can update.

Response `200`:

```json
{
  "status": "success",
  "message": "Idea updated.",
  "data": {
    "idea": {}
  }
}
```

Errors:
- `403` non-owner
- `404` idea not found
- `422` validation

---

### `DELETE /api/ideas/:id`

- Protected.

Logic:
- Only idea owner can delete.

Response `200`:

```json
{
  "status": "success",
  "message": "Idea deleted."
}
```

Errors:
- `403` non-owner
- `404` idea not found

---

### `POST /api/ideas/:id/vote`

- Protected.

Request body:

```json
{
  "value": 1
}
```

Validation:
- `value` must be `1` or `-1`

Voting logic (transactional):
- Loads idea in MongoDB session.
- Rejects voting own idea (`403`).
- Reads existing vote `(user, idea)`:
  - no existing vote: create vote, `votesCount += value`
  - same value again: remove vote (toggle off), `votesCount -= value`
  - opposite value: update vote, `votesCount += value * 2`
- Commits transaction.
- Broadcasts WebSocket `VOTE_UPDATE`.

Response `200`:

```json
{
  "status": "success",
  "message": "Vote recorded.",
  "data": {
    "idea": {},
    "voteState": 1
  }
}
```

`voteState` values:
- `1` upvoted
- `-1` downvoted
- `null` no current vote (after toggle-off)

Errors:
- `403` own idea vote
- `404` idea not found
- `422` validation

---

### `GET /api/ideas/:id/vote`

- Protected.

Logic:
- Returns authenticated user's current vote state for idea.

Response `200`:

```json
{
  "status": "success",
  "message": "Vote status retrieved.",
  "data": {
    "voteState": 1
  }
}
```

`voteState` can be `1`, `-1`, or `null`.

---

### `GET /api/ideas/:id/comments`

- Public.

Logic:
- Ensures idea exists.
- Returns all comments for idea, newest first.

Response `200`:

```json
{
  "status": "success",
  "message": "Comments retrieved.",
  "data": {
    "comments": []
  }
}
```

Errors:
- `404` idea not found

---

### `POST /api/ideas/:id/comments`

- Protected.

Request body:

```json
{
  "content": "Nice idea"
}
```

Validation:
- `content`: 1-1000 chars

Logic:
- Ensures idea exists.
- Creates comment with authenticated user as author.
- Broadcasts WebSocket `NEW_COMMENT`.

Response `201`:

```json
{
  "status": "success",
  "message": "Comment added.",
  "data": {
    "comment": {}
  }
}
```

Errors:
- `404` idea not found
- `422` validation

---

### `DELETE /api/comments/:commentId`

- Protected.

Logic:
- Only comment owner can delete.

Response `200`:

```json
{
  "status": "success",
  "message": "Comment deleted."
}
```

Errors:
- `403` non-owner
- `404` comment not found

## 7. WebSocket contract

## Connection

- URL: `ws://<host>:<port><WS_PATH>`
- Token is required:
  - query: `?token=<jwt>`
  - or header: `Authorization: Bearer <jwt>` during handshake
- Missing/invalid token -> close code `1008`

## Server -> client events

### `CONNECTED`

Sent after successful authentication.

```json
{
  "type": "CONNECTED",
  "payload": {
    "message": "Connected to Idea Voting Board.",
    "authenticated": true
  }
}
```

### `ONLINE_USERS`

Broadcast on connect/disconnect.

```json
{
  "type": "ONLINE_USERS",
  "payload": {
    "count": 2,
    "userIds": ["userId1", "userId2"]
  }
}
```

### `NEW_IDEA`

Broadcast when API creates an idea.

```json
{
  "type": "NEW_IDEA",
  "payload": {}
}
```

### `VOTE_UPDATE`

Broadcast when vote is cast/toggled/changed.

```json
{
  "type": "VOTE_UPDATE",
  "payload": {
    "ideaId": "ideaId",
    "votesCount": 10,
    "voteState": 1
  }
}
```

### `NEW_COMMENT`

Broadcast when comment is created.

```json
{
  "type": "NEW_COMMENT",
  "payload": {
    "ideaId": "ideaId",
    "comment": {}
  }
}
```

### `PONG`

Reply to `PING`.

```json
{
  "type": "PONG",
  "payload": {
    "ts": 1710000000000
  }
}
```

### `ERROR`

Sent when incoming frame is not valid JSON.

```json
{
  "type": "ERROR",
  "payload": {
    "message": "Invalid message format."
  }
}
```

## Client -> server events

### `PING`

```json
{
  "type": "PING"
}
```

Any other event type is ignored (no explicit response).

## 8. Logic summary (quick rules)

- Passwords are hashed before save.
- JWT secret/expiry come from env config.
- Sensitive password field is never returned by API responses.
- Controllers are thin; DB/business logic is in services.
- Vote uniqueness is enforced by unique index `(user, idea)`.
- Vote changes are transaction-protected.
- Idea owner cannot vote own idea.
- Comment delete and idea update/delete are owner-protected.
