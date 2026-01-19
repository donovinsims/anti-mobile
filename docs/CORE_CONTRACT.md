# Core Contract

This document acts as the source of truth for the API contract between `ag_bridge` (Core) and its clients (Pro Mobile, Extension, etc.).

## 1. API Endpoints

### HTTP
- `GET /health`: Returns `{ ok: true, name: 'ag_bridge' }`. Status 200.
- `GET /unapproved`: Returns a list of pending approval requests.
- `POST /approval_response`: Endpoint to approve or deny a request.
    - **Body**: `{ "id": "...", "status": "approved" | "denied" }`

### WebSocket
- **URL**: `ws://<host>:<port>/events` (Default port 3000)
- **Events**: Server pushes events to connected clients.

## 2. Event Schema

All events follow this envelope structure:

```json
{
  "type": "event_type_string",
  "payload": { ... },
  "timestamp": "ISO-8601 string"
}
```

### Required Event Types

- `approval_requested`: Emitted when a tool requires user approval.
    - **Payload**:
        ```json
        {
          "id": "unique-request-id",
          "tool_name": "run_command",
          "args": { ... },
          "message": "User text..."
        }
        ```

- `approval_resolved`: Emitted when a request is handled (approved/denied).
    - **Payload**:
        ```json
        {
          "id": "unique-request-id",
          "status": "approved" | "denied"
        }
        ```

## 3. Versioning

- The API uses semantic versioning.
- Breaking changes will be signaled by a major version bump in `package.json` and this document.
