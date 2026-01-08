import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { networkInterfaces } from 'os';
import crypto from 'crypto';

const PORT = 8787;
const app = express();
const server = createServer(app);
// Don't bind 'server' here so we can handle upgrade manually for auth
const wss = new WebSocketServer({ noServer: true });

// --- State ---
let PAIRING_CODE = generateCode();
const TOKENS = new Set();
// Approvals: Array of { id, createdAt, kind, details, status, decidedAt }
const APPROVALS = [];

// --- Helpers ---
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

function getLocalIPs() {
    const nets = networkInterfaces();
    const results = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                results.push(net.address);
            }
        }
    }
    return results;
}

function broadcast(event, payload) {
    const msg = JSON.stringify({
        event,
        payload,
        ts: new Date().toISOString()
    });
    for (const client of wss.clients) {
        if (client.readyState === 1) { // OPEN
            client.send(msg);
        }
    }
}

// --- Middleware ---
app.use(express.json());
app.use(express.static('public'));

const requireAuth = (req, res, next) => {
    const token = req.headers['x-ag-token'];
    if (!token || !TOKENS.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// --- HTTP Endpoints ---

// Public
app.get('/health', (req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
});

app.post('/pair/claim', (req, res) => {
    const { code } = req.body;
    if (!code || code !== PAIRING_CODE) {
        return res.status(403).json({ error: 'invalid_code' });
    }
    const token = generateToken();
    TOKENS.add(token);
    console.log(`[AUTH] New device paired. Token created.`);
    res.json({ token });
});

// Protected
app.get('/status', requireAuth, (req, res) => {
    const pending = APPROVALS.filter(a => a.status === 'pending').length;
    res.json({
        ok: true,
        ts: new Date().toISOString(),
        pendingApprovals: pending,
        totalApprovals: APPROVALS.length
    });
});

app.get('/approvals', requireAuth, (req, res) => {
    const sorted = [...APPROVALS].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ approvals: sorted });
});

app.post('/approvals/:id/approve', requireAuth, (req, res) => {
    const { id } = req.params;
    const approval = APPROVALS.find(a => a.id === id);
    if (!approval) return res.status(404).json({ error: 'not_found' });

    if (approval.status !== 'pending') {
        return res.status(409).json({ error: 'already_decided', approval });
    }

    approval.status = 'approved';
    approval.decidedAt = new Date().toISOString();

    console.log(`[APPROVAL] ${id} APPROVED`);
    broadcast('approval_decided', { id, status: 'approved' });
    res.json({ ok: true, approval });
});

app.post('/approvals/:id/deny', requireAuth, (req, res) => {
    const { id } = req.params;
    const approval = APPROVALS.find(a => a.id === id);
    if (!approval) return res.status(404).json({ error: 'not_found' });

    if (approval.status !== 'pending') {
        return res.status(409).json({ error: 'already_decided', approval });
    }

    approval.status = 'denied';
    approval.decidedAt = new Date().toISOString();

    console.log(`[APPROVAL] ${id} DENIED`);
    broadcast('approval_decided', { id, status: 'denied' });
    res.json({ ok: true, approval });
});

app.post('/debug/create-approval', requireAuth, (req, res) => {
    const { kind, details } = req.body;
    const newApproval = {
        id: `appr_${crypto.randomBytes(4).toString('hex')}`,
        createdAt: new Date().toISOString(),
        kind: kind || 'command',
        details: details || { cmd: 'echo "Hello World"', risk: 'low' },
        status: 'pending',
        decidedAt: null
    };

    APPROVALS.push(newApproval);
    console.log(`[DEBUG] Created test approval ${newApproval.id}`);
    broadcast('approval_requested', newApproval);
    res.json(newApproval);
});

// --- WebSocket Handling ---
server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    const pathname = url.pathname;

    if (pathname !== '/events') {
        socket.destroy();
        return;
    }

    if (!token || !TOKENS.has(token)) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ event: 'hello', payload: { ts: new Date().toISOString() } }));
});

// --- Start ---
server.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIPs();
    console.log('='.repeat(50));
    console.log(` AG Bridge v1 running on port ${PORT}`);
    console.log('='.repeat(50));
    console.log(` PAIRING CODE: [ ${PAIRING_CODE} ]`);
    console.log('-'.repeat(50));
    console.log(' Open on your phone:');
    ips.forEach(ip => {
        console.log(` http://${ip}:${PORT}`);
    });
    console.log('='.repeat(50));
});
