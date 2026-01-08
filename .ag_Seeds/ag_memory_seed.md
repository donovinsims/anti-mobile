# AG Memory Seed — ag_bridge (LAN-only Companion App v1)

> **Purpose:** This is your persistent operating context for building and evolving **ag_bridge** — a local “phone app” (PWA-ish web UI) + approval-gated control plane for supervising agent work on the same LAN.  
> **Tone:** Build it like it’s going to be used at 2:57 AM by someone tired and impatient (Mario), and the agent is feeling “creative.”  
> **Prime directive:** **No money. No cloud. No domains. LAN-only v1.**

---

## 0) What we are building (in one breath)

**ag_bridge** is a **local daemon** running on the developer laptop that:
- serves a **mobile-friendly dashboard** reachable from a phone on the **same Wi-Fi**
- supports **pairing** (6-digit code shown on laptop) → token stored on phone
- maintains an **approval queue** (pending/approved/denied)
- provides **approve/deny** actions from phone
- streams **live updates** over **WebSocket**
- provides a **debug endpoint** to create test approvals for immediate UX validation

**Not in v1:** remote access, push notifications, Cloudflare, Tailscale, native iOS/Android, production-grade PKI. (We can do those later; your job is to ship v1 that works.)

---

## 1) Non-negotiables (Mario’s rules + safety)

### 1.1 Safety and operational discipline
- **Do NOT** run destructive commands: no `rm -rf`, no format/disk tools, no registry edits, no “cleanup” scripts that delete folders.
- **Do NOT** change permissions (`chmod`, `chown`) unless you created the file/dir and it’s required for normal dev.
- **Do NOT** expose this publicly to the internet in v1.
- **Do NOT** build “security theater.” v1 security = pairing + token auth + LAN-only. Keep it simple and real.

### 1.2 Scope control
- v1 must be runnable with:
  - Node installed
  - `npm install`
  - `node server.mjs`
- No external dependencies beyond small Node libs (Express + ws).
- No database in v1. In-memory is acceptable.

### 1.3 UX expectations
- The “app” must be usable on a phone screen:
  - large buttons
  - readable text
  - minimal navigation friction

---

## 2) Success definition (Definition of Done)

**DoD for v1**
1) From phone on same Wi-Fi, user can load `http://<laptop-ip>:8787/`.
2) User can pair using 6-digit code printed by server.
3) Paired token is stored (localStorage).
4) Approvals list renders; user can approve/deny pending approvals.
5) WebSocket event log shows real-time events (`approval_requested`, `approval_decided`).
6) Debug button creates a test approval immediately (no Antigravity integration required yet).
7) README tells a human how to run it and troubleshoot firewall/Wi-Fi.

If any of these fail, it’s not done.

---

## 3) Repo layout (keep it boring; boring ships)

Create this structure:

```
ag-bridge/
  package.json
  server.mjs
  public/
    index.html
  README.md
```

- No monorepo.
- No build tool required.
- Plain HTML + JS for the UI is acceptable.

---

## 4) Local infra assumptions

### 4.1 LAN-only operation
- The server must bind to **0.0.0.0** so other devices on the LAN can connect.
- The phone and laptop must be on the same local network (not guest Wi-Fi).

### 4.2 Windows firewall reality
- Windows often blocks inbound connections by default.
- README must include guidance: allow Node on **Private networks** or open port **8787**.

---

## 5) API contract (MUST match; build UI against this)

### 5.1 Auth pattern
- Server generates a **6-digit pairing code** at startup and prints it to console.
- Pairing exchanges `{ code }` for `{ token }`.
- Token required on all protected endpoints via header: `x-ag-token`.
- WebSocket requires token as query parameter: `/events?token=...`.

### 5.2 Endpoints
- `GET /health`
  - returns `{ ok: true, ts }`

- `POST /pair/claim`
  - body: `{ code }`
  - success: `{ token }`
  - failure: 403 `{ error: "invalid_code" }`

- `GET /status` (auth)
  - returns `{ ok: true, ts, pendingApprovals, totalApprovals }`

- `GET /approvals` (auth)
  - returns `{ approvals: [...] }` newest-first

- `POST /approvals/:id/approve` (auth)
  - returns `{ ok: true, approval }`
  - conflict if already decided

- `POST /approvals/:id/deny` (auth)
  - returns `{ ok: true, approval }`
  - conflict if already decided

- `POST /debug/create-approval` (auth)
  - creates a pending approval (kind/details default if not provided)
  - broadcasts ws event `approval_requested`

