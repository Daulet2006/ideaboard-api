# IdeaBoard API

Backend service for IdeaBoard.  
Stack: **Node.js, Express, MongoDB (Mongoose), Joi, WebSocket (`ws`)**.

## Main Responsibilities

- Authentication and profile management
- Idea CRUD and idea voting
- Comment CRUD, replies, and comment voting
- Notification delivery (DB + real-time push)
- Popular ideas API with pagination

## API Base

By default all routes are prefixed with:

```text
/api
```

Example health endpoint:

```http
GET /api/health
```

## Notifications

Supported notification types:

- `direct`
- `moderation`
- `system`
- `LIKE_IDEA`
- `LIKE_COMMENT`
- `REPLY_COMMENT`

Automatic notifications are created for:

- idea like
- comment like
- reply to comment

Self-notifications are intentionally skipped.

## Popular Ideas

Endpoint:

```http
GET /api/ideas/popular?page=1&limit=10
```

Response shape:

```json
{
  "status": "success",
  "message": "Popular ideas retrieved.",
  "data": { "items": [] },
  "meta": {
    "page": 1,
    "totalPages": 1,
    "total": 0,
    "limit": 10
  }
}
```

## Vote and Comment Schema Notes

- `Comment` includes `isEdited` (defaults to `false`).
- On content change in edit flow, `isEdited` becomes `true`.
- `Vote` includes `voteType` (`idea` or `comment`).
- `voteType` is auto-derived from target for backward compatibility.

## Local Development

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — run with nodemon
- `npm run start` — run with node
- `npm run lint` — lint `src/**/*.js`
- `npm test` — run Jest

Coverage:

```bash
npm test -- --coverage
```

## Testing Strategy (Current)

- Unit tests for models and utilities
- Controller tests with mocked services
- Integration tests via Supertest for API behavior

Current suites cover:

- Mongoose validation (`Vote`, `Comment`)
- Utility helpers (`apiResponse`, `jwt`)
- Controller behavior (`vote.controller`)
- API integration (`health`, route validation, auth guard)

## Practical Notes

- Keep DB indexes in sync with schema changes.
- Avoid destructive cleanup commands on shared environments.
- Supertest integration tests may require permission to bind local ports in restricted sandboxes.