### 5.3 Approval object shape
Use a stable shape:

```json
{
  "id": "appr_abcdef",
  "createdAt": "2026-01-07T12:34:56.000Z",
  "kind": "command",
  "details": { "cmd": "pnpm test", "cwd": ".", "risk": "yellow" },
  "status": "pending",
  "decidedAt": null
}
```

## 6) WebSocket contract (small and predictable)
Path: `/events`

Messages: JSON objects:

```json
{ "event": "approval_requested", "payload": { ...approval }, "ts": "..." }
{ "event": "approval_decided", "payload": { "id": "...", "status": "approved" }, "ts": "..." }
{ "event": "hello", "payload": { "ts": "..." }, "ts": "..." }
```

If token missing/invalid: close connection with a policy/unauthorized code.

## 7) UI behavior requirements (phone-first)

### 7.1 Pairing flow
- Show pairing input when token missing.
- On successful pairing:
  - store token in localStorage
  - connect WebSocket
  - fetch status and approvals
  - render main dashboard

### 7.2 Dashboard must include
- Status summary: pending count, timestamp
- Approvals list (newest first)
  - show kind, status, createdAt
  - show details pretty-printed
  - Approve/Deny buttons for pending only
- Button: “Create test approval”
- Event log panel fed by WebSocket messages
- Reset/Logout button (clears token; returns to pairing)

### 7.3 Visual constraints
- no tiny UI
- no hidden critical actions behind menu labyrinth
- prioritize “tap-friendly” controls

## 8) Implementation notes (how to keep yourself from overengineering)

### 8.1 Start with HTTP
v1 can be plain HTTP on LAN. HTTPS can come in v1.1 if needed.

### 8.2 Keep state in-memory
- approvals: array
- tokens: Set
- websocket clients: Map(token → Set(ws))

No persistence required in v1. If server restarts, pairing code changes and approvals reset — acceptable for MVP.

### 8.3 Logging
On startup, print:
- “AG Bridge running”
- pairing code
- “Open from phone: http://<ip>:8787”

On important events, log:
- paired token created (do NOT print token in logs if you can avoid it)
- approval created
- approval decided

## 9) Testing approach (minimal but real)

### 9.1 Manual smoke test (must pass)
1. Start server.
2. Open from phone.
3. Pair.
4. Create test approval.
5. Approve.
6. See UI update + ws event log.

### 9.2 Optional quick script test (nice-to-have)
A tiny Node script or curl commands in README to validate endpoints.
Do NOT add heavy test frameworks in v1 unless it’s effortless.

## 10) Troubleshooting guide (must be in README)
Include these common failures:

- Phone can’t load page:
  - wrong IP
  - different Wi-Fi (guest network)
  - firewall blocking port
  - server bound to 127.0.0.1 instead of 0.0.0.0

- Pairing fails:
  - wrong code
  - server restarted (code changed)

- WebSocket not updating:
  - network hiccup
  - token invalid
  - check browser console

## 11) Future roadmap notes (v2+ — do NOT build now)

### 11.1 Anywhere access
Pick one later:
- Tailscale / WireGuard (private, easiest)
- Cloudflare Tunnel + Access (nice URL, no VPN)

### 11.2 Stronger security
- Replace pairing code with device keys + mTLS
- Add audit log persistence
- Add role-based policy/risk tiers

### 11.3 Antigravity integration (MCP)
Bridge becomes MCP server:
- `request_approval()`
- `safe_exec()`
- `safe_fs_write()`

Agent work must route through Bridge tools. Approvals become the enforcement boundary.

**But again: do not implement this in v1 unless explicitly told.**

## 12) “How to work” instructions (process discipline)

When implementing:
1. Create the repo skeleton.
2. Implement server endpoints + ws.
3. Implement basic UI.
4. Verify LAN access from phone.
5. Add debug create approval.
6. Confirm approve/deny changes status and broadcasts.
7. Write README last (but fully).

Always produce:
- what files changed
- how to run
- what to test
- what assumptions you made

## 13) Anti-footgun heuristics (because agents are chaos monkeys)
- If uncertain, choose the safer behavior.
- Prefer explicit allowlists later; in v1 just ensure approvals can’t be faked without token.
- Never assume “LAN == safe.”
- Never add “auto-approve” logic.
- Never hide the pairing code anywhere except the laptop console.

## 14) Current version tag
**ag_bridge v1** = LAN-only + pairing token + approvals + WebSocket + debug endpoint.

That’s the seed. Don’t get fancy. Ship the thing. Then we can make it scary good.